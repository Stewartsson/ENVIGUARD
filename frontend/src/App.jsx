import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gauge,
  Globe2,
  Droplets,
  Factory,
  FileText,
  Map,
  Mountain,
  RefreshCw,
  Shield,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LiveMap from "./LiveMap";
import EventsPageLive from "./EventsPage";
import AnalystPageLive from "./AnalystPage";
import "./App.css";

const API = "https://enviguard-backend.onrender.com/api";

const HAZARDS = [
  {
    key: "flood",
    name: "Flood",
    node: "RIVER_01",
    icon: Droplets,
    color: "#22d3ee",
    description: "River and rainfall based flood monitoring",
    parameters: ["water_level", "rainfall", "soil_moisture", "temperature", "humidity"],
  },
  {
    key: "forest_fire",
    name: "Forest Fire",
    node: "FOREST_01",
    icon: Flame,
    color: "#ff5b35",
    description: "Forest temperature, smoke and gas monitoring",
    parameters: ["temperature", "humidity", "smoke", "gas", "wind_speed"],
  },
  {
    key: "air_pollution",
    name: "Air Pollution",
    node: "CITY_01",
    icon: Wind,
    color: "#facc15",
    description: "Urban air quality and pollutant monitoring",
    parameters: ["pm25", "pm10", "co", "no2", "temperature", "humidity"],
  },
  {
    key: "extreme_heat",
    name: "Extreme Heat",
    node: "HEAT_01",
    icon: Thermometer,
    color: "#fb923c",
    description: "Heat index and solar radiation monitoring",
    parameters: ["temperature", "humidity", "heat_index", "solar_radiation"],
  },
  {
    key: "landslide",
    name: "Landslide",
    node: "HILL_01",
    icon: Mountain,
    color: "#a78bfa",
    description: "Slope stability, vibration and soil monitoring",
    parameters: ["soil_moisture", "rainfall", "vibration", "soil_tilt", "temperature"],
  },
  {
    key: "chemical_leak",
    name: "Chemical Leak",
    node: "INDUSTRY_01",
    icon: Factory,
    color: "#d8b4fe",
    description: "Industrial gas and chemical exposure monitoring",
    parameters: ["gas", "voc", "co", "temperature", "humidity"],
  },
  {
    key: "water_quality",
    name: "Water Quality",
    node: "WATER_01",
    icon: Waves,
    color: "#38bdf8",
    description: "Water contamination and quality monitoring",
    parameters: ["ph", "turbidity", "tds", "temperature", "dissolved_oxygen"],
  },
];

const formatName = (value) => {
  if (!value) return "--";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatValue = (value) => {
  if (value === null || value === undefined) return "--";

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(1);
  }

  return value;
};

const getRiskClass = (risk) => {
  if (risk >= 80) return "critical";
  if (risk >= 60) return "high";
  if (risk >= 35) return "warning";
  return "safe";
};

const getSeverity = (risk) => {
  if (risk >= 80) return "CRITICAL";
  if (risk >= 60) return "HIGH";
  if (risk >= 35) return "WARNING";
  return "LOW";
};

