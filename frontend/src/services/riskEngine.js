from typing import Dict, Any


# ============================================================
# ENVIGUARD RISK ENGINE
# Version 2.0
#
# Matches the REAL sensor names used by simulator.py
#
# Supported hazards:
# 1. flood
# 2. forest_fire
# 3. air_pollution
# 4. extreme_heat
# 5. landslide
# 6. chemical_leak
# 7. water_quality
#
# Risk:
# 0-39   -> SAFE / LOW
# 40-64  -> WARNING
# 65-84  -> HIGH
# 85-100 -> CRITICAL
# ============================================================


# ============================================================
# HAZARD CONFIGURATION
# ============================================================

HAZARD_CONFIG = {

    # --------------------------------------------------------
    # 1. FLOOD
    # --------------------------------------------------------
    "flood": {

        "sensors": {
            "water_level": 0.45,
            "rainfall": 0.30,
            "soil_moisture": 0.25
        },

        # Normal/safe value
        "safe": {
            "water_level": 20,
            "rainfall": 5,
            "soil_moisture": 30
        },

        # Critical/danger value
        "danger": {
            "water_level": 70,
            "rainfall": 50,
            "soil_moisture": 75
        }
    },


    # --------------------------------------------------------
    # 2. FOREST FIRE
    # --------------------------------------------------------
    #
    # Simulator sends:
    # temperature
    # humidity
    # smoke
    # gas
    # wind_speed
    #
    # Fire risk increases with:
    # temperature ↑
    # smoke ↑
    # gas ↑
    # humidity ↓
    # wind ↑
    # --------------------------------------------------------

    "forest_fire": {

        "sensors": {
            "temperature": 0.25,
            "humidity": 0.20,
            "smoke": 0.30,
            "gas": 0.15,
            "wind_speed": 0.10
        },

        "safe": {
            "temperature": 25,
            "humidity": 65,
            "smoke": 5,
            "gas": 5,
            "wind_speed": 3
        },

        "danger": {
            "temperature": 45,
            "humidity": 20,
            "smoke": 80,
            "gas": 60,
            "wind_speed": 15
        }
    },


    # --------------------------------------------------------
    # 3. AIR POLLUTION
    # --------------------------------------------------------
    #
    # Simulator sends:
    # pm25
    # pm10
    # co
    # no2
    # temperature
    # --------------------------------------------------------

    "air_pollution": {

        "sensors": {
            "pm25": 0.40,
            "pm10": 0.25,
            "co": 0.15,
            "no2": 0.15,
            "temperature": 0.05
        },

        "safe": {
            "pm25": 10,
            "pm10": 20,
            "co": 0.3,
            "no2": 10,
            "temperature": 25
        },

        "danger": {
            "pm25": 100,
            "pm10": 200,
            "co": 10,
            "no2": 200,
            "temperature": 45
        }
    },


    # --------------------------------------------------------
    # 4. EXTREME HEAT
    # --------------------------------------------------------
    #
    # Simulator sends:
    # temperature
    # humidity
    # heat_index
    # solar_radiation
    # --------------------------------------------------------

    "extreme_heat": {

        "sensors": {
            "temperature": 0.40,
            "humidity": 0.15,
            "heat_index": 0.35,
            "solar_radiation": 0.10
        },

        "safe": {
            "temperature": 25,
            "humidity": 65,
            "heat_index": 27,
            "solar_radiation": 300
        },

        "danger": {
            "temperature": 45,
            "humidity": 20,
            "heat_index": 55,
            "solar_radiation": 1000
        }
    },


    # --------------------------------------------------------
    # 5. LANDSLIDE
    # --------------------------------------------------------
    #
    # IMPORTANT:
    # Simulator uses soil_tilt, NOT tilt.
    # --------------------------------------------------------

    "landslide": {

        "sensors": {
            "soil_moisture": 0.35,
            "rainfall": 0.25,
            "vibration": 0.25,
            "soil_tilt": 0.15
        },

        "safe": {
            "soil_moisture": 30,
            "rainfall": 5,
            "vibration": 2,
            "soil_tilt": 0.2
        },

        "danger": {
            "soil_moisture": 90,
            "rainfall": 80,
            "vibration": 30,
            "soil_tilt": 5
        }
    },


    # --------------------------------------------------------
    # 6. CHEMICAL LEAK
    # --------------------------------------------------------
    #
    # Simulator sends:
    # gas
    # voc
    # co
    # temperature
    # humidity
    #
    # IMPORTANT:
    # We do NOT expect pm25 here.
    # --------------------------------------------------------

    "chemical_leak": {

        "sensors": {
            "gas": 0.40,
            "voc": 0.30,
            "co": 0.15,
            "temperature": 0.10,
            "humidity": 0.05
        },

        "safe": {
            "gas": 3,
            "voc": 5,
            "co": 0.5,
            "temperature": 25,
            "humidity": 55
        },

        "danger": {
            "gas": 60,
            "voc": 100,
            "co": 10,
            "temperature": 50,
            "humidity": 90
        }
    },


    # --------------------------------------------------------
    # 7. WATER QUALITY
    # --------------------------------------------------------
    #
    # Simulator sends:
    # ph
    # turbidity
    # tds
    # temperature
    # dissolved_oxygen
    #
    # IMPORTANT:
    # pH is evaluated by deviation from neutral 7.0.
    #
    # Dissolved oxygen is inverse:
    # lower DO = higher risk.
    # --------------------------------------------------------

    "water_quality": {

        "sensors": {
            "ph": 0.30,
            "turbidity": 0.25,
            "tds": 0.20,
            "temperature": 0.10,
            "dissolved_oxygen": 0.15
        },

        "safe": {
            "ph": 7.0,
            "turbidity": 2,
            "tds": 200,
            "temperature": 26,
            "dissolved_oxygen": 8
        },

        "danger": {
            "ph": 4.0,
            "turbidity": 50,
            "tds": 1000,
            "temperature": 40,
            "dissolved_oxygen": 2
        }
    }
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    """
    Keep a value between minimum and maximum.
    """

    return max(
        minimum,
        min(maximum, value)
    )


# ============================================================
# NORMAL SENSOR RISK
# ============================================================

def calculate_sensor_risk(
    value: float,
    safe_value: float,
    danger_value: float
) -> float:

    """
    Convert a sensor value into a 0-100 risk score.

    0   = safe
    100 = danger
    """

    try:
        value = float(value)
        safe_value = float(safe_value)
        danger_value = float(danger_value)

    except (TypeError, ValueError):

        return 0.0


    # Avoid division by zero
    if danger_value == safe_value:

        return 0.0


    risk = (
        (value - safe_value)
        /
        (danger_value - safe_value)
    ) * 100


    return clamp(risk)


# ============================================================
# INVERSE SENSOR RISK
# ============================================================

def calculate_inverse_sensor_risk(
    value: float,
    safe_value: float,
    danger_value: float
) -> float:

    """
    Used when LOWER sensor values mean HIGHER risk.

    Examples:
    humidity for forest fire
    dissolved oxygen for water quality
    """

    try:
        value = float(value)
        safe_value = float(safe_value)
        danger_value = float(danger_value)

    except (TypeError, ValueError):

        return 0.0


    if safe_value == danger_value:

        return 0.0


    risk = (
        (safe_value - value)
        /
        (safe_value - danger_value)
    ) * 100


    return clamp(risk)


# ============================================================
# SPECIAL PH RISK
# ============================================================

def calculate_ph_risk(
    ph_value: float
) -> float:

    """
    Neutral pH = 7.

    Small deviation = low risk.
    Large deviation = high risk.

    Approximate danger deviation = 3 pH units.
    """

    try:
        ph_value = float(ph_value)

    except (TypeError, ValueError):

        return 0.0


    deviation = abs(
        ph_value - 7.0
    )


    # 3 units away from neutral = 100 risk
    risk = (
        deviation / 3.0
    ) * 100


    return clamp(risk)


# ============================================================
# SENSOR RISK ROUTER
# ============================================================

def get_sensor_risk(
    hazard: str,
    sensor: str,
    value: float,
    config: Dict[str, Any]
) -> float:

    """
    Select the correct risk calculation for each sensor.
    """

    safe_value = config["safe"][sensor]
    danger_value = config["danger"][sensor]


    # --------------------------------------------------------
    # pH
    # --------------------------------------------------------

    if hazard == "water_quality" and sensor == "ph":

        return calculate_ph_risk(value)


    # --------------------------------------------------------
    # FOREST FIRE HUMIDITY
    # --------------------------------------------------------

    if hazard == "forest_fire" and sensor == "humidity":

        return calculate_inverse_sensor_risk(
            value,
            safe_value,
            danger_value
        )


    # --------------------------------------------------------
    # EXTREME HEAT HUMIDITY
    # --------------------------------------------------------

    if hazard == "extreme_heat" and sensor == "humidity":

        return calculate_inverse_sensor_risk(
            value,
            safe_value,
            danger_value
        )


    # --------------------------------------------------------
    # WATER QUALITY DISSOLVED OXYGEN
    # --------------------------------------------------------

    if (
        hazard == "water_quality"
        and sensor == "dissolved_oxygen"
    ):

        return calculate_inverse_sensor_risk(
            value,
            safe_value,
            danger_value
        )


    # --------------------------------------------------------
    # NORMAL SENSOR
    # --------------------------------------------------------

    return calculate_sensor_risk(
        value,
        safe_value,
        danger_value
    )


# ============================================================
# SEVERITY
# ============================================================

def get_severity(
    risk_score: float
) -> str:

    if risk_score >= 85:

        return "CRITICAL"

    elif risk_score >= 65:

        return "HIGH"

    elif risk_score >= 40:

        return "WARNING"

    else:

        return "LOW"


# ============================================================
# TREND
# ============================================================

def get_trend(
    risk_score: float
) -> str:

    if risk_score >= 85:

        return "CRITICAL"

    elif risk_score >= 65:

        return "HIGH"

    elif risk_score >= 40:

        return "RISING"

    else:

        return "NORMAL"


# ============================================================
# PREDICTION
# ============================================================

def get_prediction(
    risk_score: float,
    severity: str
) -> str:

    if risk_score >= 85:

        return (
            "Critical hazard conditions detected. "
            "Risk may persist or escalate if "
            "environmental conditions continue."
        )


    elif risk_score >= 65:

        return (
            "Hazard conditions are elevated. "
            "Risk may reach critical levels if "
            "current conditions continue."
        )


    elif risk_score >= 40:

        return (
            "Hazard indicators are developing. "
            "Continued monitoring is recommended."
        )


    else:

        return (
            "Current environmental conditions "
            "indicate low immediate risk."
        )


# ============================================================
# CONFIDENCE
# ============================================================

def calculate_confidence(
    hazard: str,
    measurements: Dict[str, float]
) -> int:

    """
    Confidence is based on sensor-data completeness.

    Complete data:
        98%

    Partial data:
        proportionally lower

    Minimum:
        60%
    """

    config = HAZARD_CONFIG.get(
        hazard
    )


    if not config:

        return 0


    total_sensors = len(
        config["sensors"]
    )


    available_sensors = 0


    for sensor in config["sensors"]:

        if (
            sensor in measurements
            and measurements[sensor] is not None
        ):

            try:

                float(
                    measurements[sensor]
                )

                available_sensors += 1

            except (TypeError, ValueError):

                pass


    if total_sensors == 0:

        return 0


    completeness = (
        available_sensors
        /
        total_sensors
    )


    confidence = 60 + (
        completeness * 38
    )


    return int(
        round(
            min(
                98,
                confidence
            )
        )
    )


# ============================================================
# MAIN RISK CALCULATION
# ============================================================

def calculate_risk(
    hazard: str,
    measurements: Dict[str, float]
) -> Dict:

    """
    Main ENVIGUARD risk calculation.

    Returns the structure expected by main.py.
    """

    # --------------------------------------------------------
    # Normalize hazard
    # --------------------------------------------------------

    hazard = str(
        hazard
    ).lower().strip()


    # --------------------------------------------------------
    # Validate measurements
    # --------------------------------------------------------

    if measurements is None:

        measurements = {}


    if not isinstance(
        measurements,
        dict
    ):

        measurements = {}


    # --------------------------------------------------------
    # Unsupported hazard
    # --------------------------------------------------------

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


    config = HAZARD_CONFIG[
        hazard
    ]


    weighted_risk = 0.0

    available_weight = 0.0

    contributing_sensors = 0


    # --------------------------------------------------------
    # Process sensors
    # --------------------------------------------------------

    for sensor, weight in config[
        "sensors"
    ].items():

        # Sensor missing
        if sensor not in measurements:

            continue


        value = measurements[
            sensor
        ]


        # Invalid value
        try:

            value = float(value)

        except (TypeError, ValueError):

            continue


        sensor_risk = get_sensor_risk(

            hazard=hazard,

            sensor=sensor,

            value=value,

            config=config
        )


        weighted_risk += (
            sensor_risk * weight
        )


        available_weight += weight


        # Count significant contributors

        if sensor_risk >= 60:

            contributing_sensors += 1


    # --------------------------------------------------------
    # No usable data
    # --------------------------------------------------------

    if available_weight <= 0:

        return {

            "hazard": hazard,

            "risk_score": 0,

            "severity": "UNKNOWN",

            "confidence": 0,

            "trend": "INSUFFICIENT_DATA",

            "prediction": "Insufficient sensor data",

            "contributing_sensors": 0
        }


    # --------------------------------------------------------
    # Normalize weighted score
    # --------------------------------------------------------

    risk_score = (
        weighted_risk
        /
        available_weight
    )


    risk_score = round(
        clamp(risk_score),
        1
    )


    # --------------------------------------------------------
    # Severity
    # --------------------------------------------------------

    severity = get_severity(
        risk_score
    )


    # --------------------------------------------------------
    # Confidence
    # --------------------------------------------------------

    confidence = calculate_confidence(
        hazard,
        measurements
    )


    # --------------------------------------------------------
    # Trend
    # --------------------------------------------------------

    trend = get_trend(
        risk_score
    )


    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = get_prediction(
        risk_score,
        severity
    )


    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

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


# ============================================================
# OPTIONAL ALIAS
# ============================================================

def calculateRisk(
    hazard: str,
    measurements: Dict[str, float]
) -> Dict:

    """
    Compatibility alias.
    Allows older code to call calculateRisk().
    """

    return calculate_risk(
        hazard,
        measurements
    )


# ============================================================
# TEST MODE
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("ENVIGUARD RISK ENGINE TEST")
    print("=" * 70)


    # --------------------------------------------------------
    # WATER QUALITY NORMAL TEST
    # --------------------------------------------------------

    water_normal = {

        "ph": 7.12,

        "turbidity": 3.2,

        "tds": 260.0,

        "temperature": 26.56,

        "dissolved_oxygen": 7.6
    }


    result = calculate_risk(
        "water_quality",
        water_normal
    )


    print()
    print("WATER QUALITY NORMAL")
    print("-" * 70)

    for key, value in result.items():

        print(
            f"{key:25}: {value}"
        )


    # --------------------------------------------------------
    # CHEMICAL NORMAL TEST
    # --------------------------------------------------------

    chemical_normal = {

        "gas": 5.0,

        "voc": 7.0,

        "co": 0.9,

        "temperature": 28.2,

        "humidity": 58.89
    }


    result = calculate_risk(
        "chemical_leak",
        chemical_normal
    )


    print()
    print("CHEMICAL LEAK NORMAL")
    print("-" * 70)

    for key, value in result.items():

        print(
            f"{key:25}: {value}"
        )


    print()
    print("=" * 70)
    print("RISK ENGINE TEST COMPLETE")
    print("=" * 70)
    print()