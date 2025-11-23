/**
 * EasySeats - Stripe Service
 * Frontend integration for Stripe payments
 */

import { functions, httpsCallable } from '../config/firebase.js';

// Stripe publishable key (TEST MODE)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SWNXa2OHHgI3Voh133uF22OAUOC7ELpKmOvyL0XplmNRRudGnSslP14rcCe5O4a3xcB5W1zW7SMoSDoNBr3wLFI0061khJI53';

// Stripe.js instance
let stripeInstance = null;

/**
 * Load Stripe.js dynamically
 * @returns {Promise<Stripe>} Stripe instance
 */
async function loadStripe() {
    if (stripeInstance) {
        return stripeInstance;
    }

    // Check if Stripe is already loaded
    if (window.Stripe) {
        stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        return stripeInstance;
    }

    // Load Stripe.js dynamically
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;

        script.onload = () => {
            stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);
            resolve(stripeInstance);
        };

        script.onerror = () => {
            reject(new Error('Failed to load Stripe.js'));
        };

        document.head.appendChild(script);
    });
}

/**
 * Create a checkout session and redirect to Stripe
 * @param {Object} params - Checkout parameters
 * @param {string} params.eventId - Event ID
 * @param {string} params.slotId - Slot ID
 * @param {number} params.quantity - Number of spots
 * @param {string} [params.successUrl] - Success redirect URL
 * @param {string} [params.cancelUrl] - Cancel redirect URL
 * @returns {Promise<void>}
 */
export async function createCheckoutSession({ eventId, slotId, quantity, successUrl, cancelUrl }) {
    const stripe = await loadStripe();

    // Call Cloud Function to create checkout session
    const createSession = httpsCallable(functions, 'createCheckoutSession');

    const result = await createSession({
        eventId,
        slotId,
        quantity,
        successUrl: successUrl || `${window.location.origin}/pages/booking/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: cancelUrl || `${window.location.origin}/pages/booking/cancel.html`
    });

    const { sessionId, url } = result.data;

    // Redirect to Stripe Checkout
    if (url) {
        window.location.href = url;
    } else {
        // Fallback to redirectToCheckout
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
            throw new Error(error.message);
        }
    }
}

/**
 * Retrieve checkout session details
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object>} Session details
 */
export async function getCheckoutSession(sessionId) {
    const getSession = httpsCallable(functions, 'getCheckoutSession');
    const result = await getSession({ sessionId });
    return result.data;
}

/**
 * Create a Payment Intent for custom payment flow
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Payment intent client secret
 */
export async function createPaymentIntent(params) {
    const createIntent = httpsCallable(functions, 'createPaymentIntent');
    const result = await createIntent(params);
    return result.data;
}

/**
 * Get Stripe instance for Elements
 * @returns {Promise<Stripe>} Stripe instance
 */
export async function getStripe() {
    return loadStripe();
}

export default {
    createCheckoutSession,
    getCheckoutSession,
    createPaymentIntent,
    getStripe
};
