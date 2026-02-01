
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC22M25uN56_tRaHQ8K9Etj9IwAZlRpu_Y",
    authDomain: "zinson-ai.firebaseapp.com",
    projectId: "zinson-ai",
    storageBucket: "zinson-ai.firebasestorage.app",
    messagingSenderId: "528368134464",
    appId: "1:528368134464:web:6b45bb512d46421e0fb2a5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
