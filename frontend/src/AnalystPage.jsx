import React, { useEffect, useMemo, useState } from "react";
import "./AnalystPage.css";

const API = "http://127.0.0.1:8000/api";

const HAZARDS = {
  flood: {
    name: "Flood",
    icon: "🌊",
    color: "#22d3ee",
    description: "Water level and rainfall based flood prediction",
    actions: [
      "Activate flood warning",
      "Monitor water level continuously", 
      "Prepare drainage / pumping system",
      "Alert nearby personnel",
    ],
  },

  water_quality: {
    name: "Water Quality",
    icon: "💧",
    color: "#38bdf8",
    description: "Water contamination and quality prediction",
    actions: [
      "Flag water source for inspection",
      "Increase sampling frequency",
      "Check pH and turbidity",
      "Alert responsible authorities",
    ],
  },

  chemical_leak: {
    name: "Chemical Leak",
    icon: "☣️",
    color: "#c084fc",
    description: "Industrial gas and chemical exposure prediction",
    actions: [
      "Activate chemical leak warning",
      "Restrict access to affected zone",
      "Increase gas monitoring",
      "Alert emergency personnel",
    ],
  },

  landslide: {
    name: "Landslide",
    icon: "⛰️",
    color: "#a78bfa",
    description: "Slope stability and ground movement prediction",
    actions: [
      "Restrict access to unstable area",
      "Increase vibration monitoring",
      "Check soil moisture and tilt",
      "Alert nearby personnel",
    ],
  },

  extreme_heat: {
    name: "Extreme Heat",
    icon: "🌡️",
    color: "#fb923c",
    description: "Heat index and thermal risk prediction",
    actions: [
      "Issue heat warning",
      "Monitor temperature continuously",
      "Recommend hydration / cooling measures",
      "Alert exposed personnel",
    ],
  },

  air_pollution: {
    name: "Air Pollution",
    icon: "🌫️",
    color: "#facc15",
    description: "Air quality and pollutant concentration prediction",
    actions: [
      "Issue air quality warning",
      "Increase pollution monitoring",
      "Restrict exposure in affected zone",
      "Alert responsible authorities",
    ],
  },

  forest_fire: {
    name: "Forest Fire",
    icon: "🔥",
    color: "#ff7043",
    description: "Temperature, smoke and gas based fire prediction",
    actions: [
      "Activate fire-response protocol",
      "Alert nearby personnel",
      "Increase smoke and temperature monitoring",
      "Prepare emergency response",
    ],
  },
};

