from datetime import datetime
from typing import Any

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import SessionLocal, engine, Base
from .models import (
    SensorReading,
    Alert,
    EnvironmentalEvent
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="ENVIGUARD API",
    version="1.0.0",
    description="Multi-Hazard Environmental Intelligence Network"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    # Local Vite frontend origins
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://10.84.74.179:5173",
        "http://10.84.74.179:5174",
    ],

    # Also accept another local development port if Vite changes it.
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.84\.74\.179)(:\d+)?$",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# HELPERS
# ============================================================

def safe_iso(value):

    if value is None:
        return None

    try:
        return value.isoformat()

    except Exception:
        return str(value)


def safe_float(value):

    try:

        if value is None:
            return None

        return float(value)

    except Exception:

        return None


def get_number(data, key, default=0):

    try:

        value = data.get(key, default)

        if value is None:
            return default

        return float(value)

    except Exception:

        return default


# ============================================================
# RISK ENGINE
# ============================================================

def calculate_risk(
    hazard: str,
    measurements: dict
):

    hazard = (hazard or "").lower()

    risk = 0

    findings = []

    actions = []


    # ========================================================
    # FLOOD
    # ========================================================

    if hazard in ["flood", "river"]:

        water = get_number(
            measurements,
            "water_level"
        )

        rain = get_number(
            measurements,
            "rainfall"
        )


        risk = max(
            risk,
            water
        )

        if water >= 80:

            risk = max(
                risk,
                90
            )

            findings.append(
                "Critical water level detected."
            )

        elif water >= 60:

            risk = max(
                risk,
                70
            )

            findings.append(
                "High water level detected."
            )


        if rain >= 50:

            risk = max(
                risk,
                70
            )

            findings.append(
                "Heavy rainfall detected."
            )


        actions = [
            "Monitor river and drainage levels.",
            "Prepare flood warning.",
            "Inspect nearby vulnerable areas."
        ]


    # ========================================================
    # FOREST FIRE
    # ========================================================

    elif hazard in [
        "forest_fire",
        "fire",
        "wildfire"
    ]:

        temperature = get_number(
            measurements,
            "temperature"
        )

        humidity = get_number(
            measurements,
            "humidity"
        )

        smoke = get_number(
            measurements,
            "smoke"
        )


        if temperature >= 40:

            risk = max(
                risk,
                70
            )

            findings.append(
                "High temperature detected."
            )


        if humidity > 0 and humidity <= 25:

            risk = max(
                risk,
                75
            )

            findings.append(
                "Very low humidity detected."
            )


        if smoke >= 50:

            risk = max(
                risk,
                90
            )

            findings.append(
                "Smoke signature detected."
            )


        actions = [
            "Monitor fire-prone area.",
            "Check for smoke and temperature escalation.",
            "Prepare emergency response."
        ]


    # ========================================================
    # AIR POLLUTION
    # ========================================================

    elif hazard in [
        "air_pollution",
        "air"
    ]:

        pm25 = get_number(
            measurements,
            "pm25"
        )

        pm10 = get_number(
            measurements,
            "pm10"
        )

        co = get_number(
            measurements,
            "co"
        )

        no2 = get_number(
            measurements,
            "no2"
        )


        risk = max(
            risk,
            min(pm25, 100)
        )

        risk = max(
            risk,
            min(pm10, 100)
        )


        if co >= 50:

            risk = max(
                risk,
                70
            )

            findings.append(
                "Elevated CO detected."
            )


        if no2 >= 50:

            risk = max(
                risk,
                70
            )

            findings.append(
                "Elevated NO2 detected."
            )


        actions = [
            "Continue air-quality monitoring.",
            "Issue public pollution warning if levels persist.",
            "Check nearby emission sources."
        ]


    # ========================================================
    # EXTREME HEAT
    # ========================================================

    elif hazard in [
        "extreme_heat",
        "heat"
    ]:

        temperature = get_number(
            measurements,
            "temperature"
        )

        humidity = get_number(
            measurements,
            "humidity"
        )

        heat_index = get_number(
            measurements,
            "heat_index"
        )


        if temperature >= 45:

            risk = max(
                risk,
                95
            )

            findings.append(
                "Extreme temperature detected."
            )

        elif temperature >= 40:

            risk = max(
                risk,
                80
            )

            findings.append(
                "High temperature detected."
            )


        if heat_index >= 45:

            risk = max(
                risk,
                90
            )

            findings.append(
                "Dangerous heat index detected."
            )


        actions = [
            "Issue heat warning.",
            "Monitor temperature continuously.",
            "Recommend heat-protection measures."
        ]


    # ========================================================
    # LANDSLIDE
    # ========================================================

    elif hazard in [
        "landslide",
        "slope"
    ]:

        soil = get_number(
            measurements,
            "soil_moisture"
        )

        rainfall = get_number(
            measurements,
            "rainfall"
        )

        vibration = get_number(
            measurements,
            "vibration"
        )

        tilt = get_number(
            measurements,
            "soil_tilt"
        )


        if soil >= 70:

            risk = max(
                risk,
                70
            )

            findings.append(
                "High soil moisture detected."
            )


        if rainfall >= 50:

            risk = max(
                risk,
                75
            )

            findings.append(
                "Heavy rainfall increases slope risk."
            )


        if vibration >= 60:

            risk = max(
                risk,
                80
            )

            findings.append(
                "Abnormal ground vibration detected."
            )


        if abs(tilt) >= 10:

            risk = max(
                risk,
                90
            )

            findings.append(
                "Significant soil tilt detected."
            )


        actions = [
            "Monitor slope movement.",
            "Inspect vulnerable slope region.",
            "Prepare evacuation warning if risk escalates."
        ]


    # ========================================================
    # CHEMICAL LEAK
    # ========================================================

    elif hazard in [
        "chemical_leak",
        "gas_leak",
        "chemical"
    ]:

        gas = get_number(
            measurements,
            "gas"
        )

        voc = get_number(
            measurements,
            "voc"
        )

        co = get_number(
            measurements,
            "co"
        )


        if gas >= 50:

            risk = max(
                risk,
                90
            )

            findings.append(
                "High gas concentration detected."
            )


        if voc >= 50:

            risk = max(
                risk,
                80
            )

            findings.append(
                "Elevated VOC detected."
            )


        if co >= 50:

            risk = max(
                risk,
                70
            )

            findings.append(
                "Elevated CO detected."
            )


        actions = [
            "Inspect industrial area.",
            "Check for chemical leakage.",
            "Issue emergency warning if concentration persists."
        ]


    # ========================================================
    # WATER QUALITY
    # ========================================================

    elif hazard in [
        "water_quality",
        "water"
    ]:

        ph = get_number(
            measurements,
            "ph"
        )

        turbidity = get_number(
            measurements,
            "turbidity"
        )

        tds = get_number(
            measurements,
            "tds"
        )

        oxygen = get_number(
            measurements,
            "dissolved_oxygen"
        )


        if ph > 0 and (
            ph < 6.5 or ph > 8.5
        ):

            risk = max(
                risk,
                70
            )

            findings.append(
                "Abnormal pH detected."
            )


        if turbidity >= 50:

            risk = max(
                risk,
                70
            )

            findings.append(
                "High turbidity detected."
            )


        if tds >= 1000:

            risk = max(
                risk,
                80
            )

            findings.append(
                "Elevated TDS detected."
            )


        if 0 < oxygen < 30:

            risk = max(
                risk,
                80
            )

            findings.append(
                "Low dissolved oxygen detected."
            )


        actions = [
            "Inspect affected water source.",
            "Continue water-quality monitoring.",
            "Issue contamination warning if thresholds persist."
        ]


    # ========================================================
    # DEFAULT
    # ========================================================

    else:

        findings.append(
            "General environmental monitoring active."
        )

        actions = [
            "Continue sensor monitoring.",
            "Review environmental conditions."
        ]


    # ========================================================
    # LIMIT RISK
    # ========================================================

    risk = min(
        max(
            risk,
            0
        ),
        100
    )


    # ========================================================
    # LEVEL
    # ========================================================

    if risk >= 80:

        level = "CRITICAL"

    elif risk >= 60:

        level = "HIGH"

    elif risk >= 40:

        level = "MEDIUM"

    else:

        level = "LOW"


    # ========================================================
    # PREDICTION
    # ========================================================

    if risk >= 80:

        prediction = (
            "Hazard conditions are currently critical. "
            "Risk may remain high or escalate if sensor "
            "parameters continue increasing."
        )

    elif risk >= 60:

        prediction = (
            "Hazard conditions are elevated. "
            "Continuous monitoring is recommended "
            "for possible escalation."
        )

    elif risk >= 40:

        prediction = (
            "Moderate environmental risk detected. "
            "Monitor the trend for further changes."
        )

    else:

        prediction = (
            "Current environmental conditions indicate "
            "low immediate risk."
        )


    return {
        "risk_score": round(
            risk,
            2
        ),

        "severity": level,

        "findings": findings,

        "recommended_actions": actions,

        "confidence": 88,

        "prediction": prediction
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "ENVIGUARD Backend",
        "version": "1.0.0"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/cors-test")
def cors_test():
    return {
        "status": "ok",
        "cors": "enabled",
    }


@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "ENVIGUARD Backend"
    }


