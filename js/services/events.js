/**
 * EasySlots - Events Service
 * Handles event CRUD operations
 */

import {
    db,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp
} from '../config/firebase.js';
import { CONSTANTS } from '../config/constants.js';

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Event data
 */
export async function getEventById(eventId) {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    return eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } : null;
}

/**
 * Get active events with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Events array
 */
export async function getEvents(filters = {}) {
    let q = query(
        collection(db, 'events'),
        where('status', '==', CONSTANTS.EVENT_STATUS.ACTIVE)
    );

    if (filters.category) {
        q = query(q, where('category', '==', filters.category));
    }

    if (filters.vendorId) {
        q = query(q, where('vendorId', '==', filters.vendorId));
    }

    q = query(q, orderBy('startDate', 'asc'), limit(filters.limit || CONSTANTS.MAX_EVENTS_PER_PAGE));

    if (filters.startAfter) {
        q = query(q, startAfter(filters.startAfter));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get events by vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Events array
 */
export async function getVendorEvents(vendorId, status = null) {
    let q = query(
        collection(db, 'events'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
    );

    if (status) {
        q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @returns {Promise<string>} Created event ID
 */
export async function createEvent(eventData) {
    const eventRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        status: eventData.status || CONSTANTS.EVENT_STATUS.DRAFT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return eventRef.id;
}

/**
 * Update an event
 * @param {string} eventId - Event ID
 * @param {Object} data - Event data to update
 * @returns {Promise<void>}
 */
export async function updateEvent(eventId, data) {
    await updateDoc(doc(db, 'events', eventId), {
        ...data,
        updatedAt: serverTimestamp()
    });
}

/**
 * Get featured events for homepage
 * @param {number} count - Number of events to fetch
 * @returns {Promise<Array>} Featured events
 */
export async function getFeaturedEvents(count = 6) {
    const q = query(
        collection(db, 'events'),
        where('status', '==', CONSTANTS.EVENT_STATUS.ACTIVE),
        where('featured', '==', true),
        orderBy('startDate', 'asc'),
        limit(count)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default {
    getEventById,
    getEvents,
    getVendorEvents,
    createEvent,
    updateEvent,
    getFeaturedEvents
};
