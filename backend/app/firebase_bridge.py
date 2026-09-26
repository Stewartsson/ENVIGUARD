import os
import json
import threading
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Configuration
FIREBASE_CREDENTIALS_FILE = os.environ.get("FIREBASE_CREDENTIALS", "firebase-credentials.json")
FIREBASE_DATABASE_URL = os.environ.get("FIREBASE_DATABASE_URL", "https://your-firebase-project.firebaseio.com")
INTERNAL_API_URL = "http://127.0.0.1:8000/api/sensor-data"

def on_sensor_update(event):
    """
    Triggered whenever a new sensor reading is pushed to Firebase Realtime Database.
    """
    data = event.data
    path = event.path

    if not data or not isinstance(data, dict):
        return

    # If it's a new individual reading (e.g., someone pushed to /enviguard/sensors)
    if 'node_id' in data and 'hazard' in data and 'measurements' in data:
        try:
            print(f"[Firebase] Received data for node {data['node_id']}... Forwarding to ENVIGUARD AI Engine.")
            response = requests.post(INTERNAL_API_URL, json=data)
            
            if response.status_code == 200:
                print(f"[Firebase] Successfully processed {data['node_id']} through AI Engine.")
                
                # Optional: Once processed, you could delete it from Firebase to keep RTDB clean
                # ref = db.reference('/enviguard/sensors' + path)
                # ref.delete()
            else:
                print(f"[Firebase] AI Engine returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[Firebase] Error forwarding to AI Engine: {e}")

def _start_listener():
    try:
        # Check if credentials exist
        if not os.path.exists(FIREBASE_CREDENTIALS_FILE):
            print(f"[Firebase Warning] Credentials file not found at {FIREBASE_CREDENTIALS_FILE}.")
            print("[Firebase Warning] Firebase integration is currently inactive. Please add your credentials file.")
            return

        cred = credentials.Certificate(FIREBASE_CREDENTIALS_FILE)
        
        # Initialize Firebase Admin
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DATABASE_URL
            })

        print(f"[Firebase] Connected to Realtime Database: {FIREBASE_DATABASE_URL}")
        print(f"[Firebase] Listening for physical sensor events on /enviguard/sensors...")

        # Listen to new additions in the sensors path
        ref = db.reference('/enviguard/sensors')
        
        # We listen to child_added so we get triggered for every new sensor reading pushed
        ref.listen(on_sensor_update)

    except Exception as e:
        print(f"[Firebase] Failed to start listener: {e}")

def start_firebase_bridge():
    """
    Starts the Firebase Realtime Database listener in a background thread
    so it doesn't block the FastAPI server.
    """
    thread = threading.Thread(target=_start_listener, daemon=True)
    thread.start()
