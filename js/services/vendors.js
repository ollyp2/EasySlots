/**
 * EasySeats - Vendors Service
 * Handles vendor profile and operations
 */

import { db, doc, getDoc, getDocs, updateDoc, collection, query, where, serverTimestamp, limit } from '../config/firebase.js';

/**
 * Get vendor by ID
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object|null>} Vendor data
 */
export async function getVendorById(vendorId) {
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
    return vendorDoc.exists() ? { id: vendorDoc.id, ...vendorDoc.data() } : null;
}

/**
 * Get vendor by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Vendor data
 */
export async function getVendorByUserId(userId) {
    const q = query(
        collection(db, 'vendors'),
        where('userId', '==', userId),
        limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const vendorDoc = snapshot.docs[0];
    return { id: vendorDoc.id, ...vendorDoc.data() };
}

/**
 * Update vendor profile
 * @param {string} vendorId - Vendor ID
 * @param {Object} data - Vendor data to update
 * @returns {Promise<void>}
 */
export async function updateVendor(vendorId, data) {
    await updateDoc(doc(db, 'vendors', vendorId), {
        ...data,
        updatedAt: serverTimestamp()
    });
}

/**
 * Get vendor's events count
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<number>} Events count
 */
export async function getVendorEventsCount(vendorId) {
    const q = query(collection(db, 'events'), where('vendorId', '==', vendorId));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

export default {
    getVendorById,
    getVendorByUserId,
    updateVendor,
    getVendorEventsCount
};
