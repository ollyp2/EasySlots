/**
 * EasySlots - Stripe Webhook Handler
 */

import { onRequest } from 'firebase-functions/v2/https';
import { verifyWebhookSignature, getStripe } from '../utils/stripe.js';
import { db, FieldValue, createDocument, updateDocument, getDocument } from '../utils/firestore.js';
import { generateTicket } from '../tickets/generate.js';
import { sendBookingConfirmation } from '../email/sendConfirmation.js';

export const handleStripeWebhook = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = verifyWebhookSignature(req.rawBody, signature);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).send('Webhook handler failed');
    }
});

/**
 * Handle successful checkout
 * @param {Object} session - Stripe checkout session
 */
async function handleCheckoutComplete(session) {
    const { eventId, slotId, userId, quantity } = session.metadata;
    const qty = parseInt(quantity, 10);

    // Create booking
    const bookingId = await createDocument('bookings', {
        userId,
        eventId,
        slotId,
        quantity: qty,
        status: 'confirmed',
        totalAmount: session.amount_total / 100,
        currency: session.currency,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        customerEmail: session.customer_email
    });

    // Update slot availability
    const slotRef = db.collection('events').doc(eventId).collection('slots').doc(slotId);
    await slotRef.update({
        bookedSpots: FieldValue.increment(qty)
    });

    // Get event and slot details for ticket generation
    const event = await getDocument('events', eventId);
    const slot = await getDocument(`events/${eventId}/slots`, slotId);

    // Generate tickets
    for (let i = 0; i < qty; i++) {
        await generateTicket({
            bookingId,
            userId,
            eventId,
            slotId,
            vendorId: event.vendorId,
            eventTitle: event.title,
            vendorName: event.vendorName || 'Vendor',
            eventDate: slot.date,
            eventTime: slot.startTime
        });
    }

    // Send confirmation email
    await sendBookingConfirmation({
        email: session.customer_email,
        bookingId,
        eventTitle: event.title,
        eventDate: slot.date,
        quantity: qty,
        totalAmount: session.amount_total / 100
    });

    console.log(`Booking ${bookingId} created successfully`);
}

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe payment intent
 */
async function handlePaymentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    // Could notify user, update booking status, etc.
}
