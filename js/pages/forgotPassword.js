/**
 * EasySeats - Forgot Password Page
 * Handles password reset functionality
 */

import { resetPassword } from '../services/auth.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { redirectIfAuth } from '../utils/authGuard.js';

/**
 * Initialize forgot password page
 */
function init() {
    // Redirect if already logged in
    redirectIfAuth();

    const form = document.getElementById('forgot-password-form');

    if (form) {
        form.addEventListener('submit', handlePasswordReset);
    }
}

/**
 * Handle password reset form submission
 * @param {Event} e - Form submit event
 */
async function handlePasswordReset(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) {
        showToast('Error', 'Please enter your email address', 'error');
        return;
    }

    showLoader();

    try {
        await resetPassword(email);
        showToast('Success', 'Password reset email sent! Check your inbox.', 'success');

        // Show success message and disable form
        const form = document.getElementById('forgot-password-form');
        if (form) {
            form.innerHTML = `
                <div class="success-message">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--color-success)" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h3>Check your email</h3>
                    <p>We've sent a password reset link to <strong>${email}</strong></p>
                    <a href="/pages/auth/login.html" class="btn btn-primary">Back to Sign In</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Password reset error:', error);
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
        'auth/invalid-email': 'Invalid email address',
        'auth/user-not-found': 'No account found with this email',
        'auth/too-many-requests': 'Too many requests. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection'
    };

    const message = errorMessages[error.code] || 'Failed to send reset email. Please try again.';
    showToast('Error', message, 'error');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
