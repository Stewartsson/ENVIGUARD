import requests
import time
import math
from datetime import datetime


# =========================================================
# ENVIGUARD REALISTIC 7-HAZARD SENSOR SIMULATOR
# =========================================================

API_URL = "http://127.0.0.1:8000/api/sensor-data"

# Time between complete sensor cycles
CYCLE_DELAY = 3

# Number of simulation steps
STEP = 0


# =========================================================
# 7 VIRTUAL SENSOR NODES
# =========================================================

NODES = [

    {
        "node_id": "RIVER_01",
        "hazard": "flood",
        "latitude": 11.0168,
        "longitude": 76.9558,
    },

    {
        "node_id": "FOREST_01",
        "hazard": "forest_fire",
        "latitude": 11.4102,
        "longitude": 76.6950,
    },

    {
        "node_id": "CITY_01",
        "hazard": "air_pollution",
        "latitude": 13.0827,
        "longitude": 80.2707,
    },

    {
        "node_id": "HEAT_01",
        "hazard": "extreme_heat",
        "latitude": 12.9716,
        "longitude": 77.5946,
    },

    {
        "node_id": "HILL_01",
        "hazard": "landslide",
        "latitude": 11.6650,
        "longitude": 76.6250,
    },

    {
        "node_id": "INDUSTRY_01",
        "hazard": "chemical_leak",
        "latitude": 11.5800,
        "longitude": 79.5000,
    },

    {
        "node_id": "WATER_01",
        "hazard": "water_quality",
        "latitude": 11.0168,
        "longitude": 76.9558,
    },

]


# =========================================================
# SIMULATION PHASE
# =========================================================

def get_phase(step):

    position = step % 30

    if position < 6:
        return "NORMAL"

    elif position < 12:
        return "RISING"

    elif position < 18:
        return "WARNING"

    elif position < 23:
        return "HIGH"

    elif position < 27:
        return "CRITICAL"

    else:
        return "RECOVERY"


# =========================================================
# SMOOTH VALUE HELPER
# =========================================================

def smooth(start, end, progress):

    progress = max(
        0.0,
        min(1.0, progress)
    )

    return start + (
        (end - start) * progress
    )


# =========================================================
# PHASE PROGRESS
# =========================================================

def get_progress(step):

    position = step % 30

    if position < 6:

        return position / 5

    elif position < 12:

        return (position - 6) / 5

    elif position < 18:

        return (position - 12) / 5

    elif position < 23:

        return (position - 18) / 4

    elif position < 27:

        return (position - 23) / 3

    else:

        return (position - 27) / 2


# =========================================================
# FLOOD
# =========================================================

