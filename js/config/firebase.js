/**
 * EasySeats - Firebase Configuration
 *
 * IMPORTANT: Replace the placeholder values below with your actual Firebase project config.
 * You can find these values in your Firebase Console:
 * Project Settings > General > Your apps > Firebase SDK snippet > Config
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyByU5iDk4ovhm7LWDMRUgIlXdt-Ix4ELMw",
    authDomain: "easyseats-27784.firebaseapp.com",
    projectId: "easyseats-27784",
    storageBucket: "easyseats-27784.firebasestorage.app",
    messagingSenderId: "327144061396",
    appId: "1:327144061396:web:f18cbc57874fb95eccbe41",
    measurementId: "G-DS3Y9N9L8L"
};

// Firebase SDK imports (using CDN modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch,
    runTransaction
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import {
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');

// Uncomment for local development with emulators
// connectFunctionsEmulator(functions, 'localhost', 5001);

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Re-export commonly used functions for convenience
export {
    // Auth
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    // Firestore
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch,
    runTransaction,
    // Storage
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    // Functions
    httpsCallable
};

// Helper to check if Firebase is properly configured
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId === "easyseats-27784";
}

export default app;
