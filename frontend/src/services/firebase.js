import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBIb--09dPri9K10wcbnkqxe_UxA5IMg24",
  authDomain: "envi-guard.firebaseapp.com",
  databaseURL: "https://envi-guard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "envi-guard",
  storageBucket: "envi-guard.firebasestorage.app",
  messagingSenderId: "314971404059",
  appId: "1:314971404059:web:7986021340fcbcb645c5be",
  measurementId: "G-WLLDQ3VBQM"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);

export default app;