def generate_flood(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        water = smooth(30, 40, progress)
        rain = smooth(5, 15, progress)
        moisture = smooth(35, 45, progress)

    elif phase == "RISING":

        water = smooth(40, 58, progress)
        rain = smooth(15, 35, progress)
        moisture = smooth(45, 65, progress)

    elif phase == "WARNING":

        water = smooth(58, 70, progress)
        rain = smooth(35, 55, progress)
        moisture = smooth(65, 78, progress)

    elif phase == "HIGH":

        water = smooth(70, 85, progress)
        rain = smooth(55, 75, progress)
        moisture = smooth(78, 90, progress)

    elif phase == "CRITICAL":

        water = smooth(85, 98, progress)
        rain = smooth(75, 100, progress)
        moisture = smooth(90, 98, progress)

    else:

        water = smooth(98, 35, progress)
        rain = smooth(100, 10, progress)
        moisture = smooth(98, 45, progress)

    return {
        "water_level": round(water, 2),
        "rainfall": round(rain, 2),
        "soil_moisture": round(moisture, 2),
        "temperature": round(27 + math.sin(step / 4), 2),
        "humidity": round(70 + math.sin(step / 5) * 5, 2),
    }


# =========================================================
# FOREST FIRE
# =========================================================

def generate_forest_fire(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        temperature = smooth(28, 31, progress)
        humidity = smooth(65, 55, progress)
        smoke = smooth(5, 10, progress)
        gas = smooth(5, 12, progress)
        wind = smooth(4, 7, progress)

    elif phase == "RISING":

        temperature = smooth(31, 35, progress)
        humidity = smooth(55, 42, progress)
        smoke = smooth(10, 25, progress)
        gas = smooth(12, 25, progress)
        wind = smooth(7, 10, progress)

    elif phase == "WARNING":

        temperature = smooth(35, 39, progress)
        humidity = smooth(42, 30, progress)
        smoke = smooth(25, 45, progress)
        gas = smooth(25, 40, progress)
        wind = smooth(10, 15, progress)

    elif phase == "HIGH":

        temperature = smooth(39, 44, progress)
        humidity = smooth(30, 20, progress)
        smoke = smooth(45, 70, progress)
        gas = smooth(40, 65, progress)
        wind = smooth(15, 22, progress)

    elif phase == "CRITICAL":

        temperature = smooth(44, 49, progress)
        humidity = smooth(20, 8, progress)
        smoke = smooth(70, 98, progress)
        gas = smooth(65, 98, progress)
        wind = smooth(22, 30, progress)

    else:

        temperature = smooth(49, 30, progress)
        humidity = smooth(8, 60, progress)
        smoke = smooth(98, 5, progress)
        gas = smooth(98, 5, progress)
        wind = smooth(30, 5, progress)

    return {
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "smoke": round(smoke, 2),
        "gas": round(gas, 2),
        "wind_speed": round(wind, 2),
    }


# =========================================================
# AIR POLLUTION
# =========================================================

def generate_air_pollution(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        pm25 = smooth(15, 30, progress)
        pm10 = smooth(30, 60, progress)
        co = smooth(0.5, 1.5, progress)
        no2 = smooth(10, 25, progress)

    elif phase == "RISING":

        pm25 = smooth(30, 60, progress)
        pm10 = smooth(60, 110, progress)
        co = smooth(1.5, 3, progress)
        no2 = smooth(25, 50, progress)

    elif phase == "WARNING":

        pm25 = smooth(60, 100, progress)
        pm10 = smooth(110, 180, progress)
        co = smooth(3, 5, progress)
        no2 = smooth(50, 80, progress)

    elif phase == "HIGH":

        pm25 = smooth(100, 180, progress)
        pm10 = smooth(180, 300, progress)
        co = smooth(5, 9, progress)
        no2 = smooth(80, 130, progress)

    elif phase == "CRITICAL":

        pm25 = smooth(180, 350, progress)
        pm10 = smooth(300, 500, progress)
        co = smooth(9, 15, progress)
        no2 = smooth(130, 200, progress)

    else:

        pm25 = smooth(350, 20, progress)
        pm10 = smooth(500, 40, progress)
        co = smooth(15, 0.7, progress)
        no2 = smooth(200, 15, progress)

    return {
        "pm25": round(pm25, 2),
        "pm10": round(pm10, 2),
        "co": round(co, 2),
        "no2": round(no2, 2),
        "temperature": round(28 + math.sin(step / 6) * 3, 2),
        "humidity": round(60 + math.sin(step / 5) * 10, 2),
    }


# =========================================================
# EXTREME HEAT
# =========================================================

def generate_extreme_heat(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        temperature = smooth(28, 32, progress)
        humidity = smooth(65, 55, progress)
        heat_index = smooth(30, 35, progress)
        solar = smooth(300, 450, progress)

    elif phase == "RISING":

        temperature = smooth(32, 36, progress)
        humidity = smooth(55, 45, progress)
        heat_index = smooth(35, 39, progress)
        solar = smooth(450, 600, progress)

    elif phase == "WARNING":

        temperature = smooth(36, 40, progress)
        humidity = smooth(45, 35, progress)
        heat_index = smooth(39, 43, progress)
        solar = smooth(600, 750, progress)

    elif phase == "HIGH":

        temperature = smooth(40, 44, progress)
        humidity = smooth(35, 25, progress)
        heat_index = smooth(43, 48, progress)
        solar = smooth(750, 900, progress)

    elif phase == "CRITICAL":

        temperature = smooth(44, 50, progress)
        humidity = smooth(25, 10, progress)
        heat_index = smooth(48, 56, progress)
        solar = smooth(900, 1100, progress)

    else:

        temperature = smooth(50, 30, progress)
        humidity = smooth(10, 60, progress)
        heat_index = smooth(56, 32, progress)
        solar = smooth(1100, 350, progress)

    return {
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "heat_index": round(heat_index, 2),
        "solar_radiation": round(solar, 2),
    }


# =========================================================
# LANDSLIDE
# =========================================================

def generate_landslide(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        moisture = smooth(35, 45, progress)
        rainfall = smooth(5, 15, progress)
        vibration = smooth(2, 5, progress)
        tilt = smooth(0.2, 0.8, progress)

    elif phase == "RISING":

        moisture = smooth(45, 60, progress)
        rainfall = smooth(15, 30, progress)
        vibration = smooth(5, 15, progress)
        tilt = smooth(0.8, 2, progress)

    elif phase == "WARNING":

        moisture = smooth(60, 72, progress)
        rainfall = smooth(30, 50, progress)
        vibration = smooth(15, 30, progress)
        tilt = smooth(2, 4, progress)

    elif phase == "HIGH":

        moisture = smooth(72, 85, progress)
        rainfall = smooth(50, 80, progress)
        vibration = smooth(30, 60, progress)
        tilt = smooth(4, 8, progress)

    elif phase == "CRITICAL":

        moisture = smooth(85, 98, progress)
        rainfall = smooth(80, 120, progress)
        vibration = smooth(60, 100, progress)
        tilt = smooth(8, 15, progress)

    else:

        moisture = smooth(98, 40, progress)
        rainfall = smooth(120, 10, progress)
        vibration = smooth(100, 3, progress)
        tilt = smooth(15, 0.5, progress)

    return {
        "soil_moisture": round(moisture, 2),
        "rainfall": round(rainfall, 2),
        "vibration": round(vibration, 2),
        "soil_tilt": round(tilt, 2),
        "temperature": round(25 + math.sin(step / 6) * 3, 2),
    }


# =========================================================
# CHEMICAL LEAK
# =========================================================

def generate_chemical_leak(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        gas = smooth(3, 8, progress)
        voc = smooth(5, 10, progress)
        co = smooth(0.5, 1.5, progress)
        temperature = smooth(27, 30, progress)

    elif phase == "RISING":

        gas = smooth(8, 20, progress)
        voc = smooth(10, 25, progress)
        co = smooth(1.5, 3, progress)
        temperature = smooth(30, 33, progress)

    elif phase == "WARNING":

        gas = smooth(20, 40, progress)
        voc = smooth(25, 45, progress)
        co = smooth(3, 6, progress)
        temperature = smooth(33, 36, progress)

    elif phase == "HIGH":

        gas = smooth(40, 70, progress)
        voc = smooth(45, 75, progress)
        co = smooth(6, 12, progress)
        temperature = smooth(36, 40, progress)

    elif phase == "CRITICAL":

        gas = smooth(70, 100, progress)
        voc = smooth(75, 100, progress)
        co = smooth(12, 30, progress)
        temperature = smooth(40, 45, progress)

    else:

        gas = smooth(100, 5, progress)
        voc = smooth(100, 5, progress)
        co = smooth(30, 1, progress)
        temperature = smooth(45, 28, progress)

    return {
        "gas": round(gas, 2),
        "voc": round(voc, 2),
        "co": round(co, 2),
        "temperature": round(temperature, 2),
        "humidity": round(55 + math.sin(step / 5) * 10, 2),
    }


# =========================================================
# WATER QUALITY
# =========================================================

def generate_water_quality(step):

    phase = get_phase(step)
    progress = get_progress(step)

    if phase == "NORMAL":

        ph = smooth(7.2, 7.0, progress)
        turbidity = smooth(2, 5, progress)
        tds = smooth(200, 350, progress)
        oxygen = smooth(8, 7, progress)

    elif phase == "RISING":

        ph = smooth(7.0, 6.5, progress)
        turbidity = smooth(5, 15, progress)
        tds = smooth(350, 550, progress)
        oxygen = smooth(7, 6, progress)

    elif phase == "WARNING":

        ph = smooth(6.5, 5.8, progress)
        turbidity = smooth(15, 30, progress)
        tds = smooth(550, 800, progress)
        oxygen = smooth(6, 4.5, progress)

    elif phase == "HIGH":

        ph = smooth(5.8, 5.0, progress)
        turbidity = smooth(30, 60, progress)
        tds = smooth(800, 1100, progress)
        oxygen = smooth(4.5, 3, progress)

    elif phase == "CRITICAL":

        ph = smooth(5.0, 4.0, progress)
        turbidity = smooth(60, 100, progress)
        tds = smooth(1100, 1500, progress)
        oxygen = smooth(3, 1, progress)

    else:

        ph = smooth(4.0, 7.2, progress)
        turbidity = smooth(100, 3, progress)
        tds = smooth(1500, 250, progress)
        oxygen = smooth(1, 8, progress)

    return {
        "ph": round(ph, 2),
        "turbidity": round(turbidity, 2),
        "tds": round(tds, 2),
        "temperature": round(26 + math.sin(step / 7) * 2, 2),
        "dissolved_oxygen": round(oxygen, 2),
    }


# =========================================================
# SENSOR DATA ROUTER
# =========================================================

def generate_sensor_data(hazard, step):

    if hazard == "flood":
        return generate_flood(step)

    elif hazard == "forest_fire":
        return generate_forest_fire(step)

    elif hazard == "air_pollution":
        return generate_air_pollution(step)

    elif hazard == "extreme_heat":
        return generate_extreme_heat(step)

    elif hazard == "landslide":
        return generate_landslide(step)

    elif hazard == "chemical_leak":
        return generate_chemical_leak(step)

    elif hazard == "water_quality":
        return generate_water_quality(step)

    return {}


# =========================================================
# SEND SENSOR DATA
# =========================================================

def send_sensor_data(node, step):

    measurements = generate_sensor_data(
        node["hazard"],
        step
    )

    phase = get_phase(step)

    # Slowly vary battery
    battery = 96 - ((step * 0.35) % 18)

    payload = {

        "node_id": node["node_id"],

        "hazard": node["hazard"],

        "timestamp": datetime.now().isoformat(),

        "latitude": node["latitude"],

        "longitude": node["longitude"],

        "measurements": measurements,

        "battery": round(
            battery,
            2
        ),

        "device_status": "online",
    }

    try:

        response = requests.post(
            API_URL,
            json=payload,
            timeout=10
        )

        print()
        print("=" * 78)

        print(
            f"NODE       : {node['node_id']}"
        )

        print(
            f"HAZARD     : {node['hazard']}"
        )

        print(
            f"PHASE      : {phase}"
        )

        print(
            f"STATUS     : {response.status_code}"
        )

        print(
            f"SENSOR DATA: {measurements}"
        )

        print(
            f"BATTERY    : {battery:.1f}%"
        )

        if response.status_code == 200:

            result = response.json()

            risk = result.get(
                "risk",
                {}
            )

            prediction = result.get(
                "prediction",
                {}
            )

            alert = result.get(
                "alert",
                {}
            )

            print(
                f"RISK       : "
                f"{risk.get('score', 'N/A')}"
            )

            print(
                f"SEVERITY   : "
                f"{risk.get('severity', 'N/A')}"
            )

            print(
                f"CONFIDENCE : "
                f"{prediction.get('confidence', 'N/A')}"
            )

            print(
                f"TREND      : "
                f"{prediction.get('direction', 'N/A')}"
            )

            print(
                f"PREDICTED  : "
                f"{prediction.get('predicted_risk', 'N/A')}"
            )

            print(
                f"ALERT      : "
                f"{alert.get('level', 'N/A')}"
            )

            print(
                f"EVENT ID   : "
                f"{result.get('event', {}).get('id', 'N/A')}"
            )

        else:

            print()
            print("❌ BACKEND ERROR")
            print(response.text)

    except requests.exceptions.RequestException as error:

        print()
        print("=" * 78)

        print(
            "❌ BACKEND CONNECTION ERROR"
        )

        print(
            f"Could not connect to: {API_URL}"
        )

        print(error)


# =========================================================
# MAIN SIMULATION LOOP
# =========================================================

def main():

    global STEP

    print()
    print("=" * 78)

    print(
        "        ENVIGUARD REALISTIC 7-HAZARD SIMULATOR"
    )

    print("=" * 78)

    print()

    print(
        f"Backend: {API_URL}"
    )

    print()

    print(
        "Simulated nodes:"
    )

    for node in NODES:

        print(
            f"  {node['node_id']:<15}"
            f" → {node['hazard']}"
        )

    print()

    print(
        "Scenario:"
    )

    print(
        "NORMAL → RISING → WARNING → HIGH → "
        "CRITICAL → RECOVERY"
    )

    print()

    print(
        "Starting simulation..."
    )

    print(
        "Press CTRL+C to stop."
    )

    print()

    try:

        while True:

            phase = get_phase(STEP)

            print()
            print("#" * 78)

            print(
                f"SIMULATION STEP: {STEP}"
            )

            print(
                f"ENVIRONMENT PHASE: {phase}"
            )

            print("#" * 78)

            for node in NODES:

                send_sensor_data(
                    node,
                    STEP
                )

                time.sleep(1)

            STEP += 1

            print()
            print(
                "🔄 Next environmental cycle..."
            )

            time.sleep(CYCLE_DELAY)

    except KeyboardInterrupt:

        print()
        print("=" * 78)

        print(
            "ENVIGUARD SIMULATOR STOPPED"
        )

        print("=" * 78)


# =========================================================
# START
# =========================================================

if __name__ == "__main__":

    main()