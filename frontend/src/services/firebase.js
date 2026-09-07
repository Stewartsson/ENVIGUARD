// ============================================================
// ENVIGUARD AI - FIREBASE SERVICE
// Real-time Environmental Node Data Layer
// ============================================================

import { initializeApp } from "firebase/app";

import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  off,
  update
} from "firebase/database";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBIb--09dPri9K10wcbnkqxe_UxA5IMg24",
  authDomain: "envi-guard.firebaseapp.com",
  databaseURL:
    "https://envi-guard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "envi-guard",
  storageBucket: "envi-guard.firebasestorage.app",
  messagingSenderId: "314971404059",
  appId: "1:314971404059:web:7986021340fcbcb645c5be",
  measurementId: "G-WLLDQ3VBQM"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);

export default app;


// ============================================================
// 7 ENVIGUARD NODES
// ============================================================

export const NODE_CONFIG = {

  NODE_01: {
    node_id: "NODE_01",
    hazard: "flood",
    name: "Flood",
    location_name: "RIVER_01"
  },

  NODE_02: {
    node_id: "NODE_02",
    hazard: "forest_fire",
    name: "Forest Fire",
    location_name: "FOREST_01"
  },

  NODE_03: {
    node_id: "NODE_03",
    hazard: "air_pollution",
    name: "Air Pollution",
    location_name: "CITY_01"
  },

  NODE_04: {
    node_id: "NODE_04",
    hazard: "extreme_heat",
    name: "Extreme Heat",
    location_name: "HEAT_01"
  },

  NODE_05: {
    node_id: "NODE_05",
    hazard: "landslide",
    name: "Landslide",
    location_name: "HILL_01"
  },

  NODE_06: {
    node_id: "NODE_06",
    hazard: "chemical_leak",
    name: "Chemical Leak",
    location_name: "INDUSTRY_01"
  },

  NODE_07: {
    node_id: "NODE_07",
    hazard: "water_quality",
    name: "Water Quality",
    location_name: "WATER_01"
  }

};


// ============================================================
// SAVE NODE DATA
// ============================================================

export const saveNodeData = async (nodeId, data) => {

  try {

    const nodeRef = ref(
      database,
      `nodes/${nodeId}`
    );

    await set(nodeRef, {

      ...data,

      node_id: nodeId,

      last_updated: Date.now(),

      device_status:
        data.device_status || "online"

    });

    console.log(
      `✅ ${nodeId} data saved`
    );

    return true;

  } catch (error) {

    console.error(
      `❌ Failed to save ${nodeId}:`,
      error
    );

    return false;

  }

};


// ============================================================
// SAVE SENSOR HISTORY
// ============================================================

export const saveSensorHistory = async (
  nodeId,
  data
) => {

  try {

    const historyRef = ref(
      database,
      `sensor_history/${nodeId}`
    );

    const newReadingRef =
      push(historyRef);

    await set(
      newReadingRef,
      {
        ...data,
        timestamp:
          data.timestamp || Date.now()
      }
    );

    return true;

  } catch (error) {

    console.error(
      "❌ History save failed:",
      error
    );

    return false;

  }

};


// ============================================================
// SAVE ALERT
// ============================================================

export const saveAlert = async (
  alertData
) => {

  try {

    const alertsRef =
      ref(database, "alerts");

    const newAlertRef =
      push(alertsRef);

    await set(
      newAlertRef,
      {
        ...alertData,

        created_at:
          alertData.created_at ||
          Date.now(),

        status:
          alertData.status ||
          "active"
      }
    );

    console.log(
      "🚨 Alert saved"
    );

    return newAlertRef.key;

  } catch (error) {

    console.error(
      "❌ Alert save failed:",
      error
    );

    return null;

  }

};


// ============================================================
// SAVE ENVIRONMENTAL EVENT
// ============================================================

