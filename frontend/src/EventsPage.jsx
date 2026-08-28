import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";

import "./EventsPage.css";

const API_URL = "http://127.0.0.1:8000";

const HAZARD_INFO = {
  flood: {
    name: "Flood",
    icon: "🌊",
  },
  forest_fire: {
    name: "Forest Fire",
    icon: "🔥",
  },
  air_pollution: {
    name: "Air Pollution",
    icon: "🏭",
  },
  extreme_heat: {
    name: "Extreme Heat",
    icon: "🌡️",
  },
  landslide: {
    name: "Landslide",
    icon: "⛰️",
  },
  chemical_leak: {
    name: "Chemical Leak",
    icon: "☣️",
  },
  water_quality: {
    name: "Water Quality",
    icon: "💧",
  },
};

function getHazardInfo(hazard) {
  return (
    HAZARD_INFO[String(hazard || "").toLowerCase()] || {
      name: hazard || "Unknown Hazard",
      icon: "⚠️",
    }
  );
}

function getSeverity(event) {
  if (event.severity) {
    return String(event.severity).toUpperCase();
  }

  const risk = Number(event.risk_score || 0);

  if (risk >= 80) return "CRITICAL";
  if (risk >= 60) return "HIGH";
  if (risk >= 40) return "MEDIUM";

  return "LOW";
}

function getSeverityClass(severity) {
  switch (severity) {
    case "CRITICAL":
      return "severity-critical";

    case "HIGH":
      return "severity-high";

    case "MEDIUM":
      return "severity-medium";

    default:
      return "severity-low";
  }
}

