# =========================================================
# ENVIGUARD ALERT ENGINE
# =========================================================


# ---------------------------------------------------------
# ALERT LEVEL CONFIGURATION
# ---------------------------------------------------------

ALERT_LEVELS = {

    "SAFE": {
        "min": 0,
        "max": 39,
        "priority": "LOW"
    },

    "WARNING": {
        "min": 40,
        "max": 64,
        "priority": "MEDIUM"
    },

    "HIGH": {
        "min": 65,
        "max": 84,
        "priority": "HIGH"
    },

    "CRITICAL": {
        "min": 85,
        "max": 100,
        "priority": "URGENT"
    }
}


# =========================================================
# DETERMINE ALERT LEVEL
# =========================================================

def determine_alert_level(
    risk_score: float
) -> str:

    if risk_score >= 85:

        return "CRITICAL"

    elif risk_score >= 65:

        return "HIGH"

    elif risk_score >= 40:

        return "WARNING"

    else:

        return "SAFE"


# =========================================================
# CREATE ALERT
# =========================================================

def create_alert(
    hazard: str,
    node_id: str,
    risk_result: dict,
    measurements: dict
) -> dict:

    risk_score = risk_result.get(
        "risk_score",
        0
    )


    # Determine severity
    level = determine_alert_level(
        risk_score
    )


    config = ALERT_LEVELS[level]


    # -----------------------------------------------------
    # SAFE CONDITION
    # -----------------------------------------------------

    if level == "SAFE":

        return {

            "alert_created": False,

            "level": "SAFE",

            "priority": "LOW",

            "hazard": hazard,

            "node_id": node_id,

            "risk_score": risk_score,

            "message":
                "No immediate environmental "
                "threat detected."
        }


    # -----------------------------------------------------
    # WARNING / HIGH / CRITICAL
    # -----------------------------------------------------

    return {

        "alert_created": True,

        "level": level,

        "priority":
            config["priority"],

        "hazard": hazard,

        "node_id": node_id,

        "risk_score": risk_score,

        "confidence":
            risk_result.get(
                "confidence",
                0
            ),

        "trend":
            risk_result.get(
                "trend",
                "UNKNOWN"
            ),

        "prediction":
            risk_result.get(
                "prediction",
                ""
            ),

        "sensor_readings":
            measurements,

        "message":
            generate_alert_message(
                hazard,
                level,
                risk_score
            )
    }


# =========================================================
# ALERT MESSAGE
# =========================================================

def generate_alert_message(
    hazard: str,
    level: str,
    risk_score: float
) -> str:

    hazard_name = (
        hazard
        .replace("_", " ")
        .title()
    )


    if level == "CRITICAL":

        return (
            f"CRITICAL {hazard_name} risk detected. "
            f"Risk score is {risk_score}%. "
            f"Immediate attention is required."
        )


    elif level == "HIGH":

        return (
            f"HIGH {hazard_name} risk detected. "
            f"Risk score is {risk_score}%. "
            f"Authorities should monitor the location."
        )


    else:

        return (
            f"WARNING: {hazard_name} indicators "
            f"are developing. Risk score is "
            f"{risk_score}%."
        )