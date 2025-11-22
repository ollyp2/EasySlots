/**
 * EasySlots - Auth Guard Utility
 * Protects routes based on authentication state
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';

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
 * Require seller role - redirects if not a seller
 * @returns {Promise<Object>} User profile if seller
 */
export async function requireSeller() {
    const user = await requireAuth();

    if (!user) return null;

    const profile = await getUserProfile(user.uid);

    if (!profile || profile.role !== 'seller') {
        window.location.href = '/pages/buyer/dashboard.html';
        return null;
    }

    return { user, profile };
}

/**
 * Require buyer role - redirects if not a buyer
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
 * @param {string} redirectTo - URL to redirect to (default: buyer dashboard)
 */
export async function redirectIfAuth(redirectTo = null) {
    const user = await waitForAuth();

    if (user) {
        if (redirectTo) {
            window.location.href = redirectTo;
        } else {
            // Redirect based on role
            const profile = await getUserProfile(user.uid);
            if (profile && profile.role === 'seller') {
                window.location.href = '/pages/seller/dashboard.html';
            } else {
                window.location.href = '/pages/buyer/dashboard.html';
            }
        }
    }
}

/**
 * Check if current user is a seller
 * @returns {Promise<boolean>} True if seller
 */
export async function isSeller() {
    const user = await waitForAuth();

    if (!user) return false;

    const profile = await getUserProfile(user.uid);
    return profile && profile.role === 'seller';
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
    requireBuyer,
    redirectIfAuth,
    isSeller,
    getCurrentUser,
    getCurrentUserAsync
};
