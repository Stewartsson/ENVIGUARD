import { useEffect, useMemo, useState } from "react";
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

// ======================================================
// ENVIGUARD BACKEND
// ======================================================

const API = "http://127.0.0.1:8000/api";

// ======================================================
// LEAFLET ICON FIX
// ======================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ======================================================
// HAZARD CONFIGURATION
// ======================================================

const HAZARDS = {
  flood: {
    name: "Flood",
    node: "RIVER_01",
    icon: "🌊",
    description:
      "River level, rainfall and soil saturation monitoring",
  },

  forest_fire: {
    name: "Forest Fire",
    node: "FOREST_01",
    icon: "🔥",
    description:
      "Forest temperature, smoke and gas monitoring",
  },

  air_pollution: {
    name: "Air Pollution",
    node: "CITY_01",
    icon: "🏭",
    description:
      "Urban air quality and pollutant monitoring",
  },

  extreme_heat: {
    name: "Extreme Heat",
    node: "HEAT_01",
    icon: "🌡️",
    description:
      "Temperature, humidity and heat-index monitoring",
  },

  landslide: {
    name: "Landslide",
    node: "HILL_01",
    icon: "⛰️",
    description:
      "Slope stability, vibration, tilt and soil monitoring",
  },

  chemical_leak: {
    name: "Chemical Leak",
    node: "INDUSTRY_01",
    icon: "☣️",
    description:
      "Industrial gas and chemical exposure monitoring",
  },

  water_quality: {
    name: "Water Quality",
    node: "WATER_01",
    icon: "💧",
    description:
      "Water contamination and quality monitoring",
  },
};

// ======================================================
// DEFAULT NODE LOCATIONS
// ======================================================

const NODE_LOCATIONS = {
  RIVER_01: [11.0168, 76.9558],
  FOREST_01: [11.05, 76.93],
  CITY_01: [11.0, 76.96],
  HEAT_01: [11.02, 76.97],
  HILL_01: [11.0665, 76.9625],
  INDUSTRY_01: [11.03, 77.0],
  WATER_01: [10.98, 76.95],
};

// ======================================================
// HELPERS
// ======================================================

function getRiskColor(risk) {
  const value = Number(risk || 0);

  if (value >= 80) return "#ff3b4d";
  if (value >= 60) return "#ff9f1c";
  if (value >= 40) return "#ffd166";

  return "#22c55e";
}

function getRiskLevel(risk) {
  const value = Number(risk || 0);

  if (value >= 80) return "CRITICAL";
  if (value >= 60) return "HIGH";
  if (value >= 40) return "MEDIUM";

  return "LOW";
}

function getHazardConfig(hazard) {
  return (
    HAZARDS[hazard] || {
      name: hazard || "Unknown Hazard",
      icon: "⚠️",
      description: "Environmental monitoring node",
    }
  );
}

function getCoordinates(event) {
  const fallback =
    NODE_LOCATIONS[event?.node_id];

  const latitude =
    event?.location?.latitude ??
    event?.latitude ??
    fallback?.[0];

  const longitude =
    event?.location?.longitude ??
    event?.longitude ??
    fallback?.[1];

  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }

  return [lat, lng];
}

// ======================================================
// CUSTOM HAZARD MARKER
// ======================================================

