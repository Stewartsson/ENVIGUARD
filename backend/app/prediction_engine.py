from typing import Optional


# =========================================================
# ENVIGUARD PREDICTION ENGINE
# =========================================================

CRITICAL_THRESHOLD = 80


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def predict_risk(
    current_risk: float,
    risk_history: Optional[list] = None
):
    """
    Predict the next risk level using recent risk history.

    This is an explainable trend-based prediction layer.
    It does NOT claim to be a trained ML model.
    """

    # -----------------------------------------------------
    # NO HISTORY
    # -----------------------------------------------------

    if not risk_history:

        return {
            "current_risk": round(current_risk, 1),
            "previous_risk": None,
            "rate_of_change": 0,
            "predicted_risk": round(current_risk, 1),
            "direction": "UNKNOWN",
            "prediction": (
                "Insufficient historical data for prediction."
            ),
            "time_to_critical": None,
            "confidence": 50
        }


    # -----------------------------------------------------
    # EXTRACT RISK VALUES
    # -----------------------------------------------------

    recent_values = []

    for item in risk_history:

        if "risk_score" in item:

            recent_values.append(
                float(item["risk_score"])
            )


    recent_values = recent_values[-5:]


    if not recent_values:

        return {
            "current_risk": round(current_risk, 1),
            "previous_risk": None,
            "rate_of_change": 0,
            "predicted_risk": round(current_risk, 1),
            "direction": "UNKNOWN",
            "prediction": (
                "Insufficient historical data."
            ),
            "time_to_critical": None,
            "confidence": 50
        }


    # -----------------------------------------------------
    # PREVIOUS RISK
    # -----------------------------------------------------

    previous_risk = recent_values[-1]


    # -----------------------------------------------------
    # RATE OF CHANGE
    # -----------------------------------------------------

    if len(recent_values) >= 2:

        previous_previous = recent_values[-2]

        rate = (
            previous_risk
            - previous_previous
        )

    else:

        rate = (
            current_risk
            - previous_risk
        )


    # -----------------------------------------------------
    # PREDICT NEXT RISK
    # -----------------------------------------------------

    predicted_risk = clamp(
        current_risk + rate
    )


    # -----------------------------------------------------
    # TREND
    # -----------------------------------------------------

    if rate >= 5:

        direction = "RAPIDLY_ESCALATING"

    elif rate >= 1:

        direction = "ESCALATING"

    elif rate <= -5:

        direction = "RAPIDLY_IMPROVING"

    elif rate <= -1:

        direction = "IMPROVING"

    else:

        direction = "STABLE"


    # -----------------------------------------------------
    # TIME TO CRITICAL
    # -----------------------------------------------------

    time_to_critical = None

    if (
        rate > 0
        and current_risk < CRITICAL_THRESHOLD
    ):

        remaining = (
            CRITICAL_THRESHOLD
            - current_risk
        )

        cycles = remaining / rate

        time_to_critical = round(
            cycles,
            1
        )


    # -----------------------------------------------------
    # PREDICTION MESSAGE
    # -----------------------------------------------------

    if predicted_risk >= 90:

        prediction = (
            "Critical environmental conditions "
            "are likely in the next monitoring cycle "
            "if the current trend continues."
        )

    elif predicted_risk >= 80:

        prediction = (
            "High probability of critical conditions "
            "developing soon if the current trend persists."
        )

    elif predicted_risk >= 60:

        prediction = (
            "Risk is increasing and may progress "
            "to a high-risk condition."
        )

    elif predicted_risk >= 40:

        prediction = (
            "Environmental conditions require "
            "continued monitoring."
        )

    else:

        prediction = (
            "Current conditions remain relatively stable."
        )


    # -----------------------------------------------------
    # CONFIDENCE
    # -----------------------------------------------------

    history_length = len(recent_values)

    confidence = 60 + (
        history_length * 5
    )

    confidence = min(
        confidence,
        90
    )


    if abs(rate) >= 5:

        confidence += 5


    confidence = min(
        confidence,
        95
    )


    # -----------------------------------------------------
    # RESULT
    # -----------------------------------------------------

    return {

        "current_risk":
            round(current_risk, 1),

        "previous_risk":
            round(previous_risk, 1),

        "rate_of_change":
            round(rate, 2),

        "predicted_risk":
            round(predicted_risk, 1),

        "direction":
            direction,

        "prediction":
            prediction,

        "time_to_critical":
            time_to_critical,

        "confidence":
            confidence
    }