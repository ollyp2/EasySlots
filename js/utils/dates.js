/**
 * EasySeats - Date Utilities
 * Helper functions for date/time formatting and manipulation
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Format date for display
 * @param {Date|string|Object} date - Date to format (Date, string, or Firestore Timestamp)
 * @param {string} format - Format string (optional)
 * @returns {string} Formatted date
 */
export function formatDate(date, format = CONSTANTS.DATE_FORMAT) {
    const d = parseDate(date);
    if (!d) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return format
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year);
}

/**
 * Format time for display
 * @param {Date|string|Object} time - Time to format
 * @param {string} format - Format string (optional)
 * @returns {string} Formatted time
 */
export function formatTime(time, format = CONSTANTS.TIME_FORMAT) {
    const d = parseDate(time);
    if (!d) return '';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return format
        .replace('HH', hours)
        .replace('mm', minutes);
}

/**
 * Format date and time together
 * @param {Date|string|Object} dateTime - DateTime to format
 * @returns {string} Formatted date and time
 */
export function formatDateTime(dateTime) {
    return `${formatDate(dateTime)} ${formatTime(dateTime)}`;
}

/**
 * Parse various date formats to Date object
 * @param {Date|string|Object} input - Date input
 * @returns {Date|null} Date object or null
 */
export function parseDate(input) {
    if (!input) return null;

    // Already a Date
    if (input instanceof Date) return input;

    // Firestore Timestamp
    if (input.toDate && typeof input.toDate === 'function') {
        return input.toDate();
    }

    // String
    if (typeof input === 'string') {
        const parsed = new Date(input);
        return isNaN(parsed) ? null : parsed;
    }

    // Object with seconds (Firestore Timestamp-like)
    if (input.seconds) {
        return new Date(input.seconds * 1000);
    }

    return null;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string|Object} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
    const d = parseDate(date);
    if (!d) return '';

    const now = new Date();
    const diffMs = d - now;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (Math.abs(diffMins) < 1) return 'just now';
    if (Math.abs(diffMins) < 60) {
        return diffMins > 0 ? `in ${diffMins} min` : `${Math.abs(diffMins)} min ago`;
    }
    if (Math.abs(diffHours) < 24) {
        return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
    }
    if (Math.abs(diffDays) < 7) {
        return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    }

    return formatDate(d);
}

/**
 * Check if date is today
 * @param {Date|string|Object} date - Date to check
 * @returns {boolean} True if today
 */
export function isToday(date) {
    const d = parseDate(date);
    if (!d) return false;

    const today = new Date();
    return d.toDateString() === today.toDateString();
}

/**
 * Check if date is in the past
 * @param {Date|string|Object} date - Date to check
 * @returns {boolean} True if in past
 */
export function isPast(date) {
    const d = parseDate(date);
    return d ? d < new Date() : false;
}

/**
 * Check if date is in the future
 * @param {Date|string|Object} date - Date to check
 * @returns {boolean} True if in future
 */
export function isFuture(date) {
    const d = parseDate(date);
    return d ? d > new Date() : false;
}

/**
 * Add days to date
 * @param {Date} date - Base date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get start of day
 * @param {Date} date - Date
 * @returns {Date} Start of day
 */
export function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get end of day
 * @param {Date} date - Date
 * @returns {Date} End of day
 */
export function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

export default {
    formatDate,
    formatTime,
    formatDateTime,
    parseDate,
    getRelativeTime,
    isToday,
    isPast,
    isFuture,
    addDays,
    startOfDay,
    endOfDay
};
