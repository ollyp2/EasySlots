/**
 * EasySlots - Tickets Service
 * Handles ticket operations
 */

import { db, doc, getDoc, getDocs, updateDoc, collection, query, where, orderBy, serverTimestamp } from '../config/firebase.js';
import { CONSTANTS } from '../config/constants.js';

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
    const q = query(collection(db, 'tickets'), where('code', '==', code));
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
        orderBy('eventDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const eventDate = ticket.eventDate.toDate();
    if (eventDate < new Date()) {
        return { valid: false, error: 'Ticket expired' };
    }

    // Mark as used
    await updateDoc(doc(db, 'tickets', ticketId), {
        status: CONSTANTS.TICKET_STATUS.USED,
        usedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return { valid: true, ticket: { id: ticketDoc.id, ...ticket } };
}

export default {
    getTicketById,
    getTicketByCode,
    getUserTickets,
    validateTicket
};
