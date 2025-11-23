/**
 * EasySeats - Ticket Validation
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue, getDocument, updateDocument } from '../utils/firestore.js';

/**
 * Validate a ticket code
 */
export const validateTicketCode = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { code, vendorId } = request.data;

    if (!code || !vendorId) {
        throw new HttpsError('invalid-argument', 'Code and vendorId are required');
    }

    try {
        // Verify caller is the vendor
        const user = await getDocument('users', request.auth.uid);
        if (user?.vendorId !== vendorId) {
            throw new HttpsError('permission-denied', 'Not authorized to validate tickets for this vendor');
        }

        // Find ticket by code
        const ticketsRef = db.collection('tickets');
        const snapshot = await ticketsRef.where('code', '==', code).limit(1).get();

        if (snapshot.empty) {
            return {
                valid: false,
                error: 'Ticket not found',
                code: 'NOT_FOUND'
            };
        }

        const ticketDoc = snapshot.docs[0];
        const ticket = ticketDoc.data();

        // Verify ticket belongs to this vendor
        if (ticket.vendorId !== vendorId) {
            return {
                valid: false,
                error: 'Ticket is for a different vendor',
                code: 'WRONG_VENDOR'
            };
        }

        // Check if already used
        if (ticket.status === 'used') {
            return {
                valid: false,
                error: 'Ticket already used',
                code: 'ALREADY_USED',
                usedAt: ticket.usedAt?.toDate?.() || ticket.usedAt
            };
        }

        // Check if cancelled
        if (ticket.status === 'cancelled') {
            return {
                valid: false,
                error: 'Ticket has been cancelled',
                code: 'CANCELLED'
            };
        }

        // Check expiration (event date)
        const eventDate = ticket.eventDate?.toDate?.() || new Date(ticket.eventDate);
        const now = new Date();
        const eventEnd = new Date(eventDate);
        eventEnd.setHours(23, 59, 59, 999);

        if (now > eventEnd) {
            return {
                valid: false,
                error: 'Ticket has expired',
                code: 'EXPIRED'
            };
        }

        // Mark ticket as used
        await updateDocument('tickets', ticketDoc.id, {
            status: 'used',
            checkedIn: true,
            checkedInAt: FieldValue.serverTimestamp(),
            usedAt: FieldValue.serverTimestamp()
        });

        return {
            valid: true,
            ticket: {
                id: ticketDoc.id,
                code: ticket.code,
                eventTitle: ticket.eventTitle,
                eventDate: eventDate.toISOString(),
                eventTime: ticket.eventTime,
                seatId: ticket.seatId,
                holderName: ticket.holderName || ticket.customerName || null
            }
        };
    } catch (error) {
        console.error('Error validating ticket:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Failed to validate ticket');
    }
});

export default { validateTicketCode };