function createHazardIcon(hazard, risk) {
  const config = getHazardConfig(hazard);
  const color = getRiskColor(risk);

  return L.divIcon({
    className:
      "enviguard-marker-wrapper",

    html: `
      <div
        class="enviguard-marker"
        style="
          --marker-color:${color};
          border-color:${color};
          box-shadow:
            0 0 0 5px ${color}22,
            0 0 25px ${color}88;
        "
      >
        <span>${config.icon}</span>
      </div>
    `,

    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

// ======================================================
// MAP AUTO FIT
// ======================================================

function MapViewUpdater({ events }) {
  const map = useMap();

  useEffect(() => {
    if (!events.length) return;

    const points = events
      .map((event) =>
        getCoordinates(event)
      )
      .filter(Boolean);

    if (points.length === 0) return;

    map.fitBounds(points, {
      padding: [40, 40],
      maxZoom: 12,
    });
  }, [events, map]);

  return null;
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function LiveMap() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [error, setError] =
    useState("");

  const [selectedNode, setSelectedNode] =
    useState(null);

  // ====================================================
  // FETCH EVENTS
  // ====================================================

  const fetchEvents = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API}/events`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const result =
        await response.json();

      let received = [];

      if (Array.isArray(result)) {
        received = result;
      } else if (
        Array.isArray(result?.data)
      ) {
        received = result.data;
      } else if (
        Array.isArray(result?.events)
      ) {
        received = result.events;
      }

      // -----------------------------------------------
      // Keep latest event for each node
      // -----------------------------------------------

      const latestByNode = {};

      received.forEach((event) => {
        const node =
          event?.node_id;

        if (!node) return;

        const current =
          latestByNode[node];

        const currentTime = new Date(
          current?.last_updated ??
            current?.start_time ??
            0
        ).getTime();

        const newTime = new Date(
          event?.last_updated ??
            event?.start_time ??
            0
        ).getTime();

        if (
          !current ||
          newTime >= currentTime
        ) {
          latestByNode[node] = event;
        }
      });

      setEvents(
        Object.values(
          latestByNode
        )
      );

      setLastUpdated(
        new Date()
      );
    } catch (err) {
      console.error(
        "ENVIGUARD LiveMap API error:",
        err
      );

      setError(
        "Backend unavailable"
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD + AUTO REFRESH
  // ====================================================

  useEffect(() => {
    fetchEvents();

    const interval =
      setInterval(
        fetchEvents,
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  // ====================================================
  // STATISTICS
  // ====================================================

  const criticalCount =
    useMemo(
      () =>
        events.filter(
          (event) =>
            String(
              event?.severity || ""
            ).toUpperCase() ===
            "CRITICAL"
        ).length,
      [events]
    );

  const highCount =
    useMemo(
      () =>
        events.filter(
          (event) => {
            const risk =
              Number(
                event?.risk_score || 0
              );

            return (
              risk >= 60 &&
              risk < 80
            );
          }
        ).length,
      [events]
    );

  const activeHazards =
    useMemo(
      () =>
        new Set(
          events.map(
            (event) =>
              event?.hazard
          )
        ).size,
      [events]
    );

  // ====================================================
  // MAP CENTER
  // ====================================================

  const center = [
    11.0168,
    76.9558,
  ];

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="live-map-page">

      {/* ================================================
          HEADER
      ================================================= */}

      <div className="live-map-header">

        <div>

          <div className="live-map-eyebrow">
            ENVIRONMENTAL INTELLIGENCE
          </div>

          <h1>
            Live Environmental Map
          </h1>

          <p>
            Real-time visualization of
            the ENVIGUARD multi-hazard
            sensor network.
          </p>

        </div>

        <div className="map-status">

          <span
            className="status-dot"
            style={{
              background:
                error
                  ? "#ef4444"
                  : "#22c55e",
            }}
          ></span>

          {error
            ? "BACKEND OFFLINE"
            : "LIVE NETWORK"}

        </div>

      </div>

      {/* ================================================
          TOP STATISTICS
      ================================================= */}

      <div className="map-stat-grid">

        <div className="map-stat-card">

          <span className="map-stat-label">
            ACTIVE NODES
          </span>

          <strong>
            {events.length}
          </strong>

          <small>
            {activeHazards}/7 hazards active
          </small>

        </div>

        <div className="map-stat-card">

          <span className="map-stat-label">
            CRITICAL
          </span>

          <strong className="critical-value">
            {criticalCount}
          </strong>

          <small>
            Immediate attention required
          </small>

        </div>

        <div className="map-stat-card">

          <span className="map-stat-label">
            HIGH RISK
          </span>

          <strong className="high-value">
            {highCount}
          </strong>

          <small>
            Elevated environmental risk
          </small>

        </div>

        <div className="map-stat-card">

          <span className="map-stat-label">
            LAST UPDATE
          </span>

          <strong>
            {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : "--:--:--"}
          </strong>

          <small>
            {error ||
              "Live sensor stream"}
          </small>

        </div>

      </div>

      {/* ================================================
          MAP + NODE PANEL
      ================================================= */}

      <div className="map-layout">

        {/* ============================================
            MAP
        ============================================= */}

        <div className="map-card">

          <div className="map-card-header">

            <div>

              <h2>
                Environmental Sensor Network
              </h2>

              <p>
                Live geographic distribution
                of monitored hazards
              </p>

            </div>

            <button
              className="map-refresh"
              onClick={fetchEvents}
            >
              ↻ Refresh
            </button>

          </div>

          <div className="map-container">

            <MapContainer
              center={center}
              zoom={11}
              scrollWheelZoom={true}
              className="leaflet-map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapViewUpdater
                events={events}
              />

              {/* ========================================
                  HAZARD MARKERS
              ======================================== */}

              {events.map(
                (event) => {

                  const coordinates =
                    getCoordinates(
                      event
                    );

                  if (
                    !coordinates
                  ) {
                    return null;
                  }

                  const hazard =
                    event?.hazard;

                  const config =
                    getHazardConfig(
                      hazard
                    );

                  const risk =
                    Number(
                      event?.risk_score ||
                        0
                    );

                  const riskLevel =
                    getRiskLevel(
                      risk
                    );

                  const prediction =
                    event?.prediction;

                  return (
                    <div
                      key={
                        event?.node_id ||
                        event?.id
                      }
                    >

                      {/* MARKER */}

                      <Marker
                        position={
                          coordinates
                        }
                        icon={createHazardIcon(
                          hazard,
                          risk
                        )}
                        eventHandlers={{
                          click: () =>
                            setSelectedNode(
                              event
                            ),
                        }}
                      >

                        {/* =================================
                            POPUP
                        ================================== */}

                        <Popup>

                          <div className="hazard-popup">

                            <div className="popup-icon">
                              {
                                config.icon
                              }
                            </div>

                            <h3>
                              {
                                config.name
                              }
                            </h3>

                            <p className="popup-node">
                              Node:{" "}
                              <strong>
                                {
                                  event?.node_id ||
                                  "--"
                                }
                              </strong>
                            </p>

                            <p className="popup-description">
                              {
                                config.description
                              }
                            </p>

                            {/* RISK */}

                            <div className="popup-risk">

                              <span>
                                RISK
                              </span>

                              <strong
                                style={{
                                  color:
                                    getRiskColor(
                                      risk
                                    ),
                                }}
                              >
                                {risk.toFixed(
                                  1
                                )}
                                %
                              </strong>

                            </div>

                            {/* SEVERITY */}

                            <div className="popup-row">

                              <span>
                                Severity
                              </span>

                              <strong>
                                {
                                  event?.severity ||
                                  riskLevel
                                }
                              </strong>

                            </div>

                            {/* CONFIDENCE */}

                            <div className="popup-row">

                              <span>
                                Confidence
                              </span>

                              <strong>
                                {event?.confidence !=
                                null
                                  ? `${event.confidence}%`
                                  : "--"}
                              </strong>

                            </div>

                            {/* TREND */}

                            <div className="popup-row">

                              <span>
                                Trend
                              </span>

                              <strong>
                                {
                                  event?.trend ||
                                  "Monitoring"
                                }
                              </strong>

                            </div>

                            {/* STATUS */}

                            <div className="popup-row">

                              <span>
                                Status
                              </span>

                              <strong>
                                {
                                  event?.status ||
                                  "ACTIVE"
                                }
                              </strong>

                            </div>

                            {/* PREDICTION */}

                            {prediction && (
                              <div className="popup-prediction">

                                <span>
                                  🤖 AI PREDICTION
                                </span>

                                <p>
                                  {
                                    prediction
                                  }
                                </p>

                              </div>
                            )}

                            {/* LOCATION */}

                            <div className="popup-row">

                              <span>
                                Location
                              </span>

                              <strong>
                                {coordinates[0].toFixed(
                                  4
                                )}
                                ,{" "}
                                {coordinates[1].toFixed(
                                  4
                                )}
                              </strong>

                            </div>

                          </div>

                        </Popup>

                      </Marker>

                      {/* RISK RADIUS */}

                      <Circle
                        center={
                          coordinates
                        }
                        radius={
                          1000 +
                          risk * 8
                        }
                        pathOptions={{
                          color:
                            getRiskColor(
                              risk
                            ),
                          fillColor:
                            getRiskColor(
                              risk
                            ),
                          fillOpacity:
                            0.07,
                          weight: 1,
                        }}
                      />

                    </div>
                  );
                }
              )}

            </MapContainer>

            {/* ==========================================
                MAP LEGEND
            =========================================== */}

            <div className="map-legend">

              <div className="legend-title">
                RISK LEVEL
              </div>

              <div>
                <span className="legend-dot critical"></span>
                Critical ≥ 80%
              </div>

              <div>
                <span className="legend-dot high"></span>
                High ≥ 60%
              </div>

              <div>
                <span className="legend-dot medium"></span>
                Medium ≥ 40%
              </div>

              <div>
                <span className="legend-dot low"></span>
                Low &lt; 40%
              </div>

            </div>

          </div>

        </div>

        {/* ============================================
            RIGHT NODE PANEL
        ============================================= */}

        <div className="node-panel">

          <div className="panel-heading">

            <div>

              <h2>
                Active Sensor Nodes
              </h2>

              <small>
                Real-time backend events
              </small>

            </div>

            <span>
              {events.length} LIVE
            </span>

          </div>

          <div className="node-list">

            {/* LOADING */}

            {loading && (
              <div className="empty-node">
                <strong>
                  Loading sensor network...
                </strong>

                <span>
                  Connecting to ENVIGUARD
                  backend
                </span>
              </div>
            )}

            {/* ERROR */}

            {!loading &&
              error && (
                <div className="empty-node">

                  <strong>
                    ⚠️ Backend unavailable
                  </strong>

                  <span>
                    Check that FastAPI is
                    running on port 8000.
                  </span>

                  <button
                    className="map-refresh"
                    onClick={
                      fetchEvents
                    }
                  >
                    Try Again
                  </button>

                </div>
              )}

            {/* NO EVENTS */}

            {!loading &&
              !error &&
              events.length === 0 && (
                <div className="empty-node">

                  <strong>
                    No sensor events
                  </strong>

                  <span>
                    Waiting for ENVIGUARD
                    sensor data.
                  </span>

                </div>
              )}

            {/* EVENTS */}

            {events.map(
              (event) => {

                const config =
                  getHazardConfig(
                    event?.hazard
                  );

                const risk =
                  Number(
                    event?.risk_score ||
                      0
                  );

                const riskLevel =
                  getRiskLevel(
                    risk
                  );

                const isSelected =
                  selectedNode?.node_id ===
                  event?.node_id;

                return (
                  <div
                    className={`node-item ${
                      isSelected
                        ? "node-item-selected"
                        : ""
                    }`}
                    key={
                      event?.node_id ||
                      event?.id
                    }
                    onClick={() =>
                      setSelectedNode(
                        event
                      )
                    }
                  >

                    <div
                      className="node-icon"
                      style={{
                        borderColor:
                          getRiskColor(
                            risk
                          ),
                        boxShadow: `0 0 12px ${getRiskColor(
                          risk
                        )}55`,
                      }}
                    >
                      {
                        config.icon
                      }
                    </div>

                    <div className="node-info">

                      <strong>
                        {
                          config.name
                        }
                      </strong>

                      <span>
                        {
                          event?.node_id ||
                          "--"
                        }
                      </span>

                    </div>

                    <div className="node-risk">

                      <strong
                        style={{
                          color:
                            getRiskColor(
                              risk
                            ),
                        }}
                      >
                        {risk.toFixed(
                          1
                        )}
                        %
                      </strong>

                      <span>
                        {
                          event?.severity ||
                          riskLevel
                        }
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>

      {/* ================================================
          SELECTED NODE DETAILS
      ================================================= */}

      {selectedNode && (
        <div className="selected-node-card">

          <div>

            <span className="live-map-eyebrow">
              SELECTED EVENT
            </span>

            <h2>
              {
                getHazardConfig(
                  selectedNode.hazard
                ).icon
              }{" "}
              {
                getHazardConfig(
                  selectedNode.hazard
                ).name
              }
            </h2>

            <p>
              Node{" "}
              <strong>
                {
                  selectedNode.node_id
                }
              </strong>
              {" • "}
              Risk{" "}
              <strong>
                {
                  Number(
                    selectedNode.risk_score ||
                      0
                  ).toFixed(1)
                }
                %
              </strong>
            </p>

          </div>

          <div className="selected-node-metrics">

            <div>
              <span>
                SEVERITY
              </span>

              <strong>
                {
                  selectedNode.severity ||
                  "--"
                }
              </strong>
            </div>

            <div>
              <span>
                CONFIDENCE
              </span>

              <strong>
                {selectedNode.confidence !=
                null
                  ? `${selectedNode.confidence}%`
                  : "--"}
              </strong>
            </div>

            <div>
              <span>
                TREND
              </span>

              <strong>
                {
                  selectedNode.trend ||
                  "--"
                }
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                {
                  selectedNode.status ||
                  "ACTIVE"
                }
              </strong>
            </div>

          </div>

        </div>
      )}

      {/* ================================================
          FOOTER
      ================================================= */}

      <div className="live-map-footer">

        <div>

          <span className="footer-pulse"></span>

          <strong>
            ENVIGUARD SENSOR NETWORK{" "}
            {error
              ? "OFFLINE"
              : "ONLINE"}
          </strong>

        </div>

        <span>
          Automatic refresh every 5 seconds
        </span>

      </div>

    </div>
  );
}