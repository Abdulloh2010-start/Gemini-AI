import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFFuTIHihpscOzPiIdOaiHh9CbyVieqD8",
  authDomain: "gemini-ai-580c1.firebaseapp.com",
  projectId: "gemini-ai-580c1",
  storageBucket: "gemini-ai-580c1.appspot.com",
  messagingSenderId: "262498072256",
  appId: "1:262498072256:web:xxx",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut };