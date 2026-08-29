import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA3dbSpiYhcuVDVbkQCj1iltG9AdHZbXNg",
  authDomain: "fyndyourhomes.firebaseapp.com",
  projectId: "fyndyourhomes",
  storageBucket: "fyndyourhomes.firebasestorage.app",
  messagingSenderId: "1021882064780",
  appId: "1:1021882064780:web:586106da3dfd7fcb0d40a9"
};

// Ensure 'export' is written before 'const app'
export const app = initializeApp(firebaseConfig);