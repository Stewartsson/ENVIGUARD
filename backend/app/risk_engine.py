from typing import Dict


# =========================================================
# ENVIGUARD RISK ENGINE
# Version 1.0
#
# Converts multiple environmental sensor readings
# into a normalized risk score.
# =========================================================


HAZARD_CONFIG = {

    # -----------------------------------------------------
    # 1. FLOOD
    # -----------------------------------------------------

    "flood": {
        "sensors": {
            "water_level": 0.45,
            "rainfall": 0.30,
            "soil_moisture": 0.25
        },

        "thresholds": {
            "water_level": 70,
            "rainfall": 50,
            "soil_moisture": 75
        }
    },


    # -----------------------------------------------------
    # 2. FOREST FIRE
    # -----------------------------------------------------

    "forest_fire": {
        "sensors": {
            "temperature": 0.30,
            "humidity": 0.20,
            "smoke": 0.30,
            "pm25": 0.20
        },

        "thresholds": {
            "temperature": 38,
            "humidity": 35,
            "smoke": 50,
            "pm25": 100
        }
    },


    # -----------------------------------------------------
    # 3. AIR POLLUTION
    # -----------------------------------------------------

    "air_pollution": {
        "sensors": {
            "pm25": 0.45,
            "pm10": 0.25,
            "gas": 0.20,
            "temperature": 0.10
        },

        "thresholds": {
            "pm25": 60,
            "pm10": 100,
            "gas": 50,
            "temperature": 40
        }
    },


    # -----------------------------------------------------
    # 4. EXTREME HEAT
    # -----------------------------------------------------

    "extreme_heat": {
        "sensors": {
            "temperature": 0.60,
            "humidity": 0.25,
            "heat_index": 0.15
        },

        "thresholds": {
            "temperature": 40,
            "humidity": 70,
            "heat_index": 45
        }
    },


    # -----------------------------------------------------
    # 5. LANDSLIDE
    # -----------------------------------------------------

    "landslide": {
        "sensors": {
            "soil_moisture": 0.35,
            "rainfall": 0.25,
            "vibration": 0.25,
            "tilt": 0.15
        },

        "thresholds": {
            "soil_moisture": 80,
            "rainfall": 60,
            "vibration": 50,
            "tilt": 5
        }
    },


    # -----------------------------------------------------
    # 6. CHEMICAL LEAK
    # -----------------------------------------------------

    "chemical_leak": {
        "sensors": {
            "gas": 0.50,
            "temperature": 0.20,
            "humidity": 0.10,
            "pm25": 0.20
        },

        "thresholds": {
            "gas": 50,
            "temperature": 45,
            "humidity": 80,
            "pm25": 100
        }
    },


    # -----------------------------------------------------
    # 7. WATER QUALITY
    # -----------------------------------------------------

    "water_quality": {
        "sensors": {
            "turbidity": 0.30,
            "ph_deviation": 0.25,
            "tds": 0.25,
            "water_temperature": 0.20
        },

        "thresholds": {
            "turbidity": 5,
            "ph_deviation": 2,
            "tds": 500,
            "water_temperature": 35
        }
    }
}


# =========================================================
# SENSOR RISK CALCULATION
# =========================================================

def calculate_sensor_risk(
    value: float,
    threshold: float
) -> float:

    if threshold <= 0:
        return 0

    risk = (value / threshold) * 100

    return max(
        0,
        min(100, risk)
    )


# =========================================================
# MAIN RISK CALCULATION
# =========================================================

def calculate_risk(
    hazard: str,
    measurements: Dict[str, float]
) -> Dict:

    hazard = hazard.lower().strip()

    # -----------------------------------------------------
    # Check supported hazard
    # -----------------------------------------------------

    if hazard not in HAZARD_CONFIG:

        return {
            "hazard": hazard,
            "risk_score": 0,
            "severity": "UNKNOWN",
            "confidence": 0,
            "trend": "UNKNOWN",
            "prediction": "Unsupported hazard",
            "contributing_sensors": 0
        }


    config = HAZARD_CONFIG[hazard]

    weighted_risk = 0

    available_weight = 0

    contributing_sensors = 0


    # -----------------------------------------------------
    # Process each sensor
    # -----------------------------------------------------

    for sensor, weight in config["sensors"].items():

        if sensor not in measurements:
            continue

        value = measurements[sensor]

        threshold = config["thresholds"].get(sensor)

        if threshold is None:
            continue


        # Special handling for pH
        if sensor == "ph_deviation":

            value = abs(value - 7)


        sensor_risk = calculate_sensor_risk(
            value,
            threshold
        )


        weighted_risk += (
            sensor_risk * weight
        )

        available_weight += weight


        if sensor_risk >= 70:

            contributing_sensors += 1


    # -----------------------------------------------------
    # No data
    # -----------------------------------------------------

    if available_weight == 0:

        return {
            "hazard": hazard,
            "risk_score": 0,
            "severity": "UNKNOWN",
            "confidence": 0,
            "trend": "INSUFFICIENT_DATA",
            "prediction": "Insufficient sensor data",
            "contributing_sensors": 0
        }


    # -----------------------------------------------------
    # Final weighted risk
    # -----------------------------------------------------

    risk_score = (
        weighted_risk / available_weight
    )

    risk_score = round(
        max(
            0,
            min(100, risk_score)
        ),
        1
    )


    # =====================================================
    # SEVERITY
    # =====================================================

    if risk_score >= 85:

        severity = "CRITICAL"

    elif risk_score >= 65:

        severity = "HIGH"

    elif risk_score >= 40:

        severity = "WARNING"

    else:

        severity = "SAFE"


    # =====================================================
    # CONFIDENCE
    # =====================================================

    total_sensors = len(
        config["sensors"]
    )

    available_sensors = len([
        sensor
        for sensor in config["sensors"]
        if sensor in measurements
    ])


    data_completeness = (
        available_sensors /
        total_sensors
    )


    confidence = round(
        min(
            98,
            60 +
            (data_completeness * 38)
        )
    )


    # =====================================================
    # TREND
    # =====================================================

    if risk_score >= 75:

        trend = "ESCALATING"

    elif risk_score >= 50:

        trend = "DEVELOPING"

    else:

        trend = "STABLE"


    # =====================================================
    # PREDICTION
    # =====================================================

    if risk_score >= 85:

        prediction = (
            "Critical conditions may persist "
            "or escalate within the next "
            "15-30 minutes."
        )

    elif risk_score >= 65:

        prediction = (
            "Risk is elevated and may reach "
            "critical levels if current "
            "conditions continue."
        )

    elif risk_score >= 40:

        prediction = (
            "Hazard indicators are developing. "
            "Continued monitoring is recommended."
        )

    else:

        prediction = (
            "Current conditions remain within "
            "acceptable levels."
        )


    # =====================================================
    # FINAL RESULT
    # =====================================================

    return {

        "hazard": hazard,

        "risk_score": risk_score,

        "severity": severity,

        "confidence": confidence,

        "trend": trend,

        "prediction": prediction,

        "contributing_sensors":
            contributing_sensors
    }