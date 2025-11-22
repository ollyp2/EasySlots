/**
 * EasySlots - Firestore Utilities for Cloud Functions
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const FieldValue = admin.firestore.FieldValue;

/**
 * Get document by ID
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export async function getDocument(collection, docId) {
    const doc = await db.collection(collection).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/**
 * Update document
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateDocument(collection, docId, data) {
    await db.collection(collection).doc(docId).update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
    });
}

/**
 * Create document
 * @param {string} collection - Collection name
 * @param {Object} data - Document data
 * @param {string} docId - Optional document ID
 * @returns {Promise<string>} Document ID
 */
export async function createDocument(collection, data, docId = null) {
    const docData = {
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    };

    if (docId) {
        await db.collection(collection).doc(docId).set(docData);
        return docId;
    } else {
        const ref = await db.collection(collection).add(docData);
        return ref.id;
    }
}

export default { db, auth, storage, FieldValue, getDocument, updateDocument, createDocument };
