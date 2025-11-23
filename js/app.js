/**
 * EasySlots - Main Application Entry Point
 * Initializes the application and handles global state
 */

import { auth, onAuthStateChanged, isFirebaseConfigured } from './config/firebase.js';
import { CONSTANTS } from './config/constants.js';
import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';
import { renderSidebar } from './components/sidebar.js';
import { showToast } from './components/toast.js';

// Global application state
export const AppState = {
    user: null,
    isLoading: true,
    isAuthenticated: false
};

/**
 * Initialize the application
 */
async function init() {
    console.log(`${CONSTANTS.APP_NAME} v${CONSTANTS.APP_VERSION} initializing...`);

    // Check Firebase configuration
    if (!isFirebaseConfigured()) {
        console.warn('Firebase is not configured. Please update js/config/firebase.js with your project config.');
        showToast('Configuration required', 'Please configure Firebase to use all features.', 'warning');
    }

    // Initialize UI components
    initHeader();
    initFooter();

    // Set up auth state listener
    onAuthStateChanged(auth, handleAuthStateChange);

    // Mark app as initialized
    document.body.classList.add('app-initialized');
    console.log(`${CONSTANTS.APP_NAME} initialized successfully.`);
}

/**
 * Handle authentication state changes
 * @param {Object|null} user - Firebase user object
 */
function handleAuthStateChange(user) {
    AppState.isLoading = false;

    if (user) {
        AppState.user = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
        };
        AppState.isAuthenticated = true;
        document.body.classList.add('user-authenticated');
        document.body.classList.remove('user-anonymous');

        // Render sidebar if on a dashboard page (for pages without their own JS files)
        const sidebarNav = document.querySelector('.dashboard-nav');
        if (sidebarNav) {
            renderSidebar();
        }

        // Dispatch custom event for other modules to listen to
        window.dispatchEvent(new CustomEvent('auth:login', { detail: AppState.user }));
    } else {
        AppState.user = null;
        AppState.isAuthenticated = false;
        document.body.classList.remove('user-authenticated');
        document.body.classList.add('user-anonymous');

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Update UI based on auth state
    updateAuthUI();
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
    // Show/hide elements based on auth state
    const authOnlyElements = document.querySelectorAll('[data-auth="required"]');
    const guestOnlyElements = document.querySelectorAll('[data-auth="guest"]');

    authOnlyElements.forEach(el => {
        el.style.display = AppState.isAuthenticated ? '' : 'none';
    });

    guestOnlyElements.forEach(el => {
        el.style.display = AppState.isAuthenticated ? 'none' : '';
    });

    // Update user name displays
    if (AppState.user) {
        const userNameElements = document.querySelectorAll('[data-user="name"]');
        userNameElements.forEach(el => {
            el.textContent = AppState.user.displayName || AppState.user.email;
        });
    }
}

/**
 * Get current user
 * @returns {Object|null} Current user object or null
 */
export function getCurrentUser() {
    return AppState.user;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
    return AppState.isAuthenticated;
}

/**
 * Require authentication - redirects to login if not authenticated
 * @param {string} returnUrl - URL to return to after login
 * @returns {boolean} True if authenticated
 */
export function requireAuth(returnUrl = window.location.href) {
    if (!AppState.isAuthenticated) {
        const encodedUrl = encodeURIComponent(returnUrl);
        window.location.href = `/pages/auth/login.html?redirect=${encodedUrl}`;
        return false;
    }
    return true;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for use in other modules
export { CONSTANTS };
