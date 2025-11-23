/**
 * EasySeats - Slots Service
 * Handles time slot operations
 */

import {
    db,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction
} from '../config/firebase.js';

/**
 * Create a new slot
 * @param {string} eventId - Event ID
 * @param {Object} slotData - Slot data
 * @returns {Promise<string>} Created slot ID
 */
export async function createSlot(eventId, slotData) {
    const slotRef = await addDoc(collection(db, 'events', eventId, 'slots'), {
        ...slotData,
        eventId,
        bookedCount: 0,
        availableSpots: slotData.capacity || slotData.maxSpots || 10,
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return slotRef.id;
}

/**
 * Update a slot
 * @param {string} eventId - Event ID
 * @param {string} slotId - Slot ID
 * @param {Object} slotData - Slot data to update
 * @returns {Promise<void>}
 */
export async function updateSlot(eventId, slotId, slotData) {
    await updateDoc(doc(db, 'events', eventId, 'slots', slotId), {
        ...slotData,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a slot
 * @param {string} eventId - Event ID
 * @param {string} slotId - Slot ID
 * @returns {Promise<void>}
 */
export async function deleteSlot(eventId, slotId) {
    await deleteDoc(doc(db, 'events', eventId, 'slots', slotId));
}

/**
 * Get all slots for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Slots array
 */
export async function getSlotsByEvent(eventId) {
    const q = query(
        collection(db, 'events', eventId, 'slots'),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get available slots for a specific date
 * @param {string} eventId - Event ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Available slots
 */
export async function getAvailableSlots(eventId, date) {
    const q = query(
        collection(db, 'events', eventId, 'slots'),
        where('date', '==', date),
        where('status', '==', 'available'),
        orderBy('startTime', 'asc')
    );

    const snapshot = await getDocs(q);
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter slots that still have available spots
    return slots.filter(slot => {
        const available = (slot.capacity || slot.maxSpots || 0) - (slot.bookedCount || slot.bookedSpots || 0);
        return available > 0;
    });
}

/**
 * Get slots for an event (legacy compatibility)
 * @param {string} eventId - Event ID
 * @param {Date} date - Optional date filter
 * @returns {Promise<Array>} Slots array
 */
export async function getEventSlots(eventId, date = null) {
    let q = query(
        collection(db, 'events', eventId, 'slots'),
        orderBy('startTime', 'asc')
    );

    const snapshot = await getDocs(q);
    let slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (date) {
        const dateStr = typeof date === 'string' ? date : formatDate(date);
        slots = slots.filter(slot => slot.date === dateStr);
    }

    return slots;
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
        const capacity = slotData.capacity || slotData.maxSpots || 0;
        const booked = slotData.bookedCount || slotData.bookedSpots || 0;
        const availableSpots = capacity - booked;

        if (availableSpots < spots) {
            throw new Error('Not enough spots available');
        }

        const newBookedCount = booked + spots;
        const newStatus = newBookedCount >= capacity ? 'full' : 'available';

        transaction.update(slotRef, {
            bookedCount: newBookedCount,
            bookedSpots: newBookedCount,
            availableSpots: capacity - newBookedCount,
            status: newStatus,
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
            const capacity = slotData.capacity || slotData.maxSpots || 0;
            const booked = slotData.bookedCount || slotData.bookedSpots || 0;
            const newBookedCount = Math.max(0, booked - spots);

            transaction.update(slotRef, {
                bookedCount: newBookedCount,
                bookedSpots: newBookedCount,
                availableSpots: capacity - newBookedCount,
                status: 'available',
                updatedAt: serverTimestamp()
            });
        }
    });
}

/**
 * Get slots with dates that have availability
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Array of dates with availability
 */
export async function getAvailableDates(eventId) {
    const slots = await getSlotsByEvent(eventId);

    const datesWithAvailability = new Set();

    slots.forEach(slot => {
        const available = (slot.capacity || slot.maxSpots || 0) - (slot.bookedCount || slot.bookedSpots || 0);
        if (available > 0 && slot.date) {
            datesWithAvailability.add(slot.date);
        }
    });

    return Array.from(datesWithAvailability).sort();
}

/**
 * Bulk create slots
 * @param {string} eventId - Event ID
 * @param {Array} slotsData - Array of slot data
 * @returns {Promise<Array>} Created slot IDs
 */
export async function createBulkSlots(eventId, slotsData) {
    const slotIds = [];

    for (const slotData of slotsData) {
        const slotId = await createSlot(eventId, slotData);
        slotIds.push(slotId);
    }

    return slotIds;
}

/**
 * Delete all slots for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function deleteAllSlots(eventId) {
    const slots = await getSlotsByEvent(eventId);

    for (const slot of slots) {
        await deleteSlot(eventId, slot.id);
    }
}

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

export default {
    createSlot,
    updateSlot,
    deleteSlot,
    getSlotsByEvent,
    getAvailableSlots,
    getEventSlots,
    getSlotById,
    reserveSlotSpots,
    releaseSlotSpots,
    getAvailableDates,
    createBulkSlots,
    deleteAllSlots
};
