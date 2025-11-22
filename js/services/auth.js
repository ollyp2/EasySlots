/**
 * EasySlots - Authentication Service
 * Handles user authentication operations
 */

import {
    auth,
    db,
    googleProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from '../config/firebase.js';
import { CONSTANTS } from '../config/constants.js';

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export async function loginWithEmail(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

/**
 * Register a new user with email and password
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User credential
 */
export async function registerWithEmail({ email, password, firstName, lastName, isVendor = false }) {
    // Create auth user
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Update display name
    await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        role: isVendor ? CONSTANTS.USER_ROLES.VENDOR : CONSTANTS.USER_ROLES.BUYER,
        vendorId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // If vendor, create vendor profile
    if (isVendor) {
        const vendorRef = doc(db, 'vendors', user.uid);
        await setDoc(vendorRef, {
            userId: user.uid,
            businessName: `${firstName} ${lastName}`,
            description: '',
            email: user.email,
            phone: '',
            logo: '',
            stripeAccountId: null,
            stripeOnboarded: false,
            settings: {
                cancellationPolicy: 'flexible',
                autoConfirm: true
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Update user with vendorId
        await setDoc(doc(db, 'users', user.uid), { vendorId: user.uid }, { merge: true });
    }

    return user;
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} User credential
 */
export async function loginWithGoogle() {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
        // Create user document for new Google users
        const nameParts = (user.displayName || '').split(' ');
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            displayName: user.displayName || user.email,
            role: CONSTANTS.USER_ROLES.BUYER,
            vendorId: null,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    return user;
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function logout() {
    await signOut(auth);
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Get user profile from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile data
 */
export async function getUserProfile(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
}

export default {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    logout,
    getCurrentUser,
    getUserProfile
};
