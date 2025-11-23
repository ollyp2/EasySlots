/**
 * EasySeats - Theme & Mode Management
 * Handles buyer/seller modes, dark mode, and separate theme colors for each mode
 */

import { auth } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';

// Storage keys
const SELLER_MODE_KEY = 'easyseats_seller_mode';
const DARK_MODE_KEY = 'easyseats_dark_mode';
const BUYER_COLOR_KEY = 'easyseats_buyer_color';
const SELLER_COLOR_KEY = 'easyseats_seller_color';

// Default colors
const DEFAULT_BUYER_COLOR = '#4A90A4';
const DEFAULT_SELLER_COLOR = '#28A745';

// ============================================
// Seller Mode
// ============================================

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

    if (enabled) {
        document.body.classList.add('seller-mode');
        document.body.classList.remove('buyer-mode');
    } else {
        document.body.classList.remove('seller-mode');
        document.body.classList.add('buyer-mode');
    }

    // Apply the correct color for the current mode
    applyCurrentModeColor();

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
// Theme Colors (Separate for Buyer/Seller)
// ============================================

/**
 * Get buyer mode color
 * @returns {string} Hex color
 */
export function getBuyerColor() {
    return localStorage.getItem(BUYER_COLOR_KEY) || DEFAULT_BUYER_COLOR;
}

/**
 * Set buyer mode color
 * @param {string} color - Hex color string
 */
export function setBuyerColor(color) {
    if (color) {
        localStorage.setItem(BUYER_COLOR_KEY, color);
    } else {
        localStorage.removeItem(BUYER_COLOR_KEY);
    }

    // Apply if currently in buyer mode
    if (!isSellerModeEnabled()) {
        applyColor(color || DEFAULT_BUYER_COLOR);
    }

    window.dispatchEvent(new CustomEvent('buyerColorChanged', { detail: { color } }));
}

/**
 * Get seller mode color
 * @returns {string} Hex color
 */
export function getSellerColor() {
    return localStorage.getItem(SELLER_COLOR_KEY) || DEFAULT_SELLER_COLOR;
}

/**
 * Set seller mode color
 * @param {string} color - Hex color string
 */
export function setSellerColor(color) {
    if (color) {
        localStorage.setItem(SELLER_COLOR_KEY, color);
    } else {
        localStorage.removeItem(SELLER_COLOR_KEY);
    }

    // Apply if currently in seller mode
    if (isSellerModeEnabled()) {
        applyColor(color || DEFAULT_SELLER_COLOR);
    }

    window.dispatchEvent(new CustomEvent('sellerColorChanged', { detail: { color } }));
}

/**
 * Apply color to CSS custom properties
 * @param {string} color - Hex color
 */
function applyColor(color) {
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-primary-dark', darkenColor(color, 15));
    document.documentElement.style.setProperty('--color-primary-light', lightenColor(color, 40));
    document.documentElement.style.setProperty('--color-primary-bg', lightenColor(color, 50));
}

/**
 * Apply the correct color based on current mode
 */
function applyCurrentModeColor() {
    const color = isSellerModeEnabled() ? getSellerColor() : getBuyerColor();
    applyColor(color);
}

/**
 * Get all theme settings
 * @returns {Object} Theme settings object
 */
export function getThemeSettings() {
    return {
        sellerMode: isSellerModeEnabled(),
        darkMode: isDarkModeEnabled(),
        buyerColor: getBuyerColor(),
        sellerColor: getSellerColor(),
        defaultBuyerColor: DEFAULT_BUYER_COLOR,
        defaultSellerColor: DEFAULT_SELLER_COLOR
    };
}

/**
 * Set seller theme (alias for setSellerColor for backwards compatibility)
 * @param {string} color - Hex color
 */
export function setSellerTheme(color) {
    setSellerColor(color);
}

// Legacy support - single custom color (maps to current mode)
export function getCustomColor() {
    return isSellerModeEnabled() ? getSellerColor() : getBuyerColor();
}

export function setCustomColor(color) {
    if (isSellerModeEnabled()) {
        setSellerColor(color);
    } else {
        setBuyerColor(color);
    }
}

// ============================================
// Color Utilities
// ============================================

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
 */
export function initTheme() {
    // Apply seller/buyer mode class
    if (isSellerModeEnabled()) {
        document.body.classList.add('seller-mode');
    } else {
        document.body.classList.add('buyer-mode');
    }

    // Apply dark mode if enabled
    if (isDarkModeEnabled()) {
        document.body.classList.add('dark-mode');
    }

    // Apply the correct color for current mode
    applyCurrentModeColor();

    // Listen for system dark mode changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem(DARK_MODE_KEY) === null) {
                setDarkMode(e.matches);
            }
        });
    }
}

/**
 * Auto-detect seller pages and enable seller mode styling
 */
export function checkSellerPage() {
    const path = window.location.pathname;
    if (path.includes('/seller/') || path.includes('/pages/seller/')) {
        document.body.classList.add('seller-mode');
        document.body.classList.remove('buyer-mode');
        applyColor(getSellerColor());
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
    getBuyerColor,
    setBuyerColor,
    getSellerColor,
    setSellerColor,
    getThemeSettings,
    setSellerTheme,
    getCustomColor,
    setCustomColor,
    initTheme,
    checkSellerPage
};
