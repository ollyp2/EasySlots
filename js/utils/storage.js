/**
 * EasySeats - Storage Utilities
 * Local storage helpers
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export function getItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading from localStorage: ${key}`, error);
        return defaultValue;
    }
}

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error writing to localStorage: ${key}`, error);
    }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export function removeItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`Error removing from localStorage: ${key}`, error);
    }
}

/**
 * Clear all app data from localStorage
 */
export function clearAll() {
    Object.values(CONSTANTS.STORAGE_KEYS).forEach(key => {
        removeItem(key);
    });
}

// Session storage helpers

/**
 * Get item from sessionStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export function getSessionItem(key, defaultValue = null) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading from sessionStorage: ${key}`, error);
        return defaultValue;
    }
}

/**
 * Set item in sessionStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function setSessionItem(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error writing to sessionStorage: ${key}`, error);
    }
}

/**
 * Remove item from sessionStorage
 * @param {string} key - Storage key
 */
export function removeSessionItem(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.warn(`Error removing from sessionStorage: ${key}`, error);
    }
}

export default {
    getItem,
    setItem,
    removeItem,
    clearAll,
    getSessionItem,
    setSessionItem,
    removeSessionItem
};
