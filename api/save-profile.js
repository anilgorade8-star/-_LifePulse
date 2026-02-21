const admin = require("firebase-admin");

// Initialize Firebase Admin (handles multiple initializations)
if (!admin.apps.length) {
  try {
    // If credentials are in environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback for local dev or if using GOOGLE_APPLICATION_CREDENTIALS
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { uid, profileData } = req.body;

    if (!uid || !profileData) {
      return res
        .status(400)
        .json({ error: "Missing required fields: uid and profileData" });
    }

    // Optional: Verify Firebase Token for security
    // const idToken = req.headers.authorization?.split('Bearer ')[1];
    // if (idToken) {
    //     const decodedToken = await admin.auth().verifyIdToken(idToken);
    //     if (decodedToken.uid !== uid) throw new Error("Unauthorized");
    // }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create user if not exists (should not happen with our flow, but for safety)
      await userRef.set({
        ...profileData,
        profileCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Update existing user, DO NOT overwrite core fields unless intended
      // We use merge: true or only update specific fields
      await userRef.set(
        {
          ...profileData,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error in save-profile API:", error);
    return res
      .status(500)
      .json({ error: "Failed to save profile", details: error.message });
  }
};