# ============================================================
# GET SENSOR DATA
# ============================================================

@app.get("/api/sensor-data")
def get_sensor_data(
    db: Session = Depends(get_db)
):

    readings = (
        db.query(SensorReading)
        .order_by(
            desc(
                SensorReading.timestamp
            )
        )
        .limit(200)
        .all()
    )


    result = []


    for item in readings:

        measurements = (
            item.measurements
            if isinstance(
                item.measurements,
                dict
            )
            else {}
        )


        result.append({

            "id": item.id,

            "node_id": item.node_id,

            "hazard": item.hazard,

            "timestamp": safe_iso(
                item.timestamp
            ),

            "latitude": item.latitude,

            "longitude": item.longitude,

            "battery": item.battery,

            "device_status":
                item.device_status,

            "measurements":
                measurements
        })


    return {

        "count":
            len(result),

        "data":
            result
    }


# ============================================================
# POST SENSOR DATA
# ============================================================

@app.post("/api/sensor-data")
def receive_sensor_data(
    payload: dict,
    db: Session = Depends(get_db)
):

    measurements = payload.get(
        "measurements",
        {}
    )


    if not isinstance(
        measurements,
        dict
    ):

        measurements = {}


    # --------------------------------------------------------
    # Accept direct sensor values too
    # --------------------------------------------------------

    known_fields = [

        "water_level",
        "rainfall",
        "soil_moisture",

        "temperature",
        "humidity",

        "smoke",
        "gas",

        "pm25",
        "pm10",

        "co",
        "no2",
        "voc",

        "vibration",
        "soil_tilt",

        "ph",
        "turbidity",
        "tds",

        "dissolved_oxygen",

        "heat_index",
        "solar_radiation"
    ]


    for field in known_fields:

        if field in payload:

            measurements[field] = (
                payload[field]
            )


    hazard = payload.get(
        "hazard",
        "unknown"
    )


    node_id = payload.get(
        "node_id",
        "NODE_01"
    )


    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    timestamp_value = payload.get(
        "timestamp"
    )


    if timestamp_value:

        try:

            timestamp = datetime.fromisoformat(
                str(timestamp_value).replace(
                    "Z",
                    "+00:00"
                )
            )

            # Remove timezone for SQLite
            if timestamp.tzinfo:

                timestamp = timestamp.replace(
                    tzinfo=None
                )

        except Exception:

            timestamp = datetime.now()

    else:

        timestamp = datetime.now()


    # --------------------------------------------------------
    # Location
    # --------------------------------------------------------

    latitude = safe_float(
        payload.get(
            "latitude"
        )
    )

    longitude = safe_float(
        payload.get(
            "longitude"
        )
    )


    # --------------------------------------------------------
    # Device
    # --------------------------------------------------------

    battery = safe_float(
        payload.get(
            "battery"
        )
    )


    device_status = payload.get(
        "device_status",
        "online"
    )


    # ========================================================
    # CALCULATE RISK
    # ========================================================

    risk_result = calculate_risk(
        hazard,
        measurements
    )


    current_risk = risk_result[
        "risk_score"
    ]


    now = datetime.now()


    # ========================================================
    # SAVE SENSOR READING
    # ========================================================

    reading = SensorReading(

        node_id=node_id,

        hazard=hazard,

        timestamp=timestamp,

        latitude=latitude,

        longitude=longitude,

        measurements=measurements,

        battery=battery,

        device_status=device_status
    )


    db.add(reading)

    db.commit()

    db.refresh(reading)


    # ========================================================
    # FIND ACTIVE EVENT
    # ========================================================

    event = (

        db.query(
            EnvironmentalEvent
        )

        .filter(
            EnvironmentalEvent.node_id
            == node_id,

            EnvironmentalEvent.hazard
            == hazard,

            EnvironmentalEvent.status
            == "active"
        )

        .order_by(
            desc(
                EnvironmentalEvent.last_updated
            )
        )

        .first()
    )


    event_id = None


    # ========================================================
    # EVENT HANDLING
    # ========================================================

    if current_risk >= 40:

        # ----------------------------------------------------
        # CREATE NEW EVENT
        # ----------------------------------------------------

        if event is None:

            event = EnvironmentalEvent(

                node_id=node_id,

                hazard=hazard,

                severity=
                    risk_result[
                        "severity"
                    ],

                risk_score=current_risk,

                peak_risk_score=current_risk,

                confidence=
                    risk_result[
                        "confidence"
                    ],

                trend="NEW",

                latitude=latitude,

                longitude=longitude,

                start_time=timestamp,

                last_updated=now,

                status="active",

                prediction=
                    risk_result[
                        "prediction"
                    ],

                sensor_readings=
                    measurements,

                risk_history=[

                    {
                        "timestamp":
                            timestamp.isoformat(),

                        "risk_score":
                            current_risk,

                        "severity":
                            risk_result[
                                "severity"
                            ],

                        "trend":
                            "NEW"
                    }
                ]
            )


            db.add(event)

            db.commit()

            db.refresh(event)


        # ----------------------------------------------------
        # UPDATE EXISTING EVENT
        # ----------------------------------------------------

        else:

            previous_risk = (
                event.risk_score
                or 0
            )


            difference = (
                current_risk
                - previous_risk
            )


            if difference >= 10:

                trend = "ESCALATING"

            elif difference <= -10:

                trend = "IMPROVING"

            elif current_risk >= 65:

                trend = "STABLE_HIGH"

            else:

                trend = "STABLE"


            event.risk_score = (
                current_risk
            )


            event.peak_risk_score = max(

                event.peak_risk_score
                or 0,

                current_risk
            )


            event.severity = (
                risk_result[
                    "severity"
                ]
            )


            event.confidence = (
                risk_result[
                    "confidence"
                ]
            )


            event.trend = trend

            event.last_updated = now

            event.prediction = (
                risk_result[
                    "prediction"
                ]
            )

            event.sensor_readings = (
                measurements
            )


            history = (

                event.risk_history

                if isinstance(
                    event.risk_history,
                    list
                )

                else []
            )


            history.append({

                "timestamp":
                    timestamp.isoformat(),

                "risk_score":
                    current_risk,

                "severity":
                    risk_result[
                        "severity"
                    ],

                "trend":
                    trend
            })


            # Keep only last 50
            event.risk_history = (
                history[-50:]
            )


            db.commit()


        event_id = event.id


    # ========================================================
    # ALERT
    # ========================================================

    if current_risk >= 60:

        if current_risk >= 80:

            priority = "CRITICAL"

        else:

            priority = "HIGH"


        message = (
            f"{hazard.replace('_', ' ').upper()} "
            f"risk detected at {node_id}. "
            f"Current risk score: "
            f"{current_risk}%."
        )


        alert = Alert(

            event_id=event_id,

            node_id=node_id,

            hazard=hazard,

            level=
                risk_result[
                    "severity"
                ],

            priority=priority,

            risk_score=current_risk,

            confidence=
                risk_result[
                    "confidence"
                ],

            trend=(
                event.trend
                if event
                else "NEW"
            ),

            message=message,

            prediction=
                risk_result[
                    "prediction"
                ],

            sensor_readings=
                measurements,

            latitude=latitude,

            longitude=longitude,

            created_at=now,

            status="active"
        )


        db.add(alert)

        db.commit()

        db.refresh(alert)


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "status":
            "success",

        "message":
            "Sensor data received",

        "sensor_id":
            reading.id,

        "event_id":
            event_id,

        "hazard":
            hazard,

        "node_id":
            node_id,

        "risk_score":
            current_risk,

        "risk_level":
            risk_result[
                "severity"
            ],

        "confidence":
            risk_result[
                "confidence"
            ],

        "prediction":
            risk_result[
                "prediction"
            ]
    }