function App() {
  const [page, setPage] = useState("command");
  const [selectedHazard, setSelectedHazard] = useState(null);

  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const [eventsResponse, alertsResponse] = await Promise.all([
        axios.get(`${API}/events`),
        axios.get(`${API}/alerts`),
      ]);

      setEvents(eventsResponse.data?.data || []);
      setAlerts(alertsResponse.data?.data || []);
      setBackendOnline(true);
    } catch (error) {
      console.error("Backend connection error:", error);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const latestEvents = useMemo(() => {
    const result = {};

    for (const event of events) {
      const node = event.node_id;

      if (!result[node] || event.last_updated > result[node].last_updated) {
        result[node] = event;
      }
    }

    return result;
  }, [events]);

  const criticalEvents = events.filter(
    (event) =>
      event.severity === "CRITICAL" ||
      Number(event.risk_score || 0) >= 80
  );

  const highRiskEvents = events.filter(
    (event) => Number(event.risk_score || 0) >= 60
  );

  const activeEvents = events.filter(
    (event) => event.status === "active" || !event.status
  );

  const openHazard = (hazard) => {
    setSelectedHazard(hazard);
    setPage("hazard");
  };

  const navigate = (target) => {
    setSelectedHazard(null);
    setPage(target);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div
          className="brand"
          onClick={() => navigate("command")}
        >
          <div className="brand-mark">
            <Shield size={23} />
          </div>

          <div>
            <div className="brand-name">
              ENVIGUARD <span>AI</span>
            </div>

            <div className="brand-subtitle">
              ENVIRONMENTAL INTELLIGENCE
            </div>
          </div>
        </div>

        <nav className="nav">
          <button
            className={page === "command" ? "active" : ""}
            onClick={() => navigate("command")}
          >
            COMMAND
          </button>

          <button
            className={page === "map" ? "active" : ""}
            onClick={() => navigate("map")}
          >
            LIVE MAP
          </button>

          <button
            className={page === "events" ? "active" : ""}
            onClick={() => navigate("events")}
          >
            EVENTS
          </button>

          <button
            className={page === "analyst" ? "active" : ""}
            onClick={() => navigate("analyst")}
          >
            AI ANALYST
          </button>

          <button
            className={page === "analytics" ? "active" : ""}
            onClick={() => navigate("analytics")}
          >
            ANALYTICS
          </button>

          <button
            className={page === "alerts" ? "active" : ""}
            onClick={() => navigate("alerts")}
          >
            ALERTS
          </button>

          <button
            className={page === "reports" ? "active" : ""}
            onClick={() => navigate("reports")}
          >
            REPORTS
          </button>
        </nav>

        <div className={`system-status ${backendOnline ? "online" : "offline"}`}>
          <span className="status-dot"></span>
          {backendOnline ? "SYSTEM ONLINE" : "API OFFLINE"}
        </div>
      </header>

      <main>
        {page === "command" && (
          <CommandPage
            hazards={HAZARDS}
            latestEvents={latestEvents}
            events={events}
            alerts={alerts}
            backendOnline={backendOnline}
            loading={loading}
            onRefresh={loadData}
            onOpenHazard={openHazard}
            onNavigate={navigate}
          />
        )}

        {page === "hazard" && selectedHazard && (
          <HazardPage
            hazard={selectedHazard}
            event={latestEvents[selectedHazard.node]}
            events={events}
            onBack={() => navigate("command")}
            onRefresh={loadData}
            onNavigate={navigate}
          />
        )}

        {page === "map" && <LiveMap />}

        {page === "events" && <EventsPageLive />}

        {page === "analyst" && <AnalystPageLive />}

        {page === "analytics" && (
          <AnalyticsPage
            hazards={HAZARDS}
            latestEvents={latestEvents}
            events={events}
          />
        )}

        {page === "alerts" && (
          <AlertsPage
            alerts={alerts}
            onOpenHazard={openHazard}
          />
        )}

        {page === "reports" && (
          <ReportsPage
            events={events}
            alerts={alerts}
            hazards={HAZARDS}
          />
        )}
      </main>

      <footer>
        <span>ENVIGUARD AI</span>
        <span>•</span>
        <span>MULTI-HAZARD ENVIRONMENTAL INTELLIGENCE NETWORK</span>
        <span>•</span>
        <span>7 HAZARDS</span>
      </footer>
    </div>
  );
}

/* =========================================================
   COMMAND PAGE
========================================================= */

