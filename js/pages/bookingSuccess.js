/**
 * EasySlots - Booking Success Page
 * Handles successful payment completion from Stripe
 */

import { getBookingById } from '../services/bookings.js';
import { getCheckoutSession } from '../services/stripe.js';
import { formatCurrency } from '../utils/currency.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { showToast } from '../components/toast.js';

async function init() {
    showLoader();

    try {
        // Check for Stripe session ID in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (sessionId) {
            // Verify session with Stripe and get booking details
            await handleStripeSession(sessionId);
        } else {
            // Fallback to legacy flow (direct booking without Stripe)
            const bookingId = sessionStorage.getItem('lastBookingId');
            if (bookingId) {
                const booking = await getBookingById(bookingId);
                if (booking) {
                    renderBookingDetails(booking);
                }
                sessionStorage.removeItem('lastBookingId');
            }
        }

        // Clean up session storage
        sessionStorage.removeItem('pendingBooking');
        sessionStorage.removeItem('customerInfo');
    } catch (error) {
        console.error('Error loading booking:', error);
        showToast('Error', 'Failed to load booking details', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Handle Stripe session verification
 * @param {string} sessionId - Stripe checkout session ID
 */
async function handleStripeSession(sessionId) {
    try {
        const sessionData = await getCheckoutSession(sessionId);

        if (sessionData.paymentStatus === 'paid') {
            // Payment successful
            if (sessionData.booking) {
                renderBookingDetails(sessionData.booking);
            } else {
                // Booking might not be created yet (webhook delay)
                renderPaymentConfirmation(sessionData);
            }
        } else if (sessionData.paymentStatus === 'unpaid') {
            // Payment not completed
            showToast('Warning', 'Payment was not completed. Please try again.', 'warning');
            renderPaymentPending(sessionData);
        }
    } catch (error) {
        console.error('Error verifying session:', error);
        // Still show success message even if verification fails
        // The webhook will handle the actual booking
        renderGenericSuccess();
    }
}

/**
 * Render booking details
 * @param {Object} booking - Booking data
 */
function renderBookingDetails(booking) {
    const detailsEl = document.getElementById('booking-details');
    if (!detailsEl) return;

    const date = new Date(booking.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    detailsEl.innerHTML = `
        <div class="success-details">
            <div class="success-details__item">
                <span class="label">Event</span>
                <span class="value">${booking.eventTitle}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Date</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Time</span>
                <span class="value">${booking.startTime} - ${booking.endTime}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Quantity</span>
                <span class="value">${booking.quantity} ${booking.quantity === 1 ? 'spot' : 'spots'}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Total Paid</span>
                <span class="value">${formatCurrency(booking.totalPrice || booking.totalAmount)}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Booking ID</span>
                <span class="value booking-id">${booking.id}</span>
            </div>
        </div>
        <p class="success-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            A confirmation email has been sent to your email address.
        </p>
    `;
}

/**
 * Render payment confirmation (when booking not yet created)
 * @param {Object} sessionData - Stripe session data
 */
function renderPaymentConfirmation(sessionData) {
    const detailsEl = document.getElementById('booking-details');
    if (!detailsEl) return;

    const { metadata, amountTotal, currency } = sessionData;

    detailsEl.innerHTML = `
        <div class="success-details">
            <div class="success-details__item">
                <span class="label">Payment Status</span>
                <span class="value badge badge--success">Paid</span>
            </div>
            <div class="success-details__item">
                <span class="label">Amount</span>
                <span class="value">${formatCurrency(amountTotal / 100)}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Quantity</span>
                <span class="value">${metadata?.quantity || 1} spot(s)</span>
            </div>
        </div>
        <p class="success-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Your booking is being processed. You'll receive a confirmation email shortly.
        </p>
    `;
}

/**
 * Render payment pending state
 * @param {Object} sessionData - Stripe session data
 */
function renderPaymentPending(sessionData) {
    const detailsEl = document.getElementById('booking-details');
    if (!detailsEl) return;

    detailsEl.innerHTML = `
        <div class="alert alert--warning">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
                <h4>Payment Pending</h4>
                <p>Your payment was not completed. Please return to checkout to try again.</p>
            </div>
        </div>
    `;

    // Update the action buttons
    const actionsEl = document.querySelector('.confirmation-actions');
    if (actionsEl) {
        actionsEl.innerHTML = `
            <a href="/pages/booking/checkout.html" class="btn btn-primary">Return to Checkout</a>
            <a href="/pages/events/index.html" class="btn btn-outline">Browse Events</a>
        `;
    }
}

/**
 * Render generic success (fallback)
 */
function renderGenericSuccess() {
    const detailsEl = document.getElementById('booking-details');
    if (!detailsEl) return;

    detailsEl.innerHTML = `
        <div class="success-details">
            <p class="success-note">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Your booking confirmation will be sent to your email address.
            </p>
        </div>
    `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
