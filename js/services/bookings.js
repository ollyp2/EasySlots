/**
 * EasySlots - Bookings Service
 * Handles booking operations
 */

import { db, doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where, orderBy, limit, serverTimestamp } from '../config/firebase.js';
import { CONSTANTS } from '../config/constants.js';

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} Booking data
 */
export async function getBookingById(bookingId) {
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
    return bookingDoc.exists() ? { id: bookingDoc.id, ...bookingDoc.data() } : null;
}

/**
 * Get bookings for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Bookings array
 */
export async function getUserBookings(userId, filters = {}) {
    let q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(filters.limit || CONSTANTS.MAX_BOOKINGS_PER_PAGE)
    );

    if (filters.status) {
        q = query(q, where('status', '==', filters.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get bookings for a vendor
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Bookings array
 */
export async function getVendorBookings(vendorId, filters = {}) {
    let q = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        limit(filters.limit || CONSTANTS.MAX_BOOKINGS_PER_PAGE)
    );

    if (filters.status) {
        q = query(q, where('status', '==', filters.status));
    }

    if (filters.eventId) {
        q = query(q, where('eventId', '==', filters.eventId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<string>} Created booking ID
 */
export async function createBooking(bookingData) {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        status: CONSTANTS.BOOKING_STATUS.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return bookingRef.id;
}

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
export async function updateBookingStatus(bookingId, status) {
    await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedAt: serverTimestamp()
    });
}

/**
 * Get today's bookings count for vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<number>} Bookings count
 */
export async function getTodayBookingsCount(vendorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        where('createdAt', '>=', today)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
}

export default {
    getBookingById,
    getUserBookings,
    getVendorBookings,
    createBooking,
    updateBookingStatus,
    getTodayBookingsCount
};