# ============================================================
# GET EVENTS
# ============================================================

@app.get("/api/events")
def get_events(
    db: Session = Depends(get_db)
):

    events = (

        db.query(
            EnvironmentalEvent
        )

        .order_by(
            desc(
                EnvironmentalEvent.start_time
            )
        )

        .limit(200)

        .all()
    )


    result = []


    for event in events:

        result.append({

            "id":
                event.id,

            "node_id":
                event.node_id,

            "hazard":
                event.hazard,

            "severity":
                event.severity,

            "risk_score":
                event.risk_score,

            "peak_risk_score":
                event.peak_risk_score,

            "confidence":
                event.confidence,

            "trend":
                event.trend,

            "latitude":
                event.latitude,

            "longitude":
                event.longitude,

            "start_time":
                safe_iso(
                    event.start_time
                ),

            "last_updated":
                safe_iso(
                    event.last_updated
                ),

            "resolved_time":
                safe_iso(
                    event.resolved_time
                ),

            "status":
                event.status,

            "prediction":
                event.prediction,

            "sensor_readings":
                (
                    event.sensor_readings
                    if isinstance(
                        event.sensor_readings,
                        dict
                    )
                    else {}
                ),

            "risk_history":
                (
                    event.risk_history
                    if isinstance(
                        event.risk_history,
                        list
                    )
                    else []
                )
        })


    return {

        "count":
            len(result),

        "data":
            result
    }


