/**
 * EasySlots - Stripe Utilities for Cloud Functions
 */

import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

// Define secret parameters
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// Export secrets for function binding
export { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET };

// Lazy initialization of Stripe
let stripeInstance = null;

/**
 * Get Stripe instance
 * @returns {Stripe} Stripe instance
 */
export function getStripe() {
    if (!stripeInstance) {
        stripeInstance = new Stripe(STRIPE_SECRET_KEY.value(), {
            apiVersion: '2023-10-16'
        });
    }
    return stripeInstance;
}

/**
 * Get webhook secret
 * @returns {string} Webhook secret
 */
export function getWebhookSecret() {
    return STRIPE_WEBHOOK_SECRET.value();
}

/**
 * Verify webhook signature
 * @param {Buffer} payload - Request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Stripe event
 */
export function verifyWebhookSignature(payload, signature) {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, getWebhookSecret());
}

/**
 * Calculate platform fee
 * @param {number} amount - Amount in cents
 * @param {number} feePercent - Fee percentage
 * @returns {number} Fee amount in cents
 */
export function calculatePlatformFee(amount, feePercent = 5) {
    return Math.round(amount * (feePercent / 100));
}

export default { getStripe, getWebhookSecret, verifyWebhookSignature, calculatePlatformFee };
