import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";



// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJxZPOZ1xgpLsvtN2QaxTx2rBkYioe2YU",
  authDomain: "evernote-clone-d7d79.firebaseapp.com",
  projectId: "evernote-clone-d7d79",
  storageBucket: "evernote-clone-d7d79.firebasestorage.app",
  messagingSenderId: "714012547580",
  appId: "1:714012547580:web:0a724cae9ab14cbaefba79",
  measurementId: "G-J97V2NR150"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