# ============================================================
# GET ALERTS
# ============================================================

@app.get("/api/alerts")
def get_alerts(
    db: Session = Depends(get_db)
):

    alerts = (

        db.query(Alert)

        .order_by(
            desc(
                Alert.created_at
            )
        )

        .limit(200)

        .all()
    )


    result = []


    for alert in alerts:

        result.append({

            "id":
                alert.id,

            "event_id":
                alert.event_id,

            "node_id":
                alert.node_id,

            "hazard":
                alert.hazard,

            "severity":
                alert.level,

            "level":
                alert.level,

            "priority":
                alert.priority,

            "risk_score":
                alert.risk_score,

            "confidence":
                alert.confidence,

            "trend":
                alert.trend,

            "message":
                alert.message,

            "prediction":
                alert.prediction,

            "sensor_readings":
                (
                    alert.sensor_readings
                    if isinstance(
                        alert.sensor_readings,
                        dict
                    )
                    else {}
                ),

            "latitude":
                alert.latitude,

            "longitude":
                alert.longitude,

            "created_at":
                safe_iso(
                    alert.created_at
                ),

            "status":
                alert.status
        })


    return {

        "count":
            len(result),

        "data":
            result
    }


# ============================================================
# GET SINGLE PREDICTION
# ============================================================

@app.get(
    "/api/prediction/{event_id}"
)
def get_prediction(

    event_id: int,

    db: Session = Depends(get_db)
):

    event = (

        db.query(
            EnvironmentalEvent
        )

        .filter(
            EnvironmentalEvent.id
            == event_id
        )

        .first()
    )


    if not event:

        raise HTTPException(

            status_code=404,

            detail="Event not found"
        )


    return {

        "event_id":
            event.id,

        "node_id":
            event.node_id,

        "hazard":
            event.hazard,

        "current_severity":
            event.severity,

        "risk_score":
            event.risk_score,

        "confidence":
            event.confidence,

        "trend":
            event.trend,

        "prediction":
            event.prediction
    }


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(

        "app.main:app",

        host="0.0.0.0",

        port=8000,

        reload=True
    )