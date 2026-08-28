// ============================================================
// ENVIGUARD AI - FRONTEND RISK ENGINE
// Converts sensor readings into environmental risk intelligence
// ============================================================

const HAZARD_CONFIG = {
  // ----------------------------------------------------------
  // 1. FLOOD
  // ----------------------------------------------------------
  flood: {
    sensors: {
      water_level: 0.45,
      rainfall: 0.30,
      soil_moisture: 0.25,
    },

    thresholds: {
      water_level: 70,
      rainfall: 50,
      soil_moisture: 75,
    },
  },

  // ----------------------------------------------------------
  // 2. FOREST FIRE
  // ----------------------------------------------------------
  forest_fire: {
    sensors: {
      temperature: 0.30,
      humidity: 0.20,
      smoke: 0.30,
      pm25: 0.20,
    },

    thresholds: {
      temperature: 38,
      humidity: 35,
      smoke: 50,
      pm25: 100,
    },
  },

  // ----------------------------------------------------------
  // 3. AIR POLLUTION
  // ----------------------------------------------------------
  air_pollution: {
    sensors: {
      pm25: 0.45,
      pm10: 0.25,
      gas: 0.20,
      temperature: 0.10,
    },

    thresholds: {
      pm25: 60,
      pm10: 100,
      gas: 50,
      temperature: 40,
    },
  },

  // ----------------------------------------------------------
  // 4. EXTREME HEAT
  // ----------------------------------------------------------
  extreme_heat: {
    sensors: {
      temperature: 0.60,
      humidity: 0.25,
      heat_index: 0.15,
    },

    thresholds: {
      temperature: 40,
      humidity: 70,
      heat_index: 45,
    },
  },

  // ----------------------------------------------------------
  // 5. LANDSLIDE
  // ----------------------------------------------------------
  landslide: {
    sensors: {
      soil_moisture: 0.35,
      rainfall: 0.25,
      vibration: 0.25,
      tilt: 0.15,
    },

    thresholds: {
      soil_moisture: 80,
      rainfall: 60,
      vibration: 50,
      tilt: 5,
    },
  },

  // ----------------------------------------------------------
  // 6. CHEMICAL LEAK
  // ----------------------------------------------------------
  chemical_leak: {
    sensors: {
      gas: 0.50,
      temperature: 0.20,
      humidity: 0.10,
      pm25: 0.20,
    },

    thresholds: {
      gas: 50,
      temperature: 45,
      humidity: 80,
      pm25: 100,
    },
  },

  // ----------------------------------------------------------
  // 7. WATER QUALITY
  // ----------------------------------------------------------
  water_quality: {
    sensors: {
      turbidity: 0.30,
      ph_deviation: 0.25,
      tds: 0.25,
      water_temperature: 0.20,
    },

    thresholds: {
      turbidity: 5,
      ph_deviation: 2,
      tds: 500,
      water_temperature: 35,
    },
  },
};


// ============================================================
// CALCULATE INDIVIDUAL SENSOR RISK
// ============================================================

