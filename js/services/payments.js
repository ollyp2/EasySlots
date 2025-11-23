/**
 * EasySeats - Payments Service
 * Handles Stripe payment operations
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Create a checkout session
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} Checkout session
 */
export async function createCheckoutSession(bookingData) {
    const response = await fetch(CONSTANTS.API.CREATE_CHECKOUT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
    }

    return response.json();
}

/**
 * Redirect to Stripe checkout
 * @param {string} sessionId - Stripe checkout session ID
 */
export function redirectToCheckout(sessionId) {
    // Note: Requires Stripe.js to be loaded
    if (typeof Stripe === 'undefined') {
        throw new Error('Stripe.js not loaded');
    }

    const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
    return stripe.redirectToCheckout({ sessionId });
}

/**
 * Calculate total price including fees
 * @param {number} unitPrice - Price per unit
 * @param {number} quantity - Number of units
 * @returns {Object} Price breakdown
 */
export function calculateTotal(unitPrice, quantity) {
    const subtotal = unitPrice * quantity;
    const platformFee = subtotal * (CONSTANTS.PLATFORM_FEE_PERCENT / 100);
    const total = subtotal + platformFee;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        total: Math.round(total * 100) / 100
    };
}

/**
 * Format price for display
 * @param {number} amount - Amount in currency
 * @returns {string} Formatted price
 */
export function formatPrice(amount) {
    return new Intl.NumberFormat(CONSTANTS.LOCALE, {
        style: 'currency',
        currency: CONSTANTS.CURRENCY
    }).format(amount);
}

export default {
    createCheckoutSession,
    redirectToCheckout,
    calculateTotal,
    formatPrice
};
