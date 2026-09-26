# Firebase Integration

ENVIGUARD now supports receiving sensor data directly from **Firebase Realtime Database**. This is useful if your ESP32 or physical IoT nodes are already programmed to send data to Firebase instead of directly to the Render backend via HTTP POST.

### How it works
When the FastAPI server starts, it spins up a background Firebase Bridge. This bridge constantly listens to your Firebase Realtime Database at the `/enviguard/sensors` path. When a new sensor reading is pushed to Firebase, the bridge instantly intercepts it and forwards it through the ENVIGUARD AI Engine (FastAPI) to calculate the risk score and generate alerts.

### Setup Instructions

1. **Get your Service Account Key:**
   - Go to your [Firebase Console](https://console.firebase.google.com/).
   - Click the Gear icon (Project Settings) > **Service accounts**.
   - Click **Generate new private key** and download the JSON file.
   - Rename the downloaded file to `firebase-credentials.json` and place it in the `backend/` folder (next to this README).

2. **Set your Database URL:**
   - In your Render dashboard (or local `.env`), set the environment variable:
     `FIREBASE_DATABASE_URL = "https://your-project-id-default-rtdb.firebaseio.com"`

3. **NodeMCU / ESP32 Data Format:**
   Your physical hardware should push data to the `/enviguard/sensors` path in Firebase Realtime Database. The JSON payload should match the standard ENVIGUARD sensor format:
   ```json
   {
     "node_id": "RIVER_01",
     "hazard": "flood",
     "measurements": {
       "water_level": 5.2,
       "rainfall": 15.0,
       "temperature": 28.1,
       "humidity": 80.0
     }
   }
   ```

### Important Note
Do **NOT** commit `firebase-credentials.json` to GitHub! It is ignored in most standard Python projects, but always double check.
