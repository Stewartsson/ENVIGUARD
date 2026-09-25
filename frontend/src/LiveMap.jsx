import React, { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./LiveMap.css";
import API from "./api";


// ============================================================
// LEAFLET ICON FIX
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// ============================================================
// DEFAULT MAP LOCATION
// ============================================================

const DEFAULT_CENTER = [11.0168, 76.9558];


// ============================================================
// HAZARD COLORS
// ============================================================

const HAZARD_COLORS = {
  flood: "#00d9ff",
  water_quality: "#22d3ee",
  landslide: "#c084fc",
  extreme_heat: "#ff8a00",
  air_pollution: "#ffd000",
  forest_fire: "#ff5533",
  chemical_leak: "#c084fc",
  default: "#00d9ff",
};


// ============================================================
// HELPERS
// ============================================================

function getHazardColor(hazard) {
  if (!hazard) {
    return HAZARD_COLORS.default;
  }

  return HAZARD_COLORS[hazard] || HAZARD_COLORS.default;
}


function formatHazard(hazard) {
  if (!hazard) {
    return "Unknown";
  }

  return hazard
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


function formatSeverity(severity) {
  if (!severity) {
    return "UNKNOWN";
  }

  return String(severity).toUpperCase();
}


function formatTime(time) {
  if (!time) {
    return "—";
  }

  try {
    return new Date(time).toLocaleString();
  } catch {
    return time;
  }
}


// ============================================================
// MAP AUTO FIT COMPONENT
// ============================================================

function MapUpdater({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) {
      return;
    }

    const validPoints = points
      .filter(
        (point) =>
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude)
      )
      .map((point) => [point.latitude, point.longitude]);

    if (validPoints.length === 0) {
      return;
    }

    if (validPoints.length === 1) {
      map.setView(validPoints[0], 10);
      return;
    }

    const bounds = L.latLngBounds(validPoints);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12,
    });
  }, [points, map]);

  return null;
}


// ============================================================
// LIVE MAP COMPONENT
// ============================================================