function CommandPage({
  hazards,
  latestEvents,
  events,
  alerts,
  backendOnline,
  loading,
  onRefresh,
  onOpenHazard,
  onNavigate,
}) {
  const criticalCount = events.filter(
    (e) => e.severity === "CRITICAL" || Number(e.risk_score) >= 80
  ).length;

  const activeCount = events.filter(
    (e) => e.status === "active" || !e.status
  ).length;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span></span>
            MULTI-HAZARD ENVIRONMENTAL INTELLIGENCE
          </div>

          <h1>
            FROM SENSOR
            <br />
            SIGNALS TO
            <br />
            <strong>EARLY ACTION.</strong>
          </h1>

          <p>
            ENVIGUARD transforms distributed environmental sensor signals
            into real-time risk intelligence, prediction and actionable
            early warnings.
          </p>

          <div className="hero-actions">
            <button
              className="primary-btn"
              onClick={() => onNavigate("map")}
            >
              <Map size={17} />
              OPEN LIVE MAP
            </button>

            <button
              className="secondary-btn"
              onClick={() => onNavigate("analyst")}
            >
              <Brain size={17} />
              AI ANALYST
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>

          <div className="planet">
            <Globe2 size={150} strokeWidth={0.6} />
          </div>

          {hazards.map((hazard, index) => {
            const event = latestEvents[hazard.node];

            return (
              <div
                key={hazard.key}
                className={`sensor-pulse pulse-${index + 1}`}
                style={{ "--hazard-color": hazard.color }}
              >
                <span></span>
                <label>
                  {hazard.name.toUpperCase()}
                  <small>
                    {event
                      ? `${Number(event.risk_score || 0).toFixed(0)}% RISK`
                      : "MONITORING"}
                  </small>
                </label>
              </div>
            );
          })}

          <div className="hero-grid"></div>
        </div>
      </section>

      <section className="stats-strip">
        <Stat
          icon={<Activity />}
          label="TOTAL EVENTS"
          value={events.length}
        />

        <Stat
          icon={<AlertTriangle />}
          label="CRITICAL EVENTS"
          value={criticalCount}
          danger
        />

        <Stat
          icon={<Gauge />}
          label="HIGH RISK EVENTS"
          value={events.filter((e) => Number(e.risk_score) >= 60).length}
        />

        <Stat
          icon={<Shield />}
          label="ACTIVE EVENTS"
          value={activeCount}
        />
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="HAZARD NETWORK"
          title="Seven Environmental Threats."
          subtitle="Continuous monitoring across distributed environmental sensor nodes."
          right={
            <button className="refresh-btn" onClick={onRefresh}>
              <RefreshCw
                size={16}
                className={loading ? "spin" : ""}
              />
              REFRESH
            </button>
          }
        />

        <div className="hazard-grid">
          {hazards.map((hazard) => {
            const event = latestEvents[hazard.node];
            const risk = Number(event?.risk_score || 0);
            const Icon = hazard.icon;

            return (
              <button
                className="hazard-card"
                key={hazard.key}
                onClick={() => onOpenHazard(hazard)}
                style={{ "--hazard-color": hazard.color }}
              >
                <div className="card-top">
                  <div className="hazard-icon">
                    <Icon size={25} />
                  </div>

                  <span className="card-arrow">
                    <ChevronRight size={18} />
                  </span>
                </div>

                <div className="hazard-name">{hazard.name}</div>

                <div className="hazard-node">
                  {hazard.node}
                </div>

                <p>{hazard.description}</p>

                <div className="risk-row">
                  <div>
                    <small>RISK</small>

                    <strong>
                      {event ? `${risk.toFixed(1)}%` : "--"}
                    </strong>
                  </div>

                  <span
                    className={`severity-dot ${getRiskClass(risk)}`}
                  >
                    {event ? getSeverity(risk) : "WAITING"}
                  </span>
                </div>

                <div className="risk-line">
                  <span
                    style={{
                      width: `${Math.min(risk, 100)}%`,
                    }}
                  ></span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <SectionHeading
            eyebrow="THREAT ANALYSIS"
            title="Risk Overview"
            subtitle="Latest risk intelligence from all monitoring nodes."
          />

          <div className="risk-list">
            {hazards.map((hazard) => {
              const event = latestEvents[hazard.node];
              const risk = Number(event?.risk_score || 0);

              return (
                <div className="risk-item" key={hazard.key}>
                  <div className="risk-label">
                    <span>{hazard.name}</span>
                    <strong>
                      {event ? `${risk.toFixed(1)}%` : "--"}
                    </strong>
                  </div>

                  <div className="risk-track">
                    <span
                      style={{
                        width: `${Math.min(risk, 100)}%`,
                        background: hazard.color,
                      }}
                    ></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="LIVE WARNINGS"
            title="Active Alerts"
            subtitle="Latest environmental warnings."
            right={
              <button
                className="text-btn"
                onClick={() => onNavigate("alerts")}
              >
                VIEW ALL
              </button>
            }
          />

          {alerts.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              text="No active alerts."
            />
          ) : (
            <div className="alert-preview">
              {alerts.slice(0, 5).map((alert, index) => (
                <div className="alert-row" key={alert.id || index}>
                  <AlertTriangle size={18} />

                  <div>
                    <strong>
                      {formatName(alert.hazard)}
                    </strong>
                    <span>
                      {alert.message || "Environmental alert detected"}
                    </span>
                  </div>

                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="system-banner">
        <div>
          <span className="live-dot"></span>
          SYSTEM {backendOnline ? "ONLINE" : "OFFLINE"}
        </div>

        <p>
          {backendOnline
            ? "Connected to ENVIGUARD environmental intelligence API."
            : "Backend unavailable. Start the FastAPI server."}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   HAZARD PAGE
========================================================= */

function HazardPage({
  hazard,
  event,
  events,
  onBack,
  onRefresh,
  onNavigate,
}) {
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const Icon = hazard.icon;

  const risk = Number(event?.risk_score || 0);
  const sensorData = event?.sensor_readings || {};

  const loadPrediction = async () => {
    if (!event?.id) return;

    setPredictionLoading(true);

    try {
      const response = await axios.get(
        `${API}/prediction/${event.id}`
      );

      setPrediction(response.data || null);
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [event?.id]);

  const history = events
    .filter((item) => item.node_id === hazard.node)
    .slice(-10)
    .map((item, index) => ({
      name: index + 1,
      risk: Number(item.risk_score || 0),
    }));

  return (
    <div className="page">
      <div className="detail-top">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={17} />
          BACK TO COMMAND
        </button>

        <button className="refresh-btn" onClick={onRefresh}>
          <RefreshCw size={16} />
          REFRESH
        </button>
      </div>

      <section className="hazard-header">
        <div
          className="large-hazard-icon"
          style={{
            "--hazard-color": hazard.color,
          }}
        >
          <Icon size={42} />
        </div>

        <div>
          <div className="eyebrow">
            <span></span>
            ENVIRONMENTAL HAZARD MONITORING
          </div>

          <h1>{hazard.name}</h1>

          <p>
            Node: <strong>{hazard.node}</strong>
            {" • "}
            {hazard.description}
          </p>
        </div>
      </section>

      <section className="detail-stats">
        <DetailStat
          label="CURRENT RISK"
          value={`${risk.toFixed(1)}%`}
          color="orange"
        />

        <DetailStat
          label="PREDICTED RISK"
          value={
            prediction?.predicted_risk !== undefined
              ? `${Number(prediction.predicted_risk).toFixed(1)}%`
              : "--"
          }
          color="red"
        />

        <DetailStat
          label="CONFIDENCE"
          value={
            event?.confidence !== undefined
              ? `${event.confidence}%`
              : "--"
          }
          color="green"
        />

        <DetailStat
          label="TREND"
          value={event?.trend || "--"}
          color="cyan"
        />
      </section>

      <section className="detail-layout">
        <div className="panel map-panel">
          <SectionHeading
            eyebrow="GEOSPATIAL INTELLIGENCE"
            title="Sensor Location"
            subtitle={`${event?.location?.latitude || "11.0168"}, ${
              event?.location?.longitude || "76.9558"
            }`}
          />

          <EnvironmentalMap
            hazard={hazard}
            event={event}
          />
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="REAL-TIME TELEMETRY"
            title="Live Sensor Parameters"
            subtitle={`Latest readings from ${hazard.node}`}
          />

          <div className="parameter-grid">
            {hazard.parameters.map((parameter) => (
              <ParameterCard
                key={parameter}
                name={parameter}
                value={sensorData[parameter]}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <SectionHeading
            eyebrow="TEMPORAL ANALYSIS"
            title="Risk Trend"
            subtitle="Recent risk score progression."
          />

          <div className="chart-container">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient
                      id="riskGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={hazard.color}
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="100%"
                        stopColor={hazard.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#1d3045"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#55718c"
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#55718c"
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#07111e",
                      border: "1px solid #203750",
                      borderRadius: "8px",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke={hazard.color}
                    fill="url(#riskGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={<Activity />}
                text="Waiting for historical sensor data."
              />
            )}
          </div>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="AI ENVIRONMENTAL INTELLIGENCE"
            title="AI Analyst"
            subtitle="Prediction generated from current environmental conditions."
          />

          <div className="ai-box">
            <div className="ai-icon">
              <Brain size={25} />
            </div>

            {predictionLoading ? (
              <p>Analyzing environmental conditions...</p>
            ) : (
              <>
                <h3>
                  {prediction?.prediction ||
                    "Environmental intelligence analysis available."}
                </h3>

                <p>
                  {prediction?.direction
                    ? `Current direction: ${prediction.direction}.`
                    : event?.prediction ||
                      "Monitoring current sensor trends for emerging risk."}
                </p>

                <div className="ai-metrics">
                  <div>
                    <span>PREDICTED RISK</span>
                    <strong>
                      {prediction?.predicted_risk !== undefined
                        ? `${Number(
                            prediction.predicted_risk
                          ).toFixed(1)}%`
                        : "--"}
                    </strong>
                  </div>

                  <div>
                    <span>CONFIDENCE</span>
                    <strong>
                      {prediction?.confidence !== undefined
                        ? `${prediction.confidence}%`
                        : event?.confidence
                        ? `${event.confidence}%`
                        : "--"}
                    </strong>
                  </div>
                </div>

                <button
                  className="primary-btn full"
                  onClick={() => onNavigate("analyst")}
                >
                  <Brain size={16} />
                  OPEN FULL AI ANALYST
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   LIVE MAP
========================================================= */

function MapPage({ hazards, latestEvents, onOpenHazard }) {
  return (
    <div className="page">
      <PageTitle
        eyebrow="GEOSPATIAL ENVIRONMENTAL INTELLIGENCE"
        title="LIVE HAZARD MAP"
        subtitle="Distributed sensor network and real-time environmental threat visualization."
      />

      <div className="full-map">
        <div className="map-grid"></div>

        <div className="map-lines"></div>

        {hazards.map((hazard, index) => {
          const event = latestEvents[hazard.node];
          const risk = Number(event?.risk_score || 0);

          return (
            <button
              key={hazard.key}
              className={`map-node node-${index + 1}`}
              style={{ "--hazard-color": hazard.color }}
              onClick={() => onOpenHazard(hazard)}
            >
              <span className="node-ring"></span>
              <span className="node-core"></span>

              <div className="node-label">
                <strong>{hazard.name}</strong>
                <small>{hazard.node}</small>
                <em>{event ? `${risk.toFixed(0)}% RISK` : "WAITING"}</em>
              </div>
            </button>
          );
        })}

        <div className="map-center">
          <Globe2 size={75} />
          <span>ENVIGUARD NETWORK</span>
          <small>7 ACTIVE MONITORING NODES</small>
        </div>
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-safe"></i>
          LOW
        </span>

        <span>
          <i className="legend-warning"></i>
          WARNING
        </span>

        <span>
          <i className="legend-high"></i>
          HIGH
        </span>

        <span>
          <i className="legend-critical"></i>
          CRITICAL
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   EVENTS
========================================================= */

/* =========================================================
   AI ANALYST
========================================================= */

/* =========================================================
   ANALYTICS
========================================================= */

function AnalyticsPage({ hazards, latestEvents, events }) {
  const chartData = hazards.map((hazard) => ({
    hazard: hazard.name,
    risk: Number(latestEvents[hazard.node]?.risk_score || 0),
  }));

  const eventFrequency = hazards.map((hazard) => ({
    hazard: hazard.name,
    events: events.filter(
      (event) => event.node_id === hazard.node
    ).length,
  }));

  return (
    <div className="page">
      <PageTitle
        eyebrow="ENVIRONMENTAL DATA ANALYTICS"
        title="THREAT ANALYTICS"
        subtitle="Cross-hazard risk comparison and event intelligence."
      />

      <div className="two-column">
        <div className="panel chart-panel">
          <SectionHeading
            eyebrow="RISK DISTRIBUTION"
            title="Current Hazard Risk"
            subtitle="Latest risk score for each monitored hazard."
          />

          <div className="chart-container large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  stroke="#1d3045"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="hazard"
                  stroke="#55718c"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#55718c"
                />

                <Tooltip
                  contentStyle={{
                    background: "#07111e",
                    border: "1px solid #203750",
                    borderRadius: "8px",
                  }}
                />

                <Bar
                  dataKey="risk"
                  fill="#22d3ee"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chart-panel">
          <SectionHeading
            eyebrow="EVENT DISTRIBUTION"
            title="Event Frequency"
            subtitle="Detected events by monitoring node."
          />

          <div className="chart-container large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventFrequency}>
                <CartesianGrid
                  stroke="#1d3045"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="hazard"
                  stroke="#55718c"
                  tick={{ fontSize: 10 }}
                />

                <YAxis stroke="#55718c" />

                <Tooltip
                  contentStyle={{
                    background: "#07111e",
                    border: "1px solid #203750",
                    borderRadius: "8px",
                  }}
                />

                <Bar
                  dataKey="events"
                  fill="#a78bfa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ALERTS
========================================================= */

function AlertsPage({ alerts, onOpenHazard }) {
  return (
    <div className="page">
      <PageTitle
        eyebrow="THREAT NOTIFICATION CENTER"
        title="ENVIRONMENTAL ALERTS"
        subtitle="Critical and high-priority environmental warnings."
      />

      <div className="alert-list-page">
        {alerts.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={<CheckCircle2 />}
              text="No active environmental alerts."
            />
          </div>
        ) : (
          alerts.map((alert, index) => {
            const hazard = HAZARDS.find(
              (item) => item.node === alert.node_id
            );

            return (
              <div className="big-alert" key={alert.id || index}>
                <div className="big-alert-icon">
                  <AlertTriangle />
                </div>

                <div className="big-alert-content">
                  <div className="alert-meta">
                    {alert.level || alert.severity || "ALERT"}
                    {" • "}
                    {alert.node_id || "UNKNOWN NODE"}
                  </div>

                  <h3>
                    {formatName(alert.hazard)}
                  </h3>

                  <p>
                    {alert.message ||
                      "Environmental threshold exceeded."}
                  </p>
                </div>

                {hazard && (
                  <button
                    className="secondary-btn"
                    onClick={() => onOpenHazard(hazard)}
                  >
                    INVESTIGATE
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */

function ReportsPage({ events, alerts, hazards }) {
  const generateReport = () => {
    const lines = [
      "ENVIGUARD AI",
      "MULTI-HAZARD ENVIRONMENTAL INTELLIGENCE REPORT",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total Events: ${events.length}`,
      `Total Alerts: ${alerts.length}`,
      "",
      "HAZARD SUMMARY",
      "--------------",
    ];

    hazards.forEach((hazard) => {
      const hazardEvents = events.filter(
        (event) => event.node_id === hazard.node
      );

      const latest = hazardEvents[hazardEvents.length - 1];

      lines.push(
        `${hazard.name} (${hazard.node}) - ${
          latest
            ? `${Number(latest.risk_score || 0).toFixed(1)}% risk`
            : "No data"
        }`
      );
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "enviguard-environmental-report.txt";

    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <PageTitle
        eyebrow="ENVIRONMENTAL INTELLIGENCE REPORTING"
        title="REPORT CENTER"
        subtitle="Generate a snapshot of current ENVIGUARD environmental intelligence."
      />

      <div className="report-grid">
        <div className="report-card">
          <FileText size={30} />

          <h3>Environmental Report</h3>

          <p>
            Generate a text report containing the current seven-hazard
            network status, event counts and risk summary.
          </p>

          <button
            className="primary-btn"
            onClick={generateReport}
          >
            <FileText size={16} />
            GENERATE REPORT
          </button>
        </div>

        <div className="report-card">
          <Activity size={30} />

          <h3>Network Statistics</h3>

          <div className="report-number">
            {events.length}
          </div>

          <span>TOTAL EVENTS DETECTED</span>
        </div>

        <div className="report-card">
          <Bell size={30} />

          <h3>Alert Statistics</h3>

          <div className="report-number">
            {alerts.length}
          </div>

          <span>TOTAL ALERTS GENERATED</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Stat({ icon, label, value, danger }) {
  return (
    <div className={`stat ${danger ? "danger" : ""}`}>
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DetailStat({ label, value, color }) {
  return (
    <div className="detail-stat">
      <div className={`detail-stat-icon ${color}`}>
        {color === "orange" && <Zap size={20} />}
        {color === "red" && <Gauge size={20} />}
        {color === "green" && <Shield size={20} />}
        {color === "cyan" && <Activity size={20} />}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ParameterCard({ name, value }) {
  return (
    <div className="parameter-card">
      <span>{formatName(name)}</span>

      <strong>
        {formatValue(value)}
      </strong>

      <small>
        {name === "temperature"
          ? "°C"
          : name === "humidity" ||
            name === "soil_moisture"
          ? "%"
          : name === "rainfall"
          ? "mm"
          : ""}
      </small>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  right,
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="mini-eyebrow">
          {eyebrow}
        </div>

        <h2>{title}</h2>

        {subtitle && <p>{subtitle}</p>}
      </div>

      {right}
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  subtitle,
}) {
  return (
    <div className="page-title">
      <div className="eyebrow">
        <span></span>
        {eyebrow}
      </div>

      <h1>{title}</h1>

      <p>{subtitle}</p>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function EnvironmentalMap({ hazard, event }) {
  const risk = Number(event?.risk_score || 0);

  return (
    <div className="environment-map">
      <div className="map-grid"></div>

      <div className="map-road road-one"></div>
      <div className="map-road road-two"></div>
      <div className="map-road road-three"></div>

      <div
        className="location-marker"
        style={{ "--hazard-color": hazard.color }}
      >
        <span></span>

        <div className="location-label">
          <strong>{hazard.name}</strong>
          <small>{hazard.node}</small>
          <em>{risk.toFixed(1)}% RISK</em>
        </div>
      </div>

      <div className="map-coordinate">
        LAT {event?.location?.latitude || "11.0168"}
        <br />
        LNG {event?.location?.longitude || "76.9558"}
      </div>

      <div className="map-corner">
        LIVE SENSOR
        <br />
        NETWORK
      </div>
    </div>
  );
}

export default App;
