/**
 * EasySlots - Seller Mode State Management
 * Handles switching between buyer and seller modes for vendors
 */

import { auth } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';

const SELLER_MODE_KEY = 'easyseats_seller_mode';

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

export default {
    isSellerModeEnabled,
    setSellerMode,
    toggleSellerMode,
    canUseSellerMode,
    getCurrentMode,
    ensureSellerMode
};