function normalizeHazard(value) {
  if (!value) return "";

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function formatName(value) {
  if (!value) return "Unknown";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRiskLevel(risk) {
  const value = Number(risk) || 0;

  if (value >= 80) return "CRITICAL";
  if (value >= 60) return "HIGH";
  if (value >= 40) return "MEDIUM";
  return "LOW";
}

function getRiskClass(risk) {
  const level = getRiskLevel(risk);

  if (level === "CRITICAL") return "critical";
  if (level === "HIGH") return "high";
  if (level === "MEDIUM") return "medium";

  return "low";
}

function formatSensorName(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSensorValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value
      : Number(value).toFixed(2);
  }

  return value;
}

function getLatestEvents(events) {
  const latest = {};

  for (const event of events) {
    const hazard = normalizeHazard(event.hazard);

    if (!hazard) continue;

    if (!latest[hazard]) {
      latest[hazard] = event;
      continue;
    }

    const currentTime = new Date(event.last_updated || event.start_time || 0);
    const previousTime = new Date(
      latest[hazard].last_updated ||
        latest[hazard].start_time ||
        0
    );

    if (currentTime > previousTime) {
      latest[hazard] = event;
    }
  }

  return latest;
}

export default function AnalystPage() {
  const [events, setEvents] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState("forest_fire");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadEvents() {
    try {
      setError("");

      const response = await fetch(`${API}/events`);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result = await response.json();

      const eventData = Array.isArray(result)
        ? result
        : result.data || [];

      setEvents(eventData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("AI Analyst error:", err);
      setError("Unable to connect to ENVIGUARD backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();

    const interval = setInterval(loadEvents, 5000);

    return () => clearInterval(interval);
  }, []);

  const latestEvents = useMemo(
    () => getLatestEvents(events),
    [events]
  );

  const selectedEvent =
    latestEvents[selectedHazard] ||
    events.find(
      (event) =>
        normalizeHazard(event.hazard) === selectedHazard
    );

  const hazardInfo =
    HAZARDS[selectedHazard] || {
      name: formatName(selectedHazard),
      icon: "⚠️",
      color: "#22d3ee",
      description: "Environmental risk analysis",
      actions: [
        "Continue monitoring",
        "Verify sensor readings",
        "Review environmental conditions",
        "Take appropriate safety action",
      ],
    };

  const risk = Number(selectedEvent?.risk_score || 0);
  const confidence = Number(selectedEvent?.confidence || 0);

  const severity =
    selectedEvent?.severity || getRiskLevel(risk);

  const trend =
    selectedEvent?.trend || "MONITORING";

  const prediction =
    selectedEvent?.prediction ||
    "Insufficient prediction data available.";

  const sensorReadings =
    selectedEvent?.sensor_readings || {};

  const activeHazards = Object.keys(HAZARDS).map(
    (hazardKey) => ({
      key: hazardKey,
      info: HAZARDS[hazardKey],
      event: latestEvents[hazardKey],
    })
  );

  return (
    <div className="analyst-page">

      {/* HEADER */}
      <section className="analyst-header">

        <div>
          <div className="eyebrow">
            ENVIGUARD • PREDICTIVE INTELLIGENCE
          </div>

          <h1>AI Environmental Analyst</h1>

          <p>
            Detect environmental threats, analyse sensor
            behaviour and predict developing risk conditions.
          </p>
        </div>

        <div className="analyst-status">
          <span className="status-dot"></span>
          AI ENGINE ONLINE
        </div>

      </section>

      {/* ERROR */}
      {error && (
        <div className="analyst-error">
          <strong>Backend Connection Problem</strong>
          <span>{error}</span>
        </div>
      )}

      {/* HAZARD SELECTOR */}
      <section className="hazard-selector">

        <div className="section-title">
          Select Environmental Threat
        </div>

        <div className="hazard-buttons">

          {activeHazards.map(({ key, info, event }) => {

            const eventRisk = Number(event?.risk_score || 0);

            return (
              <button
                key={key}
                className={`hazard-button ${
                  selectedHazard === key ? "selected" : ""
                }`}
                onClick={() => setSelectedHazard(key)}
                style={{
                  "--hazard-color": info.color,
                }}
              >

                <span className="hazard-icon">
                  {info.icon}
                </span>

                <span className="hazard-button-content">

                  <strong>{info.name}</strong>

                  <small>
                    {event
                      ? `${eventRisk.toFixed(1)}% risk`
                      : "No data"}
                  </small>

                </span>

              </button>
            );
          })}

        </div>

      </section>

      {/* MAIN ANALYSIS */}
      <section className="analysis-grid">

        {/* LEFT */}
        <div className="analysis-main">

          {/* TITLE CARD */}
          <div
            className="threat-card"
            style={{
              "--hazard-color": hazardInfo.color,
            }}
          >

            <div className="threat-icon">
              {hazardInfo.icon}
            </div>

            <div className="threat-info">

              <span className="threat-label">
                CURRENT ANALYSIS
              </span>

              <h2>{hazardInfo.name}</h2>

              <p>{hazardInfo.description}</p>

              {selectedEvent && (
                <div className="node-label">
                  NODE • {selectedEvent.node_id}
                </div>
              )}

            </div>

            <div
              className={`severity-badge ${getRiskClass(risk)}`}
            >
              {severity}
            </div>

          </div>

          {/* RISK */}
          <div className="analysis-card">

            <div className="card-heading">

              <div>
                <span className="eyebrow-small">
                  RISK ASSESSMENT
                </span>

                <h3>Current Environmental Risk</h3>
              </div>

              <div className={`risk-number ${getRiskClass(risk)}`}>
                {risk.toFixed(1)}%
              </div>

            </div>

            <div className="risk-bar">

              <div
                className={`risk-fill ${getRiskClass(risk)}`}
                style={{
                  width: `${Math.min(100, risk)}%`,
                }}
              />

            </div>

            <div className="risk-scale">
              <span>LOW</span>
              <span>MEDIUM</span>
              <span>HIGH</span>
              <span>CRITICAL</span>
            </div>

          </div>

          {/* SENSOR READINGS */}
          <div className="analysis-card">

            <div className="card-heading">

              <div>
                <span className="eyebrow-small">
                  LIVE SENSOR DATA
                </span>

                <h3>Environmental Measurements</h3>
              </div>

              <span className="live-indicator">
                <span></span>
                LIVE
              </span>

            </div>

            {Object.keys(sensorReadings).length > 0 ? (

              <div className="sensor-grid">

                {Object.entries(sensorReadings).map(
                  ([key, value]) => (

                    <div
                      className="sensor-card"
                      key={key}
                    >

                      <span className="sensor-name">
                        {formatSensorName(key)}
                      </span>

                      <strong className="sensor-value">
                        {formatSensorValue(value)}
                      </strong>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="no-data">
                No sensor readings available for this
                hazard yet.
              </div>

            )}

          </div>

          {/* AI PREDICTION */}
          <div
            className="prediction-card"
            style={{
              "--hazard-color": hazardInfo.color,
            }}
          >

            <div className="prediction-header">

              <div className="prediction-icon">
                🧠
              </div>

              <div>
                <span className="eyebrow-small">
                  PREDICTIVE INTELLIGENCE
                </span>

                <h3>AI Risk Forecast</h3>
              </div>

              <div className="confidence">

                <span>CONFIDENCE</span>

                <strong>
                  {confidence.toFixed(0)}%
                </strong>

              </div>

            </div>

            <div className="prediction-body">

              <div className="prediction-label">
                FORECAST
              </div>

              <p>
                {prediction}
              </p>

            </div>

            <div className="prediction-footer">

              <div>
                <span>TREND</span>
                <strong>{formatName(trend)}</strong>
              </div>

              <div>
                <span>FORECAST WINDOW</span>
                <strong>Next 15–30 minutes</strong>
              </div>

              <div>
                <span>NODE</span>
                <strong>
                  {selectedEvent?.node_id || "—"}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <aside className="analysis-side">

          {/* STATUS */}
          <div className="side-card">

            <div className="side-card-title">
              <span>THREAT STATUS</span>
            </div>

            <div
              className={`big-status ${getRiskClass(risk)}`}
            >
              {hazardInfo.icon}
              <strong>{getRiskLevel(risk)}</strong>
            </div>

            <p>
              Current risk level calculated from the latest
              environmental sensor observations.
            </p>

          </div>

          {/* ACTIONS */}
          <div className="side-card">

            <div className="side-card-title">
              <span>RECOMMENDED ACTION</span>
            </div>

            <div className="action-list">

              {hazardInfo.actions.map(
                (action, index) => (

                  <div
                    className="action-item"
                    key={index}
                  >

                    <span className="action-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>{action}</span>

                  </div>

                )
              )}

            </div>

          </div>

          {/* SYSTEM LOGIC */}
          <div className="side-card logic-card">

            <div className="side-card-title">
              <span>ENVIGUARD DECISION PIPELINE</span>
            </div>

            <div className="pipeline">

              <div className="pipeline-step active">
                <span>01</span>
                <strong>DETECT</strong>
                <small>Sensor signals</small>
              </div>

              <div className="pipeline-line"></div>

              <div className="pipeline-step active">
                <span>02</span>
                <strong>ANALYSE</strong>
                <small>Risk assessment</small>
              </div>

              <div className="pipeline-line"></div>

              <div className="pipeline-step active">
                <span>03</span>
                <strong>PREDICT</strong>
                <small>Trend forecast</small>
              </div>

              <div className="pipeline-line"></div>

              <div className="pipeline-step active">
                <span>04</span>
                <strong>ACT</strong>
                <small>Recommended response</small>
              </div>

            </div>

          </div>

          {/* UPDATE */}
          <div className="last-update">

            <span className="update-dot"></span>

            <span>
              Last analysis update:
            </span>

            <strong>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "Loading..."}
            </strong>

          </div>

        </aside>

      </section>

      {/* FOOTER */}
      <footer className="analyst-footer">

        <span>
          ENVIGUARD AI • MULTI-HAZARD ENVIRONMENTAL
          INTELLIGENCE
        </span>

        <span>
          Automatic analysis every 5 seconds
        </span>

      </footer>

    </div>
  );
}