export function calculateSensorRisk(value, threshold) {
  if (threshold <= 0) {
    return 0;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const risk = (numericValue / threshold) * 100;

  return Math.max(0, Math.min(100, risk));
}


// ============================================================
// GET SEVERITY
// ============================================================

export function getSeverity(riskScore) {
  const risk = Number(riskScore);

  if (risk >= 85) {
    return "CRITICAL";
  }

  if (risk >= 65) {
    return "HIGH";
  }

  if (risk >= 40) {
    return "WARNING";
  }

  return "SAFE";
}


// ============================================================
// GET TREND
// ============================================================

export function getTrend(riskScore) {
  const risk = Number(riskScore);

  if (risk >= 75) {
    return "ESCALATING";
  }

  if (risk >= 50) {
    return "DEVELOPING";
  }

  return "STABLE";
}


// ============================================================
// GET PREDICTION
// ============================================================

export function getPrediction(riskScore) {
  const risk = Number(riskScore);

  if (risk >= 85) {
    return (
      "Critical conditions may persist or escalate " +
      "within the next 15-30 minutes."
    );
  }

  if (risk >= 65) {
    return (
      "Risk is elevated and may reach critical levels " +
      "if current conditions continue."
    );
  }

  if (risk >= 40) {
    return (
      "Hazard indicators are developing. " +
      "Continued monitoring is recommended."
    );
  }

  return (
    "Current conditions remain within acceptable levels."
  );
}


// ============================================================
// CALCULATE CONFIDENCE
// ============================================================

export function calculateConfidence(
  hazard,
  measurements
) {
  const config = HAZARD_CONFIG[hazard];

  if (!config) {
    return 0;
  }

  const totalSensors = Object.keys(
    config.sensors
  ).length;

  const availableSensors = Object.keys(
    config.sensors
  ).filter(
    (sensor) =>
      measurements[sensor] !== undefined &&
      measurements[sensor] !== null
  ).length;

  if (totalSensors === 0) {
    return 0;
  }

  const dataCompleteness =
    availableSensors / totalSensors;

  return Math.round(
    Math.min(
      98,
      60 + dataCompleteness * 38
    )
  );
}


// ============================================================
// MAIN RISK ENGINE
// ============================================================

export function calculateRisk(
  hazard,
  measurements = {}
) {
  const normalizedHazard = String(hazard)
    .toLowerCase()
    .trim();

  const config =
    HAZARD_CONFIG[normalizedHazard];

  // ----------------------------------------------------------
  // UNSUPPORTED HAZARD
  // ----------------------------------------------------------

  if (!config) {
    return {
      hazard: normalizedHazard,
      risk_score: 0,
      severity: "UNKNOWN",
      confidence: 0,
      trend: "UNKNOWN",
      prediction: "Unsupported hazard",
      contributing_sensors: 0,
    };
  }


  let weightedRisk = 0;
  let availableWeight = 0;
  let contributingSensors = 0;


  // ----------------------------------------------------------
  // PROCESS SENSOR DATA
  // ----------------------------------------------------------

  Object.entries(config.sensors).forEach(
    ([sensor, weight]) => {

      if (
        measurements[sensor] === undefined ||
        measurements[sensor] === null
      ) {
        return;
      }

      let value = Number(
        measurements[sensor]
      );

      if (!Number.isFinite(value)) {
        return;
      }

      const threshold =
        config.thresholds[sensor];

      if (threshold === undefined) {
        return;
      }


      // Special handling for pH
      if (sensor === "ph_deviation") {
        value = Math.abs(value - 7);
      }


      const sensorRisk =
        calculateSensorRisk(
          value,
          threshold
        );


      weightedRisk +=
        sensorRisk * weight;

      availableWeight += weight;


      if (sensorRisk >= 70) {
        contributingSensors++;
      }
    }
  );


  // ----------------------------------------------------------
  // NO SENSOR DATA
  // ----------------------------------------------------------

  if (availableWeight === 0) {
    return {
      hazard: normalizedHazard,
      risk_score: 0,
      severity: "UNKNOWN",
      confidence: 0,
      trend: "INSUFFICIENT_DATA",
      prediction: "Insufficient sensor data",
      contributing_sensors: 0,
    };
  }


  // ----------------------------------------------------------
  // FINAL WEIGHTED RISK
  // ----------------------------------------------------------

  let riskScore =
    weightedRisk / availableWeight;


  riskScore = Number(
    Math.max(
      0,
      Math.min(100, riskScore)
    ).toFixed(1)
  );


  // ----------------------------------------------------------
  // SEVERITY
  // ----------------------------------------------------------

  const severity =
    getSeverity(riskScore);


  // ----------------------------------------------------------
  // CONFIDENCE
  // ----------------------------------------------------------

  const confidence =
    calculateConfidence(
      normalizedHazard,
      measurements
    );


  // ----------------------------------------------------------
  // TREND
  // ----------------------------------------------------------

  const trend =
    getTrend(riskScore);


  // ----------------------------------------------------------
  // PREDICTION
  // ----------------------------------------------------------

  const prediction =
    getPrediction(riskScore);


  // ----------------------------------------------------------
  // FINAL RESULT
  // ----------------------------------------------------------

  return {
    hazard: normalizedHazard,

    risk_score: riskScore,

    severity,

    confidence,

    trend,

    prediction,

    contributing_sensors:
      contributingSensors,
  };
}


// ============================================================
// GET HAZARD CONFIG
// Useful for UI / debugging
// ============================================================

export function getHazardConfig(hazard) {
  return HAZARD_CONFIG[
    String(hazard)
      .toLowerCase()
      .trim()
  ];
}


// ============================================================
// GET ALL SUPPORTED HAZARDS
// ============================================================

export function getSupportedHazards() {
  return Object.keys(
    HAZARD_CONFIG
  );
}