function LiveMap() {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [backendOnline, setBackendOnline] = useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);


  // ==========================================================
  // LOAD EVENTS
  // ==========================================================

  const loadEvents = async () => {
    try {
      setError("");

      const response = await fetch(`${API}/events?t=${Date.now()}`, {
        method: "GET",

        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      const incomingEvents = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];

      setEvents(incomingEvents);

      setBackendOnline(true);

      setLastUpdated(new Date());

    } catch (err) {
      console.error("ENVIGUARD LiveMap API error:", err);

      setBackendOnline(false);

      setError(
        "Unable to connect to the ENVIGUARD backend."
      );

      // IMPORTANT:
      // Do not erase the previous events if the backend
      // temporarily fails.
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD + AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    loadEvents();

    const interval = setInterval(() => {
      loadEvents();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);


  // ==========================================================
  // PREPARE MAP POINTS
  // ==========================================================

  const mapPoints = useMemo(() => {
    return events
      .map((event) => {
        const latitude = Number(event?.latitude);

        const longitude = Number(event?.longitude);

        return {
          ...event,

          latitude,

          longitude,
        };
      })
      .filter(
        (event) =>
          Number.isFinite(event.latitude) &&
          Number.isFinite(event.longitude)
      );
  }, [events]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const activeNodes = useMemo(() => {
    const uniqueNodes = new Set();

    events.forEach((event) => {
      if (event?.node_id) {
        uniqueNodes.add(event.node_id);
      }
    });

    return uniqueNodes.size;
  }, [events]);


  const criticalCount = useMemo(() => {
    return events.filter(
      (event) =>
        String(event?.severity || "").toUpperCase() ===
        "CRITICAL"
    ).length;
  }, [events]);


  const highRiskCount = useMemo(() => {
    return events.filter(
      (event) =>
        String(event?.severity || "").toUpperCase() ===
        "HIGH"
    ).length;
  }, [events]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="live-map-page">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div className="live-map-header">

        <div>

          <div className="live-map-eyebrow">
            ENVIRONMENTAL INTELLIGENCE
          </div>

          <h1>
            Live Environmental Map
          </h1>

          <p>
            Real-time visualization of the ENVIGUARD
            multi-hazard sensor network.
          </p>

        </div>


        <div
          className={`backend-status ${
            backendOnline ? "online" : "offline"
          }`}
        >

          <span className="status-dot"></span>

          {backendOnline
            ? "BACKEND ONLINE"
            : "BACKEND OFFLINE"}

        </div>

      </div>


      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div className="live-map-stats">

        <div className="live-map-stat-card">

          <span className="stat-label">
            ACTIVE NODES
          </span>

          <strong>
            {activeNodes}
          </strong>

          <small>
            Live environmental nodes
          </small>

        </div>


        <div className="live-map-stat-card">

          <span className="stat-label">
            CRITICAL
          </span>

          <strong className="critical-value">
            {criticalCount}
          </strong>

          <small>
            Immediate attention required
          </small>

        </div>


        <div className="live-map-stat-card">

          <span className="stat-label">
            HIGH RISK
          </span>

          <strong className="high-value">
            {highRiskCount}
          </strong>

          <small>
            Elevated environmental risk
          </small>

        </div>


        <div className="live-map-stat-card">

          <span className="stat-label">
            LAST UPDATE
          </span>

          <strong className="update-value">

            {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : "—"}

          </strong>

          <small>
            {backendOnline
              ? "Live backend data"
              : "Backend unavailable"}
          </small>

        </div>

      </div>


      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <div className="live-map-content">

        {/* ==================================================
            MAP
        ================================================== */}

        <section className="map-panel">

          <div className="map-panel-header">

            <div>

              <h2>
                Environmental Sensor Network
              </h2>

              <p>
                Live geographic distribution of
                monitored hazards
              </p>

            </div>


            <button
              type="button"
              className="refresh-button"
              onClick={loadEvents}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>


          <div className="map-wrapper">

            <MapContainer
              center={DEFAULT_CENTER}
              zoom={8}
              scrollWheelZoom={true}
              className="environment-map"
            >

              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              <MapUpdater points={mapPoints} />


              {mapPoints.map((event, index) => {

                const color = getHazardColor(
                  event.hazard
                );

                const position = [
                  event.latitude,
                  event.longitude,
                ];


                return (
                  <React.Fragment
                    key={
                      event.id ??
                      `${event.node_id}-${index}`
                    }
                  >

                    <Circle
                      center={position}
                      radius={2500}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.12,
                        weight: 1,
                      }}
                    />


                    <Marker position={position}>

                      <Popup>

                        <div
                          style={{
                            minWidth: "220px",
                            fontFamily:
                              "Arial, sans-serif",
                          }}
                        >

                          <h3
                            style={{
                              marginTop: 0,
                              marginBottom: "8px",
                            }}
                          >
                            {event.node_id ||
                              "Unknown Node"}
                          </h3>


                          <p>
                            <strong>
                              Hazard:
                            </strong>{" "}
                            {formatHazard(
                              event.hazard
                            )}
                          </p>


                          <p>
                            <strong>
                              Severity:
                            </strong>{" "}
                            {formatSeverity(
                              event.severity
                            )}
                          </p>


                          <p>
                            <strong>
                              Risk:
                            </strong>{" "}
                            {event.risk_score ?? "—"}
                          </p>


                          <p>
                            <strong>
                              Confidence:
                            </strong>{" "}
                            {event.confidence ?? "—"}
                            %
                          </p>


                          <p>
                            <strong>
                              Status:
                            </strong>{" "}
                            {event.status || "—"}
                          </p>


                          <p>
                            <strong>
                              Updated:
                            </strong>{" "}
                            {formatTime(
                              event.last_updated
                            )}
                          </p>

                        </div>

                      </Popup>

                    </Marker>

                  </React.Fragment>
                );
              })}

            </MapContainer>


            {/* ==============================================
                NO COORDINATES MESSAGE
            ============================================== */}

            {!loading &&
              backendOnline &&
              events.length > 0 &&
              mapPoints.length === 0 && (

                <div className="map-overlay-message">

                  <div>
                    📍
                  </div>

                  <strong>
                    Sensor events received
                  </strong>

                  <span>
                    Location coordinates are not
                    available for these events yet.
                  </span>

                </div>
              )}


            {/* ==============================================
                LOADING
            ============================================== */}

            {loading && (

              <div className="map-overlay-message">

                <div>
                  ⟳
                </div>

                <strong>
                  Loading environmental data...
                </strong>

              </div>
            )}

          </div>

        </section>


        {/* ==================================================
            ACTIVE SENSOR NODES
        ================================================== */}

        <section className="sensor-panel">

          <div className="sensor-panel-header">

            <div>

              <h2>
                Active Sensor Nodes
              </h2>

              <p>
                Real-time backend events
              </p>

            </div>


            <span className="live-indicator">

              <span className="status-dot"></span>

              {activeNodes} LIVE

            </span>

          </div>


          <div className="sensor-list">

            {events.length === 0 && !loading && (

              <div className="empty-state">

                {!backendOnline ? (
                  <>
                    <div className="empty-icon">
                      ⚠
                    </div>

                    <strong>
                      Backend unavailable
                    </strong>

                    <span>
                      Check that the ENVIGUARD
                      FastAPI backend is running.
                    </span>

                    <button
                      type="button"
                      onClick={loadEvents}
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="empty-icon">
                      ◌
                    </div>

                    <strong>
                      No active events
                    </strong>

                    <span>
                      Waiting for environmental
                      sensor data.
                    </span>
                  </>
                )}

              </div>
            )}


            {events.map((event, index) => {

              const color = getHazardColor(
                event.hazard
              );


              return (
                <div
                  className="sensor-card"
                  key={
                    event.id ??
                    `${event.node_id}-${index}`
                  }
                >

                  <div
                    className="sensor-color"
                    style={{
                      backgroundColor: color,
                      boxShadow:
                        `0 0 12px ${color}`,
                    }}
                  ></div>


                  <div className="sensor-info">

                    <strong>
                      {event.node_id ||
                        "Unknown Node"}
                    </strong>

                    <span>
                      {formatHazard(
                        event.hazard
                      )}
                    </span>

                  </div>


                  <div
                    className="sensor-risk"
                    style={{
                      color,
                    }}
                  >
                    {event.risk_score ?? "—"}
                  </div>

                </div>
              );
            })}

          </div>

        </section>

      </div>


      {/* ====================================================
          ERROR MESSAGE
      ==================================================== */}

      {error && (

        <div className="backend-error">

          <strong>
            Backend connection problem
          </strong>

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={loadEvents}
          >
            Retry
          </button>

        </div>
      )}

    </div>
  );
}


export default LiveMap;