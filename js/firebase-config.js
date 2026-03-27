const firebaseConfig = {
  apiKey: "AIzaSyDiU0cygrN9zB3LiWaud-zeX4elFOKF408",
  authDomain: "dreamdoughph-88e46.firebaseapp.com",
  databaseURL: "https://dreamdoughph-88e46-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dreamdoughph-88e46",
  storageBucket: "dreamdoughph-88e46.firebasestorage.app",
  messagingSenderId: "114077781038",
  appId: "1:114077781038:web:bc9d5bce890bbcb022e3bf",
  measurementId: "G-DSQJGHRNXZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to services
const database = firebase.database();
const auth = firebase.auth();
const analytics = firebase.analytics();

// Log analytics events
console.log("✅ Firebase initialized successfully!");
console.log("✅ Analytics enabled!");