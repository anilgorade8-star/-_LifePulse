import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =============================================================
// 🔐 SECURITY NOTE — Firebase Web API Key (Safe to be public)
// =============================================================
// The Firebase Web config below is INTENTIONALLY public.
// Firebase Browser SDKs are designed to be shipped to clients.
// This key does NOT grant admin access to your project.
// Security is enforced by Firebase Security Rules (Firestore/Storage)
// and by your OAuth allowed-origin settings in the Firebase Console.
//
// ⚠️  What you MUST keep secret (use .env / server-side only):
//   - Firebase Admin SDK service account JSON
//   - Google Gemini API Key      ← stored in .env  (GEMINI_API_KEY)
//   - Any other server-side credentials
//
// Docs: https://firebase.google.com/docs/projects/api-keys
// =============================================================
const firebaseConfig = {
    apiKey: "AIzaSyDLafTH1VCWlGejJVoYZCwoWVlTV-rwzWY",
    authDomain: "lifepulse-5ab20.firebaseapp.com",
    projectId: "lifepulse-5ab20",
    storageBucket: "lifepulse-5ab20.appspot.com",
    messagingSenderId: "944160711421",
    appId: "1:944160711421:web:bf5494655d6e65ee351494"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

