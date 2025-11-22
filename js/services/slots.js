/**
 * EasySlots - Slots Service
 * Handles time slot operations
 */

import { db, doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, orderBy, serverTimestamp, runTransaction } from '../config/firebase.js';

/**
 * Get slots for an event
 * @param {string} eventId - Event ID
 * @param {Date} date - Optional date filter
 * @returns {Promise<Array>} Slots array
 */
export async function getEventSlots(eventId, date = null) {
    let q = query(
        collection(db, 'events', eventId, 'slots'),
        orderBy('startTime', 'asc')
    );

    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        q = query(q, where('date', '>=', startOfDay), where('date', '<=', endOfDay));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a specific slot
 * @param {string} eventId - Event ID
 * @param {string} slotId - Slot ID
 * @returns {Promise<Object|null>} Slot data
 */
export async function getSlotById(eventId, slotId) {
    const slotDoc = await getDoc(doc(db, 'events', eventId, 'slots', slotId));
    return slotDoc.exists() ? { id: slotDoc.id, ...slotDoc.data() } : null;
}

/**
 * Reserve spots in a slot (atomic operation)
 * @param {string} eventId - Event ID
 * @param {string} slotId - Slot ID
 * @param {number} spots - Number of spots to reserve
 * @returns {Promise<boolean>} Success status
 */
export async function reserveSlotSpots(eventId, slotId, spots) {
    const slotRef = doc(db, 'events', eventId, 'slots', slotId);

    return await runTransaction(db, async (transaction) => {
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists()) {
            throw new Error('Slot not found');
        }

        const slotData = slotDoc.data();
        const availableSpots = slotData.maxSpots - slotData.bookedSpots;

        if (availableSpots < spots) {
            throw new Error('Not enough spots available');
        }

        transaction.update(slotRef, {
            bookedSpots: slotData.bookedSpots + spots,
            updatedAt: serverTimestamp()
        });

        return true;
    });
}

/**
 * Release reserved spots (for cancellations)
 * @param {string} eventId - Event ID
 * @param {string} slotId - Slot ID
 * @param {number} spots - Number of spots to release
 * @returns {Promise<void>}
 */
export async function releaseSlotSpots(eventId, slotId, spots) {
    const slotRef = doc(db, 'events', eventId, 'slots', slotId);

    await runTransaction(db, async (transaction) => {
        const slotDoc = await transaction.get(slotRef);

        if (slotDoc.exists()) {
            const slotData = slotDoc.data();
            transaction.update(slotRef, {
                bookedSpots: Math.max(0, slotData.bookedSpots - spots),
                updatedAt: serverTimestamp()
            });
        }
    });
}

export default {
    getEventSlots,
    getSlotById,
    reserveSlotSpots,
    releaseSlotSpots
};
