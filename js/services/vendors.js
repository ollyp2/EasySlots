/**
 * EasySlots - Vendors Service
 * Handles vendor profile and operations
 */

import { db, doc, getDoc, getDocs, updateDoc, collection, query, where, serverTimestamp } from '../config/firebase.js';

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
    updateVendor,
    getVendorEventsCount
};
