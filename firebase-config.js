// ═══════════════════════════════════════════════════════════
//  FIREBASE CONFIGURATION
//  Replace with your own Firebase project credentials
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app, db;
let firebaseReady = false;

try {
  // Only initialize if config is set
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
    console.log("Firebase connected");
  } else {
    console.warn("Firebase not configured — running in offline mode. Survey data saved to localStorage.");
  }
} catch (e) {
  console.warn("Firebase init failed — running offline:", e);
}

// ─── PUBLIC API ───

export async function saveResponse(data) {
  if (firebaseReady && db) {
    try {
      const docRef = await addDoc(collection(db, "responses"), {
        ...data,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      console.error("Firebase save failed, using localStorage:", e);
    }
  }
  // Fallback: localStorage
  const stored = JSON.parse(localStorage.getItem('abu2030_responses') || '[]');
  const entry = { ...data, id: 'local_' + Date.now(), timestamp: new Date().toISOString() };
  stored.push(entry);
  localStorage.setItem('abu2030_responses', JSON.stringify(stored));
  return entry.id;
}

export async function getResponsesBySchool(schoolId) {
  if (firebaseReady && db) {
    try {
      const q = query(
        collection(db, "responses"),
        where("school", "==", schoolId),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Firebase read failed, using localStorage:", e);
    }
  }
  const stored = JSON.parse(localStorage.getItem('abu2030_responses') || '[]');
  return stored.filter(r => r.school === schoolId);
}

export async function getAllResponses() {
  if (firebaseReady && db) {
    try {
      const q = query(collection(db, "responses"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Firebase read failed, using localStorage:", e);
    }
  }
  return JSON.parse(localStorage.getItem('abu2030_responses') || '[]');
}

export { firebaseReady };
