import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
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
