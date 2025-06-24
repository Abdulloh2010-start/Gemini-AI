// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFFuTIHihpscOzPiIdOaiHh9CbyVieqD8",
  authDomain: "gemini-ai-580c1.firebaseapp.com",
  projectId: "gemini-ai-580c1",
  storageBucket: "gemini-ai-580c1.appspot.com",
  messagingSenderId: "262498072256",
  appId: "1:262498072256:web:xxx", // можно оставить как есть или вставить полный ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
