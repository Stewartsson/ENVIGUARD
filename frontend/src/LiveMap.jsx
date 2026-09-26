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

import API from "./api";

/* =========================================================
   ENVIGUARD LEAFLET ICON FIX
========================================================= */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* =========================================================
   HAZARD CONFIGURATION
========================================================= */

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

/* =========================================================
   DEFAULT SENSOR LOCATIONS
========================================================= */

const NODE_LOCATIONS = {
  RIVER_01: [11.0168, 76.9558],
  FOREST_01: [11.0500, 76.9300],
  CITY_01: [11.0000, 76.9600],
  HEAT_01: [11.0200, 76.9700],
  HILL_01: [11.0665, 76.9625],
  INDUSTRY_01: [11.0300, 77.0000],
  WATER_01: [10.9800, 76.9500],
};

/* =========================================================
   HELPERS
========================================================= */

function getRiskValue(event) {
  const value = Number(event?.risk_score);

  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

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
  const key = String(hazard || "").toLowerCase();

  return (
    HAZARDS[key] || {
      name: hazard || "Unknown Hazard",
      icon: "⚠️",
      description: "Environmental monitoring node",
    }
  );
}

/* =========================================================
   COORDINATE HANDLER
========================================================= */

function getCoordinates(event) {
  const nodeId = event?.node_id;

  const fallback = NODE_LOCATIONS[nodeId];

  const latitude =
    event?.location?.latitude ??
    event?.location?.lat ??
    event?.latitude ??
    event?.lat ??
    fallback?.[0];

  const longitude =
    event?.location?.longitude ??
    event?.location?.lng ??
    event?.longitude ??
    event?.lng ??
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
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
}

/* =========================================================
   API RESPONSE NORMALIZER
========================================================= */

function normalizeEvents(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.events)) {
    return result.events;
  }

  return [];
}

/* =========================================================
   KEEP ONLY LATEST EVENT PER NODE
========================================================= */

function getLatestEvents(events) {
  const latest = {};

  events.forEach((event) => {
    if (!event?.node_id) {
      return;
    }

    const nodeId = event.node_id;

    const existing = latest[nodeId];

    const existingTime = new Date(
      existing?.last_updated ||
        existing?.start_time ||
        existing?.created_at ||
        0
    ).getTime();

    const newTime = new Date(
      event?.last_updated ||
        event?.start_time ||
        event?.created_at ||
        0
    ).getTime();

    if (!existing || newTime >= existingTime) {
      latest[nodeId] = event;
    }
  });

  return Object.values(latest);
}

/* =========================================================
   CUSTOM HAZARD MARKER
========================================================= */

