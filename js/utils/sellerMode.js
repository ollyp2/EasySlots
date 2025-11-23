/**
 * EasySeats - Seller Mode & Theme Management
 * Handles switching between buyer and seller modes, colors, and dark mode
 */

import { auth } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';

const SELLER_MODE_KEY = 'easyseats_seller_mode';
const DARK_MODE_KEY = 'easyseats_dark_mode';
const CUSTOM_COLOR_KEY = 'easyseats_custom_color';

/**
 * Check if seller mode is enabled
 * @returns {boolean} True if seller mode is on
 */
export function isSellerModeEnabled() {
    return localStorage.getItem(SELLER_MODE_KEY) === 'true';
}

/**
 * Set seller mode state
 * @param {boolean} enabled - Whether to enable seller mode
 */
export function setSellerMode(enabled) {
    localStorage.setItem(SELLER_MODE_KEY, enabled ? 'true' : 'false');

    // Apply body class for CSS styling
    if (enabled) {
        document.body.classList.add('seller-mode');
        document.body.classList.remove('buyer-mode');
    } else {
        document.body.classList.remove('seller-mode');
        document.body.classList.add('buyer-mode');
    }

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('sellerModeChanged', {
        detail: { enabled }
    }));
}

/**
 * Toggle seller mode
 * @returns {boolean} New seller mode state
 */
export function toggleSellerMode() {
    const current = isSellerModeEnabled();
    setSellerMode(!current);
    return !current;
}

/**
 * Check if current user can use seller mode (must be vendor)
 * @returns {Promise<boolean>} True if user is a vendor
 */
export async function canUseSellerMode() {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const profile = await getUserProfile(user.uid);
        return profile?.role === 'vendor';
    } catch (error) {
        console.error('Error checking seller mode eligibility:', error);
        return false;
    }
}

/**
 * Get current user's effective mode
 * @returns {Promise<string>} 'seller' or 'buyer'
 */
export async function getCurrentMode() {
    const canSell = await canUseSellerMode();
    if (canSell && isSellerModeEnabled()) {
        return 'seller';
    }
    return 'buyer';
}

/**
 * Ensure seller mode is enabled (for seller pages)
 * Automatically enables seller mode if user is vendor
 * @returns {Promise<boolean>} True if seller mode is now active
 */
export async function ensureSellerMode() {
    const canSell = await canUseSellerMode();
    if (!canSell) return false;

    if (!isSellerModeEnabled()) {
        setSellerMode(true);
    }
    return true;
}

// ============================================
// Dark Mode
// ============================================

/**
 * Check if dark mode is enabled
 * @returns {boolean} True if dark mode is on
 */
export function isDarkModeEnabled() {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
        return stored === 'true';
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Set dark mode state
 * @param {boolean} enabled - Whether to enable dark mode
 */
export function setDarkMode(enabled) {
    localStorage.setItem(DARK_MODE_KEY, enabled ? 'true' : 'false');

    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    window.dispatchEvent(new CustomEvent('darkModeChanged', {
        detail: { enabled }
    }));
}

/**
 * Toggle dark mode
 * @returns {boolean} New dark mode state
 */
export function toggleDarkMode() {
    const current = isDarkModeEnabled();
    setDarkMode(!current);
    return !current;
}

// ============================================
// Custom Color
// ============================================

/**
 * Get custom primary color
 * @returns {string|null} Custom color hex or null
 */
export function getCustomColor() {
    return localStorage.getItem(CUSTOM_COLOR_KEY);
}

/**
 * Set custom primary color
 * @param {string|null} color - Hex color string or null to reset
 */
export function setCustomColor(color) {
    if (color) {
        localStorage.setItem(CUSTOM_COLOR_KEY, color);
        document.documentElement.style.setProperty('--color-primary', color);
        // Calculate darker shade for hover
        document.documentElement.style.setProperty('--color-primary-dark', darkenColor(color, 15));
        document.documentElement.style.setProperty('--color-primary-light', lightenColor(color, 40));
    } else {
        localStorage.removeItem(CUSTOM_COLOR_KEY);
        document.documentElement.style.removeProperty('--color-primary');
        document.documentElement.style.removeProperty('--color-primary-dark');
        document.documentElement.style.removeProperty('--color-primary-light');
    }

    window.dispatchEvent(new CustomEvent('themeColorChanged', {
        detail: { color }
    }));
}

/**
 * Darken a hex color
 * @param {string} hex - Hex color
 * @param {number} percent - Percent to darken
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Lighten a hex color
 * @param {string} hex - Hex color
 * @param {number} percent - Percent to lighten
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min((num >> 16) + amt, 255);
    const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
    const B = Math.min((num & 0x0000FF) + amt, 255);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize theme settings on app load
 * Call this from app.js on startup
 */
export function initTheme() {
    // Apply seller mode class if enabled
    if (isSellerModeEnabled()) {
        document.body.classList.add('seller-mode');
    } else {
        document.body.classList.add('buyer-mode');
    }

    // Apply dark mode if enabled
    if (isDarkModeEnabled()) {
        document.body.classList.add('dark-mode');
    }

    // Apply custom color if set
    const customColor = getCustomColor();
    if (customColor) {
        setCustomColor(customColor);
    }

    // Listen for system dark mode changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-change if user hasn't set a preference
            if (localStorage.getItem(DARK_MODE_KEY) === null) {
                setDarkMode(e.matches);
            }
        });
    }
}

// Auto-detect seller pages and enable seller mode
export function checkSellerPage() {
    const path = window.location.pathname;
    if (path.includes('/seller/') || path.includes('/pages/seller/')) {
        document.body.classList.add('seller-mode');
        document.body.classList.remove('buyer-mode');
    }
}

export default {
    isSellerModeEnabled,
    setSellerMode,
    toggleSellerMode,
    canUseSellerMode,
    getCurrentMode,
    ensureSellerMode,
    isDarkModeEnabled,
    setDarkMode,
    toggleDarkMode,
    getCustomColor,
    setCustomColor,
    initTheme,
    checkSellerPage
};
