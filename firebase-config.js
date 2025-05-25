const firebaseConfig = {
  apiKey: "AIzaSyCdevSVueFGW07kURKAWpMWv7abL74YU3Q",
  authDomain: "campus-assistant-d4de2.firebaseapp.com",
  projectId: "campus-assistant-d4de2",
  storageBucket: "campus-assistant-d4de2.appspot.com",
  messagingSenderId: "810229206198",
  appId: "1:810229206198:web:7e85f37d919937db48ea17",
  measurementId: "G-TR2T6PV3YN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore DB
const db = firebase.firestore();

// ✅ Storage - this was missing!
const storage = firebase.storage();