function createHazardIcon(hazard, risk) {
  const config = getHazardConfig(hazard);

  const color = getRiskColor(risk);

  return L.divIcon({
    className: "enviguard-marker-wrapper",

    html: `
      <div
        class="enviguard-marker"
        style="
          --marker-color: ${color};
          border-color: ${color};
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

/* =========================================================
   MAP AUTO FIT
========================================================= */

function MapViewUpdater({ events }) {
  const map = useMap();

  useEffect(() => {
    const points = events
      .map((event) => getCoordinates(event))
      .filter(Boolean);

    if (!points.length) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12, {
        animate: true,
      });

      return;
    }

    map.fitBounds(points, {
      padding: [50, 50],
      maxZoom: 13,
      animate: true,
    });
  }, [events, map]);

  return null;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function LiveMap() {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedNode, setSelectedNode] = useState(null);

  /* =======================================================
     FETCH EVENTS
  ======================================================= */

  const fetchEvents = async () => {
    try {
      setError("");

      /*
        IMPORTANT:
        Backend endpoint is /api/events
        NOT /events
      */

      const baseURL = String(API || "").replace(/\/+$/, "");

      const response = await fetch(
        `${baseURL}/events?_t=${Date.now()}`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",

            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      const received = normalizeEvents(result);

      const latest = getLatestEvents(received);

      setEvents(latest);

      setLastUpdated(new Date());

      console.log(
        "ENVIGUARD LiveMap events:",
        latest
      );
    } catch (err) {
      console.error(
        "ENVIGUARD LiveMap API error:",
        err
      );

      setError(
        "Unable to connect to the ENVIGUARD backend."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    fetchEvents();

    const interval = setInterval(() => {
      fetchEvents();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const criticalCount = useMemo(() => {
    return events.filter((event) => {
      const risk = getRiskValue(event);

      return (
        String(event?.severity || "").toUpperCase() ===
          "CRITICAL" ||
        risk >= 80
      );
    }).length;
  }, [events]);

  const highCount = useMemo(() => {
    return events.filter((event) => {
      const risk = getRiskValue(event);

      return risk >= 60 && risk < 80;
    }).length;
  }, [events]);

  const activeHazards = useMemo(() => {
    return new Set(
      events
        .map((event) => event?.hazard)
        .filter(Boolean)
    ).size;
  }, [events]);

  /* =======================================================
     MAP CENTER
  ======================================================= */

  const center = [11.0168, 76.9558];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="live-map-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="live-map-header">

        <div>
          <div className="live-map-eyebrow">
            ENVIRONMENTAL INTELLIGENCE
          </div>

          <h1>
            Live Environmental Map
          </h1>

          <p>
            Real-time visualization of the
            ENVIGUARD multi-hazard sensor network.
          </p>
        </div>

        <div
          className={`map-status ${
            error ? "offline" : "online"
          }`}
        >
          <span className="status-dot"></span>

          {error
            ? "BACKEND OFFLINE"
            : "LIVE NETWORK"}
        </div>

      </div>

      {/* ===================================================
          STATISTICS
      =================================================== */}

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
            {error
              ? "Backend unavailable"
              : "Live sensor stream"}
          </small>
        </div>

      </div>

      {/* ===================================================
          MAP LAYOUT
      =================================================== */}

      <div className="map-layout">

        {/* =================================================
            MAP CARD
        ================================================= */}

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
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

          {/* ===============================================
              LEAFLET MAP
          =============================================== */}

          <div className="map-container">

            <MapContainer
              center={center}
              zoom={11}
              minZoom={5}
              maxZoom={18}
              scrollWheelZoom={true}
              className="leaflet-map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapViewUpdater events={events} />

              {/* ===========================================
                  SENSOR MARKERS
              =========================================== */}

              {events.map((event, index) => {

                const coordinates =
                  getCoordinates(event);

                if (!coordinates) {
                  return null;
                }

                const hazard =
                  event?.hazard;

                const config =
                  getHazardConfig(hazard);

                const risk =
                  getRiskValue(event);

                const riskLevel =
                  getRiskLevel(risk);

                const markerKey =
                  event?.node_id ||
                  event?.id ||
                  `node-${index}`;

                return (
                  <div
                    key={markerKey}
                  >

                    {/* MARKER */}

                    <Marker
                      position={coordinates}
                      icon={createHazardIcon(
                        hazard,
                        risk
                      )}
                      eventHandlers={{
                        click: () => {
                          setSelectedNode(event);
                        },
                      }}
                    >

                      {/* =================================
                          POPUP
                      ================================= */}

                      <Popup>

                        <div className="hazard-popup">

                          <div className="popup-icon">
                            {config.icon}
                          </div>

                          <h3>
                            {config.name}
                          </h3>

                          <p className="popup-node">
                            Node:{" "}
                            <strong>
                              {event?.node_id ||
                                "--"}
                            </strong>
                          </p>

                          <p className="popup-description">
                            {config.description}
                          </p>

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
                              {risk.toFixed(1)}%
                            </strong>

                          </div>

                          <div className="popup-row">
                            <span>
                              Severity
                            </span>

                            <strong>
                              {event?.severity ||
                                riskLevel}
                            </strong>
                          </div>

                          <div className="popup-row">
                            <span>
                              Confidence
                            </span>

                            <strong>
                              {event?.confidence != null
                                ? `${event.confidence}%`
                                : "--"}
                            </strong>
                          </div>

                          <div className="popup-row">
                            <span>
                              Trend
                            </span>

                            <strong>
                              {event?.trend ||
                                "Monitoring"}
                            </strong>
                          </div>

                          <div className="popup-row">
                            <span>
                              Status
                            </span>

                            <strong>
                              {event?.status ||
                                "ACTIVE"}
                            </strong>
                          </div>

                          {event?.prediction && (
                            <div className="popup-prediction">

                              <span>
                                🤖 AI PREDICTION
                              </span>

                              <p>
                                {event.prediction}
                              </p>

                            </div>
                          )}

                          <div className="popup-row">
                            <span>
                              Location
                            </span>

                            <strong>
                              {coordinates[0].toFixed(4)}
                              ,{" "}
                              {coordinates[1].toFixed(4)}
                            </strong>
                          </div>

                        </div>

                      </Popup>

                    </Marker>

                    {/* RISK RADIUS */}

                    <Circle
                      center={coordinates}
                      radius={
                        800 + risk * 10
                      }
                      pathOptions={{
                        color:
                          getRiskColor(risk),

                        fillColor:
                          getRiskColor(risk),

                        fillOpacity: 0.08,

                        weight: 2,
                      }}
                    />

                  </div>
                );
              })}

            </MapContainer>

            {/* =============================================
                MAP LEGEND
            ============================================= */}

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

        {/* =================================================
            SENSOR NODE PANEL
        ================================================= */}

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
                  Connecting to ENVIGUARD backend
                </span>

              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="empty-node">

                <strong>
                  ⚠️ Backend unavailable
                </strong>

                <span>
                  The map itself is ready.
                  Waiting for the production API.
                </span>

                <button
                  className="map-refresh"
                  onClick={fetchEvents}
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

            {events.map((event, index) => {

              const config =
                getHazardConfig(
                  event?.hazard
                );

              const risk =
                getRiskValue(event);

              const riskLevel =
                getRiskLevel(risk);

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
                    event?.id ||
                    `node-${index}`
                  }
                  onClick={() =>
                    setSelectedNode(event)
                  }
                >

                  <div
                    className="node-icon"
                    style={{
                      borderColor:
                        getRiskColor(
                          risk
                        ),

                      boxShadow:
                        `0 0 12px ${getRiskColor(
                          risk
                        )}55`,
                    }}
                  >
                    {config.icon}
                  </div>

                  <div className="node-info">

                    <strong>
                      {config.name}
                    </strong>

                    <span>
                      {event?.node_id ||
                        "--"}
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
                      {risk.toFixed(1)}%
                    </strong>

                    <span>
                      {event?.severity ||
                        riskLevel}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

      {/* ===================================================
          SELECTED NODE
      =================================================== */}

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
                {selectedNode.node_id}
              </strong>

              {" • "}

              Risk{" "}

              <strong>
                {getRiskValue(
                  selectedNode
                ).toFixed(1)}
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
                {selectedNode.severity ||
                  getRiskLevel(
                    selectedNode.risk_score
                  )}
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
                {selectedNode.trend ||
                  "--"}
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                {selectedNode.status ||
                  "ACTIVE"}
              </strong>
            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          FOOTER
      =================================================== */}

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