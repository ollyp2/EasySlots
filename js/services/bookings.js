/**
 * EasySeats - Bookings Service
 * Handles booking operations with slot reservation
 */

import {
    db,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    runTransaction
} from '../config/firebase.js';
import { CONSTANTS } from '../config/constants.js';

const SERVICE_FEE_PERCENT = 0.05;
const MIN_SERVICE_FEE = 0.50;

/**
 * Create a new booking with slot reservation
 * @param {Object} bookingData - Booking data
 * @returns {Promise<string>} Created booking ID
 */
export async function createBooking(bookingData) {
    const {
        userId,
        eventId,
        slotId,
        quantity,
        customerInfo,
        notes,
        eventTitle,
        eventImage,
        vendorId,
        vendorName,
        date,
        startTime,
        endTime,
        unitPrice
    } = bookingData;

    // Calculate pricing
    const subtotal = unitPrice * quantity;
    const serviceFee = Math.max(subtotal * SERVICE_FEE_PERCENT, MIN_SERVICE_FEE);
    const totalPrice = subtotal + serviceFee;

    const slotRef = doc(db, 'events', eventId, 'slots', slotId);

    // Use transaction for atomic slot reservation
    const bookingId = await runTransaction(db, async (transaction) => {
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists()) {
            throw new Error('Slot not found');
        }

        const slotData = slotDoc.data();
        const capacity = slotData.capacity || slotData.maxSpots || 0;
        const booked = slotData.bookedCount || slotData.bookedSpots || 0;
        const available = capacity - booked;

        if (available < quantity) {
            throw new Error(`Only ${available} spots available`);
        }

        // Update slot
        const newBookedCount = booked + quantity;
        const newStatus = newBookedCount >= capacity ? 'full' : 'available';

        transaction.update(slotRef, {
            bookedCount: newBookedCount,
            bookedSpots: newBookedCount,
            availableSpots: capacity - newBookedCount,
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        // Create booking document
        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, {
            userId,
            eventId,
            slotId,
            vendorId,
            vendorName: vendorName || '',
            eventTitle: eventTitle || '',
            eventImage: eventImage || '',
            date,
            startTime,
            endTime,
            quantity,
            unitPrice,
            subtotal,
            serviceFee,
            totalPrice,
            currency: 'EUR',
            customerInfo,
            notes: notes || '',
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return bookingRef.id;
    });

    return bookingId;
}

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
 * @param {string} filter - Filter: 'all', 'upcoming', 'past', 'cancelled'
 * @returns {Promise<Array>} Bookings array
 */
export async function getUserBookings(userId, filter = 'all') {
    const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const today = new Date().toISOString().split('T')[0];

    if (filter === 'upcoming') {
        bookings = bookings.filter(b => b.date >= today && b.status !== 'cancelled');
    } else if (filter === 'past') {
        bookings = bookings.filter(b => b.date < today && b.status !== 'cancelled');
    } else if (filter === 'cancelled') {
        bookings = bookings.filter(b => b.status === 'cancelled');
    }

    return bookings;
}

/**
 * Get bookings for a vendor
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Bookings array
 */
export async function getVendorBookings(vendorId, filters = {}) {
    const q = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        limit(filters.limit || 50)
    );

    const snapshot = await getDocs(q);
    let bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (filters.status) {
        bookings = bookings.filter(b => b.status === filters.status);
    }

    if (filters.eventId) {
        bookings = bookings.filter(b => b.eventId === filters.eventId);
    }

    return bookings;
}

/**
 * Cancel a booking and release slot spots
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<void>}
 */
export async function cancelBooking(bookingId, reason = '') {
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));

    if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
    }

    const booking = bookingDoc.data();

    if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
    }

    const slotRef = doc(db, 'events', booking.eventId, 'slots', booking.slotId);
    const bookingRef = doc(db, 'bookings', bookingId);

    await runTransaction(db, async (transaction) => {
        const slotDoc = await transaction.get(slotRef);

        transaction.update(bookingRef, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            cancellationReason: reason,
            updatedAt: serverTimestamp()
        });

        if (slotDoc.exists()) {
            const slotData = slotDoc.data();
            const capacity = slotData.capacity || slotData.maxSpots || 0;
            const booked = slotData.bookedCount || slotData.bookedSpots || 0;
            const newBookedCount = Math.max(0, booked - booking.quantity);

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
 * Get user booking stats
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Stats object
 */
export async function getUserBookingStats(userId) {
    const bookings = await getUserBookings(userId, 'all');
    const today = new Date().toISOString().split('T')[0];

    return {
        total: bookings.length,
        upcoming: bookings.filter(b => b.date >= today && b.status !== 'cancelled').length,
        past: bookings.filter(b => b.date < today && b.status !== 'cancelled').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length
    };
}

/**
 * Get today's bookings count for vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<number>} Bookings count
 */
export async function getTodayBookingsCount(vendorId) {
    const today = new Date().toISOString().split('T')[0];
    const bookings = await getVendorBookings(vendorId);
    return bookings.filter(b => b.date === today).length;
}

/**
 * Calculate booking totals
 * @param {number} unitPrice - Price per unit
 * @param {number} quantity - Number of units
 * @returns {Object} Pricing breakdown
 */
export function calculateBookingTotals(unitPrice, quantity) {
    const subtotal = unitPrice * quantity;
    const serviceFee = Math.max(subtotal * SERVICE_FEE_PERCENT, MIN_SERVICE_FEE);
    const total = subtotal + serviceFee;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        serviceFee: Math.round(serviceFee * 100) / 100,
        total: Math.round(total * 100) / 100
    };
}

export default {
    createBooking,
    getBookingById,
    getUserBookings,
    getVendorBookings,
    cancelBooking,
    updateBookingStatus,
    getUserBookingStats,
    getTodayBookingsCount,
    calculateBookingTotals
};
