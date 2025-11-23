/**
 * EasySeats - Events Service
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
    deleteDoc,
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
 * Create a new event
 * @param {string} vendorId - Vendor ID
 * @param {Object} eventData - Event data
 * @returns {Promise<string>} Created event ID
 */
export async function createEvent(vendorId, eventData) {
    const slug = generateSlug(eventData.title);

    const eventRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        vendorId,
        slug,
        status: eventData.status || 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return eventRef.id;
}

/**
 * Update an event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Event data to update
 * @returns {Promise<void>}
 */
export async function updateEvent(eventId, eventData) {
    const updateData = { ...eventData };

    // Update slug if title changed
    if (eventData.title) {
        updateData.slug = generateSlug(eventData.title);
    }

    await updateDoc(doc(db, 'events', eventId), {
        ...updateData,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete an event (soft delete)
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId) {
    await updateDoc(doc(db, 'events', eventId), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

/**
 * Hard delete an event (permanent)
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function permanentDeleteEvent(eventId) {
    await deleteDoc(doc(db, 'events', eventId));
}

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
 * Get events by vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} status - Optional status filter ('all', 'published', 'draft')
 * @returns {Promise<Array>} Events array
 */
export async function getEventsByVendor(vendorId, status = null) {
    let q = query(
        collection(db, 'events'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter out deleted events
    events = events.filter(event => event.status !== 'deleted');

    // Filter by status if provided
    if (status && status !== 'all') {
        events = events.filter(event => event.status === status);
    }

    return events;
}

/**
 * Get published events with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Events array
 */
export async function getPublishedEvents(filters = {}) {
    let q = query(
        collection(db, 'events'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(filters.limit || 20)
    );

    const snapshot = await getDocs(q);
    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Client-side filtering for additional criteria
    if (filters.category) {
        events = events.filter(e => e.category === filters.category);
    }

    if (filters.vendorId) {
        events = events.filter(e => e.vendorId === filters.vendorId);
    }

    if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
    }

    return events;
}

/**
 * Publish an event
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function publishEvent(eventId) {
    await updateDoc(doc(db, 'events', eventId), {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

/**
 * Unpublish an event (set to draft)
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function unpublishEvent(eventId) {
    await updateDoc(doc(db, 'events', eventId), {
        status: 'draft',
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
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(count)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get events by category
 * @param {string} category - Category name
 * @param {number} limitCount - Max events to return
 * @returns {Promise<Array>} Events array
 */
export async function getEventsByCategory(category, limitCount = 12) {
    const q = query(
        collection(db, 'events'),
        where('status', '==', 'published'),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Search events by title/description
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching events
 */
export async function searchEvents(searchTerm) {
    const q = query(
        collection(db, 'events'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(100)
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const lowerSearch = searchTerm.toLowerCase();
    return events.filter(event =>
        event.title?.toLowerCase().includes(lowerSearch) ||
        event.description?.toLowerCase().includes(lowerSearch) ||
        event.shortDescription?.toLowerCase().includes(lowerSearch)
    );
}

/**
 * Get vendor's event stats
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} Event stats
 */
export async function getVendorEventStats(vendorId) {
    const events = await getEventsByVendor(vendorId);

    return {
        total: events.length,
        published: events.filter(e => e.status === 'published').length,
        draft: events.filter(e => e.status === 'draft').length
    };
}

/**
 * Generate URL-safe slug from title
 * @param {string} title - Event title
 * @returns {string} URL slug
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Legacy function for backward compatibility
export async function getEvents(filters = {}) {
    return getPublishedEvents(filters);
}

export async function getVendorEvents(vendorId, status = null) {
    return getEventsByVendor(vendorId, status);
}

export default {
    createEvent,
    updateEvent,
    deleteEvent,
    permanentDeleteEvent,
    getEventById,
    getEventsByVendor,
    getPublishedEvents,
    publishEvent,
    unpublishEvent,
    getFeaturedEvents,
    getEventsByCategory,
    searchEvents,
    getVendorEventStats,
    getEvents,
    getVendorEvents
};