export const saveEvent = async (
  eventData
) => {

  try {

    const eventsRef =
      ref(database, "events");

    const newEventRef =
      push(eventsRef);

    await set(
      newEventRef,
      {
        ...eventData,

        created_at:
          eventData.created_at ||
          Date.now(),

        status:
          eventData.status ||
          "active"
      }
    );

    console.log(
      "🌍 Environmental event saved"
    );

    return newEventRef.key;

  } catch (error) {

    console.error(
      "❌ Event save failed:",
      error
    );

    return null;

  }

};


// ============================================================
// GET SINGLE NODE
// ============================================================

export const getNodeData = async (
  nodeId
) => {

  try {

    const nodeRef =
      ref(
        database,
        `nodes/${nodeId}`
      );

    const snapshot =
      await get(nodeRef);

    if (snapshot.exists()) {

      return snapshot.val();

    }

    return null;

  } catch (error) {

    console.error(
      "❌ Node read failed:",
      error
    );

    return null;

  }

};


// ============================================================
// GET ALL NODES
// ============================================================

export const getAllNodes = async () => {

  try {

    const nodesRef =
      ref(database, "nodes");

    const snapshot =
      await get(nodesRef);

    if (snapshot.exists()) {

      return snapshot.val();

    }

    return {};

  } catch (error) {

    console.error(
      "❌ Nodes read failed:",
      error
    );

    return {};

  }

};


// ============================================================
// REAL-TIME SINGLE NODE LISTENER
// ============================================================

export const subscribeToNode = (
  nodeId,
  callback
) => {

  const nodeRef =
    ref(
      database,
      `nodes/${nodeId}`
    );

  const listener = snapshot => {

    callback(
      snapshot.exists()
        ? snapshot.val()
        : null
    );

  };

  onValue(
    nodeRef,
    listener
  );

  return () => {

    off(
      nodeRef,
      "value",
      listener
    );

  };

};


// ============================================================
// REAL-TIME ALL NODE LISTENER
// ============================================================

export const subscribeToAllNodes = (
  callback
) => {

  const nodesRef =
    ref(database, "nodes");

  const listener = snapshot => {

    callback(
      snapshot.exists()
        ? snapshot.val()
        : {}
    );

  };

  onValue(
    nodesRef,
    listener
  );

  return () => {

    off(
      nodesRef,
      "value",
      listener
    );

  };

};


// ============================================================
// REAL-TIME ALERT LISTENER
// ============================================================

export const subscribeToAlerts = (
  callback
) => {

  const alertsRef =
    ref(database, "alerts");

  const listener = snapshot => {

    callback(
      snapshot.exists()
        ? snapshot.val()
        : {}
    );

  };

  onValue(
    alertsRef,
    listener
  );

  return () => {

    off(
      alertsRef,
      "value",
      listener
    );

  };

};


// ============================================================
// REAL-TIME EVENT LISTENER
// ============================================================

export const subscribeToEvents = (
  callback
) => {

  const eventsRef =
    ref(database, "events");

  const listener = snapshot => {

    callback(
      snapshot.exists()
        ? snapshot.val()
        : {}
    );

  };

  onValue(
    eventsRef,
    listener
  );

  return () => {

    off(
      eventsRef,
      "value",
      listener
    );

  };

};


// ============================================================
// UPDATE NODE STATUS
// ============================================================

export const updateNodeStatus = async (
  nodeId,
  status
) => {

  try {

    const nodeRef =
      ref(
        database,
        `nodes/${nodeId}`
      );

    await update(
      nodeRef,
      {
        device_status: status,
        last_updated: Date.now()
      }
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Status update failed:",
      error
    );

    return false;

  }

};


// ============================================================
// TEST FIREBASE CONNECTION
// ============================================================

export const testFirebaseConnection =
  async () => {

    try {

      const testRef =
        ref(
          database,
          "system/test"
        );

      await set(
        testRef,
        {
          message:
            "ENVI-GUARD Firebase Connected",

          status:
            "online",

          timestamp:
            Date.now()
        }
      );

      const snapshot =
        await get(testRef);

      console.log(
        "🔥 Firebase test:",
        snapshot.val()
      );

      return true;

    } catch (error) {

      console.error(
        "❌ Firebase connection error:",
        error
      );

      return false;

    }

  };