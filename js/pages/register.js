/**
 * EasySlots - Register Page
 * Handles user registration functionality
 */

import { registerWithEmail, loginWithGoogle, getUserProfile } from '../services/auth.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { redirectIfAuth } from '../utils/authGuard.js';

/**
 * Initialize register page
 */
function init() {
    // Redirect if already logged in
    redirectIfAuth();

    const registerForm = document.getElementById('register-form');
    const googleBtn = document.getElementById('google-signin');

    if (registerForm) {
        registerForm.addEventListener('submit', handleEmailRegister);
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleSignUp);
    }

    // Pre-select vendor checkbox if role=vendor in URL
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedRole = urlParams.get('role');
    if (preselectedRole === 'vendor') {
        const vendorCheckbox = document.getElementById('is-vendor');
        if (vendorCheckbox) {
            vendorCheckbox.checked = true;
        }
    }
}

/**
 * Handle email/password registration
 * @param {Event} e - Form submit event
 */
async function handleEmailRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const isVendor = document.getElementById('is-vendor')?.checked || false;
    const termsAccepted = document.getElementById('terms')?.checked || false;

    // Validation
    if (!firstName || !lastName || !email || !password) {
        showToast('Error', 'Please fill in all required fields', 'error');
        return;
    }

    if (password.length < 8) {
        showToast('Error', 'Password must be at least 8 characters', 'error');
        return;
    }

    if (!termsAccepted) {
        showToast('Error', 'Please accept the terms of service', 'error');
        return;
    }

    showLoader();

    try {
        const user = await registerWithEmail({
            email,
            password,
            firstName,
            lastName,
            isVendor
        });

        showToast('Success', 'Account created successfully!', 'success');

        // Redirect based on role
        if (isVendor) {
            window.location.href = '/pages/seller/dashboard.html';
        } else {
            window.location.href = '/pages/buyer/dashboard.html';
        }
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError(error);
    } finally {
        hideLoader();
    }
}

/**
 * Handle Google sign up
 */
async function handleGoogleSignUp() {
    showLoader();

    try {
        const user = await loginWithGoogle();
        showToast('Success', 'Welcome to EasySlots!', 'success');

        // Google users start as buyers, redirect to buyer dashboard
        const profile = await getUserProfile(user.uid);
        if (profile && profile.role === 'vendor') {
            window.location.href = '/pages/seller/dashboard.html';
        } else {
            window.location.href = '/pages/buyer/dashboard.html';
        }
    } catch (error) {
        console.error('Google signup error:', error);
        handleAuthError(error);
    } finally {
        hideLoader();
    }
}

/**
 * Handle authentication errors
 * @param {Error} error - Firebase auth error
 */
function handleAuthError(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Email/password sign up is not enabled',
        'auth/weak-password': 'Password is too weak. Please use a stronger password',
        'auth/popup-closed-by-user': 'Sign up was cancelled',
        'auth/network-request-failed': 'Network error. Please check your connection'
    };

    const message = errorMessages[error.code] || 'Registration failed. Please try again.';
    showToast('Error', message, 'error');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
