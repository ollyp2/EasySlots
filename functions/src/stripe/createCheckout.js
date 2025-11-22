/**
 * EasySlots - Create Stripe Checkout Session
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getStripe, calculatePlatformFee } from '../utils/stripe.js';
import { getDocument } from '../utils/firestore.js';

export const createCheckoutSession = onCall(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { eventId, slotId, quantity, successUrl, cancelUrl } = request.data;

    // Validate input
    if (!eventId || !slotId || !quantity) {
        throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    try {
        // Get event and slot data
        const event = await getDocument('events', eventId);
        if (!event) {
            throw new HttpsError('not-found', 'Event not found');
        }

        const slot = await getDocument(`events/${eventId}/slots`, slotId);
        if (!slot) {
            throw new HttpsError('not-found', 'Slot not found');
        }

        // Check availability
        const available = slot.maxSpots - slot.bookedSpots;
        if (available < quantity) {
            throw new HttpsError('failed-precondition', 'Not enough spots available');
        }

        // Get vendor for Stripe Connect
        const vendor = await getDocument('vendors', event.vendorId);
        if (!vendor?.stripeAccountId) {
            throw new HttpsError('failed-precondition', 'Vendor not set up for payments');
        }

        // Calculate amounts
        const unitAmount = Math.round(event.price * 100); // Convert to cents
        const totalAmount = unitAmount * quantity;
        const platformFee = calculatePlatformFee(totalAmount);

        const stripe = getStripe();

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: event.title,
                        description: `${quantity} spot(s) on ${new Date(slot.date).toLocaleDateString()}`,
                        images: event.imageUrl ? [event.imageUrl] : []
                    },
                    unit_amount: unitAmount
                },
                quantity: quantity
            }],
            payment_intent_data: {
                application_fee_amount: platformFee,
                transfer_data: {
                    destination: vendor.stripeAccountId
                },
                metadata: {
                    eventId,
                    slotId,
                    userId: request.auth.uid,
                    quantity: quantity.toString()
                }
            },
            customer_email: request.auth.token.email,
            success_url: successUrl || `${request.rawRequest.headers.origin}/pages/booking/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${request.rawRequest.headers.origin}/pages/booking/cancel.html`,
            metadata: {
                eventId,
                slotId,
                userId: request.auth.uid,
                quantity: quantity.toString()
            }
        });

        return { sessionId: session.id, url: session.url };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Failed to create checkout session');
    }
});
