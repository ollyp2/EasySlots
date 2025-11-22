/**
 * EasySlots - Get Stripe Checkout Session
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getStripe } from '../utils/stripe.js';
import { getDocument } from '../utils/firestore.js';

export const getCheckoutSession = onCall(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { sessionId } = request.data;

    if (!sessionId) {
        throw new HttpsError('invalid-argument', 'Session ID is required');
    }

    try {
        const stripe = getStripe();

        // Retrieve the session
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'line_items']
        });

        // Verify the session belongs to this user
        const sessionUserId = session.metadata?.userId;
        if (sessionUserId && sessionUserId !== request.auth.uid) {
            throw new HttpsError('permission-denied', 'Session does not belong to this user');
        }

        // Get booking if it exists (created by webhook)
        let booking = null;
        if (session.metadata?.eventId) {
            const { db } = await import('../utils/firestore.js');
            const bookingsSnapshot = await db.collection('bookings')
                .where('stripeSessionId', '==', sessionId)
                .limit(1)
                .get();

            if (!bookingsSnapshot.empty) {
                const doc = bookingsSnapshot.docs[0];
                booking = { id: doc.id, ...doc.data() };
            }
        }

        return {
            sessionId: session.id,
            status: session.status,
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_email,
            metadata: session.metadata,
            booking
        };
    } catch (error) {
        console.error('Error retrieving session:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Failed to retrieve session');
    }
});
