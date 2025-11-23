/**
 * EasySeats - Auth Guard Utility
 * Protects routes based on authentication state and seller mode
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';
import { isSellerModeEnabled, setSellerMode } from './sellerMode.js';

/**
 * Wait for auth state to be determined
 * @returns {Promise<Object|null>} Current user or null
 */
function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

/**
 * Require authentication - redirects to login if not authenticated
 * @param {string} returnUrl - URL to return to after login (optional)
 * @returns {Promise<Object>} User object if authenticated
 */
export async function requireAuth(returnUrl = null) {
    const user = await waitForAuth();

    if (!user) {
        const currentUrl = returnUrl || window.location.href;
        const encodedUrl = encodeURIComponent(currentUrl);
        window.location.href = `/pages/auth/login.html?redirect=${encodedUrl}`;
        return null;
    }

    return user;
}

/**
 * Require seller role - redirects if not a vendor
 * @returns {Promise<Object>} User profile if vendor
 */
export async function requireSeller() {
    const user = await requireAuth();

    if (!user) return null;

    const profile = await getUserProfile(user.uid);

    if (!profile || profile.role !== 'vendor') {
        window.location.href = '/pages/buyer/dashboard.html';
        return null;
    }

    return { user, profile };
}

/**
 * Require seller mode - checks if user is vendor AND has seller mode enabled
 * Auto-enables seller mode when accessing seller pages
 * @returns {Promise<boolean>} True if authorized for seller pages
 */
export async function requireSellerMode() {
    const user = await waitForAuth();

    if (!user) {
        const currentUrl = window.location.href;
        const encodedUrl = encodeURIComponent(currentUrl);
        window.location.href = `/pages/auth/login.html?redirect=${encodedUrl}`;
        return false;
    }

    const profile = await getUserProfile(user.uid);

    if (!profile || profile.role !== 'vendor') {
        // Not a vendor at all - redirect to buyer dashboard
        window.location.href = '/pages/buyer/dashboard.html';
        return false;
    }

    // User is a vendor - auto-enable seller mode if not already enabled
    if (!isSellerModeEnabled()) {
        setSellerMode(true);
    }

    return true;
}

/**
 * Require buyer role - redirects if not authenticated
 * @returns {Promise<Object>} User profile if buyer
 */
export async function requireBuyer() {
    const user = await requireAuth();

    if (!user) return null;

    const profile = await getUserProfile(user.uid);

    return { user, profile };
}

/**
 * Redirect if already authenticated
 * Used on login/register pages
 * @param {string} redirectTo - URL to redirect to (default: based on role and mode)
 */
export async function redirectIfAuth(redirectTo = null) {
    const user = await waitForAuth();

    if (user) {
        if (redirectTo) {
            window.location.href = redirectTo;
        } else {
            // Redirect based on role and seller mode
            const profile = await getUserProfile(user.uid);
            const isVendor = profile && profile.role === 'vendor';
            const sellerModeOn = isVendor && isSellerModeEnabled();

            if (sellerModeOn) {
                window.location.href = '/pages/seller/dashboard.html';
            } else {
                window.location.href = '/pages/buyer/dashboard.html';
            }
        }
    }
}

/**
 * Check if current user is a vendor
 * @returns {Promise<boolean>} True if vendor
 */
export async function isVendor() {
    const user = await waitForAuth();

    if (!user) return false;

    const profile = await getUserProfile(user.uid);
    return profile && profile.role === 'vendor';
}

/**
 * Check if current user is a seller (vendor with seller mode on)
 * @returns {Promise<boolean>} True if vendor with seller mode enabled
 */
export async function isSeller() {
    const isUserVendor = await isVendor();
    return isUserVendor && isSellerModeEnabled();
}

/**
 * Get current authenticated user synchronously (may be null if auth not ready)
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Get current user async (waits for auth to initialize)
 * @returns {Promise<Object|null>} Current user or null
 */
export async function getCurrentUserAsync() {
    return waitForAuth();
}

export default {
    requireAuth,
    requireSeller,
    requireSellerMode,
    requireBuyer,
    redirectIfAuth,
    isVendor,
    isSeller,
    getCurrentUser,
    getCurrentUserAsync
};
