// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1ablq_gH8XCdkZmyaT2z6qS8rPTPcUvc",
  authDomain: "accouting-2286e.firebaseapp.com",
  projectId: "accouting-2286e",
  storageBucket: "accouting-2286e.appspot.com",
  messagingSenderId: "1061367118375",
  appId: "1:1061367118375:web:07eb50bcab16fd63e92c02",
  measurementId: "G-YGKVJMHEWZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
