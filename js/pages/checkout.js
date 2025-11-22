/**
 * EasySlots - Checkout Page
 * Handles booking form submission and payment processing
 */

import { requireAuth } from '../utils/authGuard.js';
import { createBooking, calculateBookingTotals } from '../services/bookings.js';
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
 * Handle form submission
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

    // Get form data
    const customerName = document.getElementById('customer-name').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone')?.value.trim() || '';
    const notes = document.getElementById('booking-notes')?.value.trim() || '';

    // Terms checkbox
    const termsCheckbox = document.getElementById('terms-agree');
    if (termsCheckbox && !termsCheckbox.checked) {
        showToast('Error', 'Please agree to the terms and conditions', 'error');
        return;
    }

    // Calculate totals
    const { subtotal, serviceFee, total } = calculateBookingTotals(
        bookingData.unitPrice,
        bookingData.quantity
    );

    // Prepare booking data
    const fullBookingData = {
        ...bookingData,
        userId: authData.user.uid,
        customerInfo: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone
        },
        notes
    };

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

    try {
        // Create booking
        const bookingId = await createBooking(fullBookingData);

        // Clear pending booking
        sessionStorage.removeItem('pendingBooking');

        // Store booking ID for success page
        sessionStorage.setItem('lastBookingId', bookingId);

        // Show success and redirect
        showToast('Success', 'Booking confirmed!', 'success');

        setTimeout(() => {
            window.location.href = '/pages/booking/success.html';
        }, 500);
    } catch (error) {
        console.error('Booking error:', error);

        let message = 'Failed to complete booking. Please try again.';
        if (error.message.includes('Not enough spots')) {
            message = 'Sorry, the selected spots are no longer available.';
        }

        showToast('Error', message, 'error');

        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Booking';
    }
}

/**
 * Handle cancel button
 */
function handleCancel() {
    sessionStorage.removeItem('pendingBooking');
    window.location.href = '/pages/booking/cancel.html';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
