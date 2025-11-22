/**
 * EasySlots - Checkout Page
 * Handles booking form submission and Stripe payment processing
 */

import { requireAuth } from '../utils/authGuard.js';
import { calculateBookingTotals } from '../services/bookings.js';
import { createCheckoutSession } from '../services/stripe.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { formatCurrency } from '../utils/currency.js';

let bookingData = null;
let authData = null;

/**
 * Initialize checkout page
 */
async function init() {
    showLoader();

    try {
        // Require authentication
        authData = await requireAuth();
        if (!authData) return;

        // Get pending booking from session storage
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        if (!pendingBooking) {
            showToast('Error', 'No booking data found. Please start again.', 'error');
            window.location.href = '/pages/events/index.html';
            return;
        }

        bookingData = JSON.parse(pendingBooking);

        // Render order summary
        renderOrderSummary();

        // Pre-fill user info
        prefillUserInfo();

        // Setup form handlers
        setupFormHandlers();
    } catch (error) {
        console.error('Checkout init error:', error);
        showToast('Error', 'Failed to load checkout', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Render order summary
 */
function renderOrderSummary() {
    const summaryEl = document.getElementById('order-summary');
    if (!summaryEl) return;

    const { subtotal, serviceFee, total } = calculateBookingTotals(
        bookingData.unitPrice,
        bookingData.quantity
    );

    const date = new Date(bookingData.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    summaryEl.innerHTML = `
        <div class="order-summary">
            <div class="order-summary__header">
                ${bookingData.eventImage ? `
                    <img src="${bookingData.eventImage}" alt="${bookingData.eventTitle}" class="order-summary__image">
                ` : ''}
                <div class="order-summary__info">
                    <h3 class="order-summary__title">${bookingData.eventTitle}</h3>
                    <p class="order-summary__vendor">${bookingData.vendorName || 'Event Host'}</p>
                </div>
            </div>

            <div class="order-summary__details">
                <div class="order-summary__row">
                    <span class="label">Date</span>
                    <span class="value">${formattedDate}</span>
                </div>
                <div class="order-summary__row">
                    <span class="label">Time</span>
                    <span class="value">${bookingData.startTime} - ${bookingData.endTime}</span>
                </div>
                <div class="order-summary__row">
                    <span class="label">Quantity</span>
                    <span class="value">${bookingData.quantity} ${bookingData.quantity === 1 ? 'spot' : 'spots'}</span>
                </div>
            </div>

            <div class="order-summary__pricing">
                <div class="order-summary__row">
                    <span class="label">${formatCurrency(bookingData.unitPrice)} x ${bookingData.quantity}</span>
                    <span class="value">${formatCurrency(subtotal)}</span>
                </div>
                <div class="order-summary__row">
                    <span class="label">Service fee</span>
                    <span class="value">${formatCurrency(serviceFee)}</span>
                </div>
                <div class="order-summary__row order-summary__row--total">
                    <span class="label">Total</span>
                    <span class="value">${formatCurrency(total)}</span>
                </div>
            </div>

            <p class="order-summary__note">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Secure payment powered by Stripe
            </p>
        </div>
    `;
}

/**
 * Pre-fill user information from profile
 */
function prefillUserInfo() {
    if (!authData) return;

    const { user, profile } = authData;

    // Pre-fill name
    const nameInput = document.getElementById('customer-name');
    if (nameInput) {
        nameInput.value = profile?.displayName || user.displayName || '';
    }

    // Pre-fill email
    const emailInput = document.getElementById('customer-email');
    if (emailInput) {
        emailInput.value = user.email || '';
    }

    // Pre-fill phone if available
    const phoneInput = document.getElementById('customer-phone');
    if (phoneInput && profile?.phone) {
        phoneInput.value = profile.phone;
    }
}

/**
 * Setup form handlers
 */
function setupFormHandlers() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', handleSubmit);

    // Cancel button
    const cancelBtn = document.getElementById('cancel-booking');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
}

/**
 * Handle form submission - redirect to Stripe Checkout
 * @param {Event} e - Submit event
 */
async function handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Terms checkbox
    const termsCheckbox = document.getElementById('terms-agree');
    if (termsCheckbox && !termsCheckbox.checked) {
        showToast('Error', 'Please agree to the terms and conditions', 'error');
        return;
    }

    // Store customer info for after payment
    const customerInfo = {
        name: document.getElementById('customer-name').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        phone: document.getElementById('customer-phone')?.value.trim() || '',
        notes: document.getElementById('booking-notes')?.value.trim() || ''
    };
    sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Redirecting to payment...';

    try {
        // Create Stripe checkout session and redirect
        await createCheckoutSession({
            eventId: bookingData.eventId,
            slotId: bookingData.slotId,
            quantity: bookingData.quantity,
            successUrl: `${window.location.origin}/pages/booking/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/pages/booking/cancel.html`
        });

        // Note: The page will redirect, so this code won't execute
        // But just in case something goes wrong with the redirect
    } catch (error) {
        console.error('Checkout error:', error);

        let message = 'Failed to start payment. Please try again.';

        // Handle specific error codes
        if (error.code === 'unauthenticated') {
            message = 'Please sign in to complete your booking.';
        } else if (error.code === 'not-found') {
            message = 'Event or slot not found. Please try again.';
        } else if (error.code === 'failed-precondition') {
            message = error.message || 'Unable to process booking.';
        } else if (error.message) {
            message = error.message;
        }

        showToast('Error', message, 'error');

        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Proceed to Payment';
    }
}

/**
 * Handle cancel button
 */
function handleCancel() {
    sessionStorage.removeItem('pendingBooking');
    sessionStorage.removeItem('customerInfo');
    window.location.href = '/pages/booking/cancel.html';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
