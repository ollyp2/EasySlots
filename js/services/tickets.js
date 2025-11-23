/**
 * EasySeats - Tickets Service
 * Handles ticket operations
 */

import { db, doc, getDoc, getDocs, updateDoc, collection, query, where, orderBy, limit, serverTimestamp, app } from '../config/firebase.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';
import { CONSTANTS } from '../config/constants.js';

const functions = getFunctions(app);

/**
 * Get ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object|null>} Ticket data
 */
export async function getTicketById(ticketId) {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    return ticketDoc.exists() ? { id: ticketDoc.id, ...ticketDoc.data() } : null;
}

/**
 * Get ticket by code
 * @param {string} code - Ticket code
 * @returns {Promise<Object|null>} Ticket data
 */
export async function getTicketByCode(code) {
    const q = query(
        collection(db, 'tickets'),
        where('code', '==', code.toUpperCase()),
        limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get tickets for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Tickets array
 */
export async function getUserTickets(userId) {
    const q = query(
        collection(db, 'tickets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get tickets for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Array>} Tickets array
 */
export async function getTicketsByBooking(bookingId) {
    const q = query(
        collection(db, 'tickets'),
        where('bookingId', '==', bookingId),
        orderBy('ticketNumber', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get upcoming valid tickets for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Upcoming tickets array
 */
export async function getUpcomingTickets(userId) {
    const tickets = await getUserTickets(userId);
    const today = new Date().toISOString().split('T')[0];

    return tickets.filter(ticket =>
        ticket.status === 'valid' &&
        ticket.eventDate >= today
    );
}

/**
 * Group tickets by event
 * @param {Array} tickets - Array of tickets
 * @returns {Object} Tickets grouped by event
 */
export function groupTicketsByEvent(tickets) {
    return tickets.reduce((groups, ticket) => {
        const key = `${ticket.eventId}-${ticket.eventDate}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(ticket);
        return groups;
    }, {});
}

/**
 * Check if a ticket is valid (not expired, not used)
 * @param {Object} ticket - Ticket data
 * @returns {boolean} Whether ticket is valid
 */
export function isTicketValid(ticket) {
    if (ticket.status !== 'valid') return false;

    const eventDate = new Date(ticket.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ticket is valid until end of event day
    eventDate.setHours(23, 59, 59, 999);

    return today <= eventDate;
}

/**
 * Validate and mark ticket as used
 * @param {string} ticketId - Ticket ID
 * @param {string} vendorId - Vendor ID (for authorization)
 * @returns {Promise<Object>} Validation result
 */
export async function validateTicket(ticketId, vendorId) {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));

    if (!ticketDoc.exists()) {
        return { valid: false, error: 'Ticket not found' };
    }

    const ticket = ticketDoc.data();

    // Check vendor authorization
    if (ticket.vendorId !== vendorId) {
        return { valid: false, error: 'Unauthorized' };
    }

    // Check ticket status
    if (ticket.status === CONSTANTS.TICKET_STATUS.USED) {
        return { valid: false, error: 'Ticket already used', usedAt: ticket.usedAt };
    }

    if (ticket.status === CONSTANTS.TICKET_STATUS.CANCELLED) {
        return { valid: false, error: 'Ticket cancelled' };
    }

    // Check expiration
    const eventDate = typeof ticket.eventDate === 'string'
        ? new Date(ticket.eventDate)
        : ticket.eventDate?.toDate?.() || new Date(ticket.eventDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(23, 59, 59, 999);

    if (eventDate < today) {
        return { valid: false, error: 'Ticket expired' };
    }

    // Mark as used
    await updateDoc(doc(db, 'tickets', ticketId), {
        status: CONSTANTS.TICKET_STATUS.USED,
        checkedIn: true,
        usedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return { valid: true, ticket: { id: ticketDoc.id, ...ticket } };
}

/**
 * Validate ticket via Cloud Function
 * @param {string} code - Ticket code
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} Validation result
 */
export async function validateTicketViaCloud(code, vendorId) {
    const validateTicketFn = httpsCallable(functions, 'validateTicketCode');

    try {
        const result = await validateTicketFn({
            code: code.toUpperCase(),
            vendorId: vendorId
        });
        return result.data;
    } catch (error) {
        console.error('Ticket validation error:', error);
        throw error;
    }
}

export default {
    getTicketById,
    getTicketByCode,
    getUserTickets,
    getTicketsByBooking,
    getUpcomingTickets,
    groupTicketsByEvent,
    isTicketValid,
    validateTicket,
    validateTicketViaCloud
};
