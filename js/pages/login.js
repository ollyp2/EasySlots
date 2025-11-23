/**
 * EasySlots - Login Page
 * Handles user login functionality
 */

import { loginWithEmail, loginWithGoogle, getUserProfile } from '../services/auth.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { redirectIfAuth } from '../utils/authGuard.js';
import { isSellerModeEnabled } from '../utils/sellerMode.js';

/**
 * Initialize login page
 */
function init() {
    // Redirect if already logged in
    redirectIfAuth();

    const loginForm = document.getElementById('login-form');
    const googleBtn = document.getElementById('google-signin');

    if (loginForm) {
        loginForm.addEventListener('submit', handleEmailLogin);
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
}

/**
 * Handle email/password login
 * @param {Event} e - Form submit event
 */
async function handleEmailLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showToast('Error', 'Please fill in all fields', 'error');
        return;
    }

    showLoader();

    try {
        const user = await loginWithEmail(email, password);
        showToast('Success', 'Welcome back!', 'success');
        await redirectToDashboard(user.uid);
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    } finally {
        hideLoader();
    }
}

/**
 * Handle Google sign in
 */
async function handleGoogleLogin() {
    showLoader();

    try {
        const user = await loginWithGoogle();
        showToast('Success', 'Welcome!', 'success');
        await redirectToDashboard(user.uid);
    } catch (error) {
        console.error('Google login error:', error);
        handleAuthError(error);
    } finally {
        hideLoader();
    }
}

/**
 * Redirect user to appropriate dashboard based on role
 * @param {string} userId - User ID
 */
async function redirectToDashboard(userId) {
    // Check for redirect URL in query params
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');

    if (redirectUrl) {
        window.location.href = decodeURIComponent(redirectUrl);
        return;
    }

    // Get user profile to determine role and check seller mode
    try {
        const profile = await getUserProfile(userId);
        const isVendor = profile && profile.role === 'vendor';
        const sellerModeOn = isVendor && isSellerModeEnabled();

        if (sellerModeOn) {
            window.location.href = '/pages/seller/dashboard.html';
        } else {
            window.location.href = '/pages/buyer/dashboard.html';
        }
    } catch {
        window.location.href = '/pages/buyer/dashboard.html';
    }
}

/**
 * Handle authentication errors
 * @param {Error} error - Firebase auth error
 */
function handleAuthError(error) {
    const errorMessages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/popup-closed-by-user': 'Sign in was cancelled',
        'auth/network-request-failed': 'Network error. Please check your connection'
    };

    const message = errorMessages[error.code] || 'Login failed. Please try again.';
    showToast('Error', message, 'error');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
