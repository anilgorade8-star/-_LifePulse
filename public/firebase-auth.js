import { auth, db } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const authGate = document.getElementById("auth-gate");
const googleLoginBtn = document.getElementById("google-login");
const logoutBtn = document.getElementById("logoutBtn");

// Manual Auth Elements
const manualSignInBtn = document.getElementById("manual-signin");
const manualSignUpBtn = document.getElementById("manual-signup");

const provider = new GoogleAuthProvider();

// --- AUTH HANDLERS ---

// Google Login
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // For Google login, check if user exists in Firestore, if not create basic entry
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Login failed: " + error.message);
    }
  });
}

// Manual Sign Up
if (manualSignUpBtn) {
  manualSignUpBtn.addEventListener("click", async () => {
    const name = document.getElementById("signup-name").value;
    const age = document.getElementById("signup-age").value;
    const gender = document.getElementById("signup-gender").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (!name || !email || !password || !age) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = result.user;

      // Update Auth Profile
      await updateProfile(user, { displayName: name });

      // Store in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        email: email,
        age: age,
        gender: gender,
        createdAt: new Date().toISOString(),
      });

      console.log("User registered and data stored in Firestore");
    } catch (error) {
      console.error("Sign Up Error:", error);
      alert("Registration failed: " + error.message);
    }
  });
}

// Manual Sign In
if (manualSignInBtn) {
  manualSignInBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Sign In Error:", error);
      alert("Login failed: " + error.message);
    }
  });
}

// Handle Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout Error:", error);
    }
  });
}

window.firebaseLogout = async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Firebase Logout Error:", error);
  }
};

// --- STATE OBSERVER ---

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User Logged In:", user.displayName);

    // Fetch user data from Firestore
    let userData = {
      displayName: user.displayName,
      email: user.email,
      profileCompleted: false,
    };

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userData = { ...userData, ...userDoc.data() };
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }

    // --- PROFILE COMPLETION GATE ---
    if (!userData.profileCompleted) {
      console.log("Profile incomplete, redirecting...");
      window.isProfileComplete = false;

      // Show only the complete-profile section
      if (authGate) authGate.style.display = "none";
      if (typeof window.showSection === "function") {
        window.showSection("complete-profile", false);
      }

      // Pre-fill complete profile form
      const cpName = document.getElementById("cp-name");
      const cpEmail = document.getElementById("cp-email");
      if (cpName) cpName.value = userData.displayName || "";
      if (cpEmail) cpEmail.value = userData.email || "";

      // Hide main navigation buttons to prevent skipping
      const navButtons = document.querySelectorAll(
        ".nav-btn, #mobileBottomNav button",
      );
      navButtons.forEach((btn) => (btn.style.pointerEvents = "none"));
      const medicalBtn = document.querySelector(
        "button[onclick*=\"showSection('medassist')\"]",
      );
      if (medicalBtn) medicalBtn.style.opacity = "0.5";
    } else {
      // Profile is complete
      window.isProfileComplete = true;
      if (authGate) authGate.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "flex";

      // Restore navigation
      const navButtons = document.querySelectorAll(
        ".nav-btn, #mobileBottomNav button",
      );
      navButtons.forEach((btn) => (btn.style.pointerEvents = "auto"));

      // If user was on complete-profile or home, send them to dashboard
      const currentHash = window.location.hash;
      if (
        currentHash === "#complete-profile" ||
        !currentHash ||
        currentHash === "#home"
      ) {
        if (typeof window.showSection === "function") {
          window.showSection("dashboard");
        }
      }
    }

    // Update LifePulse Profile UI (Dashboard & Sidebar)
    const profileNameDisp = document.getElementById("profileNameDisplay");
    const profileImg = document.getElementById("profileImage");
    const profileIcon = document.getElementById("profileIcon");

    if (profileNameDisp) profileNameDisp.textContent = userData.displayName;
    if (profileImg && (user.photoURL || userData.photoURL)) {
      profileImg.src = user.photoURL || userData.photoURL;
      profileImg.classList.remove("hidden");
      if (profileIcon) profileIcon.classList.add("hidden");
    }

    // Auto-fill Personal Information Menu
    const viewName = document.getElementById("viewName");
    const editName = document.getElementById("editName");
    const viewEmail = document.getElementById("viewEmail");
    const editEmail = document.getElementById("editEmail");

    // New Profile Fields (Manual Auth)
    const viewAge = document.getElementById("viewAge"); // Might need to add these IDs to index.html if not present
    const editAge = document.getElementById("editAge");
    const viewGender = document.getElementById("viewGender");
    const editGender = document.getElementById("editGender");

    if (viewName) viewName.textContent = userData.displayName;
    if (editName) editName.value = userData.displayName;
    if (viewEmail) viewEmail.textContent = userData.email;
    if (editEmail) editEmail.value = userData.email;

    if (userData.age) {
      if (viewAge) viewAge.textContent = userData.age;
      if (editAge) editAge.value = userData.age;
    }
    if (userData.gender) {
      if (viewGender) viewGender.textContent = userData.gender;
      if (editGender) editGender.value = userData.gender;
    }
  } else {
    console.log("No User");
    if (authGate) authGate.style.display = "flex";
    if (logoutBtn) logoutBtn.style.display = "none";

    const profilePanel = document.getElementById("profilePanel");
    if (profilePanel) profilePanel.classList.add("translate-x-full");
    const profileOverlay = document.getElementById("profileOverlay");
    if (profileOverlay) profileOverlay.classList.add("hidden");
  }
});

// Function to save profile completion data
window.saveProfileData = async (profileData) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  await setDoc(
    doc(db, "users", user.uid),
    {
      ...profileData,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return true;
};
