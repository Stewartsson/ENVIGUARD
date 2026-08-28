from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    JSON
)

from .database import Base


# ============================================================
# SENSOR READINGS
# ============================================================

class SensorReading(Base):

    __tablename__ = "sensor_readings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    node_id = Column(
        String,
        index=True
    )

    hazard = Column(
        String,
        index=True
    )

    timestamp = Column(
        DateTime
    )

    latitude = Column(Float)

    longitude = Column(Float)

    measurements = Column(JSON)

    battery = Column(Float)

    device_status = Column(
        String,
        default="online"
    )


# ============================================================
# ALERTS
# ============================================================

class Alert(Base):

    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    event_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    node_id = Column(
        String,
        index=True
    )

    hazard = Column(
        String,
        index=True
    )

    level = Column(
        String,
        index=True
    )

    priority = Column(String)

    risk_score = Column(Float)

    confidence = Column(Float)

    trend = Column(String)

    message = Column(String)

    prediction = Column(String)

    sensor_readings = Column(JSON)

    latitude = Column(Float)

    longitude = Column(Float)

    created_at = Column(DateTime)

    status = Column(
        String,
        default="active"
    )


# ============================================================
# ENVIRONMENTAL EVENTS
# ============================================================

class EnvironmentalEvent(Base):

    __tablename__ = "environmental_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    node_id = Column(
        String,
        index=True
    )

    hazard = Column(
        String,
        index=True
    )

    severity = Column(
        String,
        index=True
    )

    risk_score = Column(Float)

    peak_risk_score = Column(Float)

    confidence = Column(Float)

    trend = Column(String)

    latitude = Column(Float)

    longitude = Column(Float)

    start_time = Column(DateTime)

    last_updated = Column(DateTime)

    resolved_time = Column(
        DateTime,
        nullable=True
    )

    status = Column(
        String,
        default="active"
    )

    prediction = Column(String)

    sensor_readings = Column(JSON)

    risk_history = Column(JSON)