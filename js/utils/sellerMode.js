/**
 * EasySeats - Seller Mode State Management
 * Handles switching between buyer and seller modes for vendors
 */

import { auth } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';

const SELLER_MODE_KEY = 'easyseats_seller_mode';
const BUYER_THEME_KEY = 'easyseats_buyer_theme';
const SELLER_THEME_KEY = 'easyseats_seller_theme';

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

    // Update body class for CSS theming
    updateBodyClass(enabled);

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('sellerModeChanged', {
        detail: { enabled }
    }));
}

/**
 * Update body class based on seller mode
 * @param {boolean} enabled - Whether seller mode is enabled
 */
function updateBodyClass(enabled) {
    if (enabled) {
        document.body.classList.add('seller-mode');
    } else {
        document.body.classList.remove('seller-mode');
    }

    // Apply custom themes
    applyCustomThemes();
}

/**
 * Apply custom color themes from localStorage
 */
function applyCustomThemes() {
    const buyerTheme = localStorage.getItem(BUYER_THEME_KEY);
    const sellerTheme = localStorage.getItem(SELLER_THEME_KEY);

    // Remove all theme attributes first
    document.body.removeAttribute('data-theme-buyer');
    document.body.removeAttribute('data-theme-seller');

    // Apply buyer theme if set and not in seller mode
    if (buyerTheme && !isSellerModeEnabled()) {
        document.body.setAttribute('data-theme-buyer', buyerTheme);
    }

    // Apply seller theme if set and in seller mode
    if (sellerTheme && isSellerModeEnabled()) {
        document.body.setAttribute('data-theme-seller', sellerTheme);
    }
}

/**
 * Set custom theme for buyer mode
 * @param {string|null} theme - Theme name (null to reset)
 */
export function setBuyerTheme(theme) {
    if (theme) {
        localStorage.setItem(BUYER_THEME_KEY, theme);
    } else {
        localStorage.removeItem(BUYER_THEME_KEY);
    }
    applyCustomThemes();
}

/**
 * Set custom theme for seller mode
 * @param {string|null} theme - Theme name (null to reset)
 */
export function setSellerTheme(theme) {
    if (theme) {
        localStorage.setItem(SELLER_THEME_KEY, theme);
    } else {
        localStorage.removeItem(SELLER_THEME_KEY);
    }
    applyCustomThemes();
}

/**
 * Get current theme settings
 * @returns {Object} Current buyer and seller themes
 */
export function getThemeSettings() {
    return {
        buyerTheme: localStorage.getItem(BUYER_THEME_KEY) || 'default',
        sellerTheme: localStorage.getItem(SELLER_THEME_KEY) || 'default'
    };
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

/**
 * Initialize seller mode on page load
 * Sets body class based on stored preference
 */
export function initSellerMode() {
    const enabled = isSellerModeEnabled();
    updateBodyClass(enabled);
}

// Auto-initialize on module load
if (typeof document !== 'undefined') {
    // Initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSellerMode);
    } else {
        initSellerMode();
    }
}

export default {
    isSellerModeEnabled,
    setSellerMode,
    toggleSellerMode,
    canUseSellerMode,
    getCurrentMode,
    ensureSellerMode,
    initSellerMode,
    setBuyerTheme,
    setSellerTheme,
    getThemeSettings
};
