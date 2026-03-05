// ═══════════════════════════════════════════════════════════
//  FIREBASE CONFIGURATION
//  Replace with your own Firebase project credentials
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLOIdMIiItqOS3wXcxZF01uwcfRmOEJ_c",
  authDomain: "abu2030-transform-guide.firebaseapp.com",
  projectId: "abu2030-transform-guide",
  storageBucket: "abu2030-transform-guide.firebasestorage.app",
  messagingSenderId: "48714185841",
  appId: "1:48714185841:web:84f99bd8504761dce72fd0"
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
      // Simple query without composite index — filter by school only
      const q = query(
        collection(db, "responses"),
        where("school", "==", schoolId)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side by timestamp desc
      docs.sort((a, b) => {
        const ta = a.timestamp?.seconds || 0;
        const tb = b.timestamp?.seconds || 0;
        return tb - ta;
      });
      return docs;
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
      // Simple query without orderBy to avoid index requirement
      const snap = await getDocs(collection(db, "responses"));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side by timestamp desc
      docs.sort((a, b) => {
        const ta = a.timestamp?.seconds || 0;
        const tb = b.timestamp?.seconds || 0;
        return tb - ta;
      });
      return docs;
    } catch (e) {
      console.error("Firebase read failed, using localStorage:", e);
    }
  }
  return JSON.parse(localStorage.getItem('abu2030_responses') || '[]');
}

export { firebaseReady };
