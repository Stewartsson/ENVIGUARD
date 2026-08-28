import { ref, set, get } from "firebase/database";
import { database } from "./firebase";

export const testFirebase = async () => {
  try {
    await set(ref(database, "system/test"), {
      message: "ENVI-GUARD Firebase Connected",
      status: "online",
      timestamp: Date.now()
    });

    const snapshot = await get(ref(database, "system/test"));

    console.log("Firebase data:", snapshot.val());
    console.log("✅ Firebase connection successful!");

  } catch (error) {
    console.error("❌ Firebase error:", error);
  }
};