function formatTime(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

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

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [hazardFilter, setHazardFilter] = useState("ALL");

  const [selectedEvent, setSelectedEvent] = useState(null);

  async function loadEvents(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/api/events`);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result = await response.json();

      const normalized = normalizeEvents(result);

      normalized.sort((a, b) => {
        const timeA = new Date(
          a.last_updated ||
            a.start_time ||
            a.created_at ||
            0
        ).getTime();

        const timeB = new Date(
          b.last_updated ||
            b.start_time ||
            b.created_at ||
            0
        ).getTime();

        return timeB - timeA;
      });

      setEvents(normalized);
    } catch (err) {
      console.error("Events API error:", err);

      setError(
        "Unable to connect to the ENVIGUARD backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();

    const interval = setInterval(() => {
      loadEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hazardOptions = useMemo(() => {
    const unique = [
      ...new Set(
        events
          .map((event) => event.hazard)
          .filter(Boolean)
      ),
    ];

    return unique;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const severity = getSeverity(event);

      const matchesSeverity =
        severityFilter === "ALL" ||
        severity === severityFilter;

      const matchesHazard =
        hazardFilter === "ALL" ||
        event.hazard === hazardFilter;

      if (!matchesSeverity || !matchesHazard) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        event.id,
        event.node_id,
        event.hazard,
        event.severity,
        event.status,
        event.trend,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    events,
    search,
    severityFilter,
    hazardFilter,
  ]);

  const statistics = useMemo(() => {
    const critical = events.filter(
      (event) => getSeverity(event) === "CRITICAL"
    ).length;

    const high = events.filter(
      (event) => getSeverity(event) === "HIGH"
    ).length;

    const active = events.filter(
      (event) =>
        String(event.status || "ACTIVE").toUpperCase() !==
        "RESOLVED"
    ).length;

    const averageRisk =
      events.length > 0
        ? events.reduce(
            (sum, event) =>
              sum + Number(event.risk_score || 0),
            0
          ) / events.length
        : 0;

    return {
      total: events.length,
      critical,
      high,
      active,
      averageRisk,
    };
  }, [events]);

  return (
    <div className="events-page">

      {/* HEADER */}

      <div className="events-header">

        <div>
          <div className="events-eyebrow">
            ENVIGUARD • ENVIRONMENTAL EVENT INTELLIGENCE
          </div>

          <h1>Environmental Events</h1>

          <p>
            Real-time events generated by the seven-hazard
            sensor network.
          </p>
        </div>

        <button
          className="events-refresh"
          onClick={() => loadEvents(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "refresh-spinning"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* STATISTICS */}

      <div className="events-stat-grid">

        <div className="events-stat-card">

          <div className="stat-icon blue">
            <Activity size={19} />
          </div>

          <div>
            <span>Total Events</span>
            <strong>{statistics.total}</strong>
          </div>

        </div>

        <div className="events-stat-card">

          <div className="stat-icon red">
            <ShieldAlert size={19} />
          </div>

          <div>
            <span>Critical</span>
            <strong className="red-text">
              {statistics.critical}
            </strong>
          </div>

        </div>

        <div className="events-stat-card">

          <div className="stat-icon orange">
            <AlertTriangle size={19} />
          </div>

          <div>
            <span>High Risk</span>
            <strong className="orange-text">
              {statistics.high}
            </strong>
          </div>

        </div>

        <div className="events-stat-card">

          <div className="stat-icon green">
            <TrendingUp size={19} />
          </div>

          <div>
            <span>Average Risk</span>
            <strong>
              {statistics.averageRisk.toFixed(1)}%
            </strong>
          </div>

        </div>

      </div>

      {/* FILTER BAR */}

      <div className="events-toolbar">

        <div className="events-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search node, hazard, event..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          value={severityFilter}
          onChange={(e) =>
            setSeverityFilter(e.target.value)
          }
        >
          <option value="ALL">
            All Severity
          </option>

          <option value="CRITICAL">
            Critical
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="MEDIUM">
            Medium
          </option>

          <option value="LOW">
            Low
          </option>
        </select>

        <select
          value={hazardFilter}
          onChange={(e) =>
            setHazardFilter(e.target.value)
          }
        >
          <option value="ALL">
            All Hazards
          </option>

          {hazardOptions.map((hazard) => (
            <option
              key={hazard}
              value={hazard}
            >
              {getHazardInfo(hazard).name}
            </option>
          ))}
        </select>

      </div>

      {/* ERROR */}

      {error && (
        <div className="events-error">
          <AlertTriangle size={18} />

          <div>
            <strong>
              Backend connection problem
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* EVENTS TABLE */}

      <div className="events-table-card">

        <div className="events-table-header">

          <div>
            <h2>Live Event Stream</h2>

            <p>
              Automatically updated every 5 seconds
            </p>
          </div>

          <div className="live-indicator">
            <span></span>
            LIVE
          </div>

        </div>

        {loading ? (
          <div className="events-loading">
            <Activity size={22} />

            <span>
              Loading environmental events...
            </span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="events-empty">
            <AlertTriangle size={28} />

            <h3>
              No events found
            </h3>

            <p>
              Try changing the filters or start
              the ENVIGUARD simulator.
            </p>
          </div>
        ) : (
          <div className="events-table-wrapper">

            <table className="events-table">

              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>HAZARD</th>
                  <th>NODE</th>
                  <th>RISK</th>
                  <th>SEVERITY</th>
                  <th>CONFIDENCE</th>
                  <th>TREND</th>
                  <th>TIME</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredEvents.map(
                  (event, index) => {

                    const hazard =
                      getHazardInfo(
                        event.hazard
                      );

                    const severity =
                      getSeverity(event);

                    const risk =
                      Number(
                        event.risk_score || 0
                      );

                    return (
                      <tr
                        key={
                          event.id ??
                          `${event.node_id}-${index}`
                        }
                      >

                        <td>

                          <div className="event-id">
                            #{event.id ?? index + 1}
                          </div>

                        </td>

                        <td>

                          <div className="hazard-cell">

                            <span className="hazard-emoji">
                              {hazard.icon}
                            </span>

                            <span>
                              {hazard.name}
                            </span>

                          </div>

                        </td>

                        <td>

                          <span className="node-badge">
                            {event.node_id ||
                              "UNKNOWN"}
                          </span>

                        </td>

                        <td>

                          <div className="risk-cell">

                            <strong
                              className={
                                risk >= 80
                                  ? "risk-critical"
                                  : risk >= 60
                                  ? "risk-high"
                                  : risk >= 40
                                  ? "risk-medium"
                                  : "risk-low"
                              }
                            >
                              {risk.toFixed(1)}%
                            </strong>

                            <div className="risk-bar">
                              <div
                                style={{
                                  width: `${Math.min(
                                    risk,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>

                          </div>

                        </td>

                        <td>

                          <span
                            className={`severity-badge ${getSeverityClass(
                              severity
                            )}`}
                          >
                            {severity}
                          </span>

                        </td>

                        <td>

                          <span className="confidence">
                            {event.confidence !=
                            null
                              ? `${event.confidence}%`
                              : "--"}
                          </span>

                        </td>

                        <td>

                          <span
                            className={
                              String(
                                event.trend ||
                                  ""
                              ).toUpperCase() ===
                              "ESCALATING"
                                ? "trend-up"
                                : "trend-normal"
                            }
                          >
                            {event.trend ||
                              "STABLE"}
                          </span>

                        </td>

                        <td>

                          <div className="event-time">

                            <Clock3 size={13} />

                            {formatTime(
                              event.last_updated ||
                                event.start_time
                            )}

                          </div>

                        </td>

                        <td>

                          <button
                            className="view-event"
                            onClick={() =>
                              setSelectedEvent(
                                event
                              )
                            }
                          >
                            <Eye size={15} />
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* EVENT DETAILS MODAL */}

      {selectedEvent && (
        <div
          className="event-modal-backdrop"
          onClick={() =>
            setSelectedEvent(null)
          }
        >

          <div
            className="event-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <div className="modal-eyebrow">
                  EVENT #{selectedEvent.id}
                </div>

                <h2>
                  {
                    getHazardInfo(
                      selectedEvent.hazard
                    ).icon
                  }{" "}
                  {
                    getHazardInfo(
                      selectedEvent.hazard
                    ).name
                  }
                </h2>

                <p>
                  Node{" "}
                  <strong>
                    {selectedEvent.node_id}
                  </strong>
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedEvent(null)
                }
              >
                <X size={19} />
              </button>

            </div>

            <div className="modal-risk-card">

              <div>

                <span>
                  CURRENT RISK
                </span>

                <strong>
                  {Number(
                    selectedEvent.risk_score ||
                      0
                  ).toFixed(1)}
                  %
                </strong>

              </div>

              <div
                className={`severity-badge ${getSeverityClass(
                  getSeverity(
                    selectedEvent
                  )
                )}`}
              >
                {getSeverity(
                  selectedEvent
                )}
              </div>

            </div>

            <div className="modal-grid">

              <div className="detail-card">

                <span>
                  CONFIDENCE
                </span>

                <strong>
                  {selectedEvent.confidence !=
                  null
                    ? `${selectedEvent.confidence}%`
                    : "--"}
                </strong>

              </div>

              <div className="detail-card">

                <span>
                  TREND
                </span>

                <strong>
                  {selectedEvent.trend ||
                    "STABLE"}
                </strong>

              </div>

              <div className="detail-card">

                <span>
                  STATUS
                </span>

                <strong>
                  {selectedEvent.status ||
                    "ACTIVE"}
                </strong>

              </div>

              <div className="detail-card">

                <span>
                  PEAK RISK
                </span>

                <strong>
                  {selectedEvent.peak_risk_score !=
                  null
                    ? `${Number(
                        selectedEvent.peak_risk_score
                      ).toFixed(1)}%`
                    : `${Number(
                        selectedEvent.risk_score ||
                          0
                      ).toFixed(1)}%`}
                </strong>

              </div>

            </div>

            {/* SENSOR READINGS */}

            <div className="sensor-section">

              <h3>
                Sensor Readings
              </h3>

              {selectedEvent.sensor_readings ? (
                <div className="sensor-grid">

                  {Object.entries(
                    typeof selectedEvent.sensor_readings ===
                      "string"
                      ? (() => {
                          try {
                            return JSON.parse(
                              selectedEvent.sensor_readings
                            );
                          } catch {
                            return {};
                          }
                        })()
                      : selectedEvent.sensor_readings
                  ).map(
                    ([key, value]) => (
                      <div
                        className="sensor-value"
                        key={key}
                      >
                        <span>
                          {key.replace(
                            /_/g,
                            " "
                          )}
                        </span>

                        <strong>
                          {typeof value ===
                          "number"
                            ? value.toFixed(2)
                            : String(
                                value
                              )}
                        </strong>
                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="no-sensor-data">
                  Sensor readings unavailable
                  for this event.
                </div>
              )}

            </div>

            {/* PREDICTION */}

            {selectedEvent.prediction && (
              <div className="prediction-box">

                <div className="prediction-title">
                  AI PREDICTION
                </div>

                <p>
                  {typeof selectedEvent.prediction ===
                  "string"
                    ? selectedEvent.prediction
                    : JSON.stringify(
                        selectedEvent.prediction
                      )}
                </p>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}