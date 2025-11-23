/**
 * EasySeats - Users Service
 * Handles user profile operations
 */

import { db, doc, getDoc, updateDoc, serverTimestamp } from '../config/firebase.js';

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data
 */
export async function getUserById(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} data - Profile data to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(userId, data) {
    await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export default {
    getUserById,
    updateUserProfile
};
