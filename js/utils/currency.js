/**
 * EasySlots - Currency Utilities
 * Helper functions for currency formatting
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Format amount as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: EUR)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = CONSTANTS.CURRENCY) {
    return new Intl.NumberFormat(CONSTANTS.LOCALE, {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Parse currency string to number
 * @param {string} value - Currency string
 * @returns {number} Parsed number
 */
export function parseCurrency(value) {
    if (typeof value === 'number') return value;

    const cleaned = value
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.');

    return parseFloat(cleaned) || 0;
}

/**
 * Format amount in cents to currency
 * @param {number} cents - Amount in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCentsAsCurrency(cents, currency = CONSTANTS.CURRENCY) {
    return formatCurrency(cents / 100, currency);
}

/**
 * Convert amount to cents
 * @param {number} amount - Amount in decimal
 * @returns {number} Amount in cents
 */
export function toCents(amount) {
    return Math.round(amount * 100);
}

/**
 * Convert cents to decimal amount
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in decimal
 */
export function fromCents(cents) {
    return cents / 100;
}

export default {
    formatCurrency,
    parseCurrency,
    formatCentsAsCurrency,
    toCents,
    fromCents
};
