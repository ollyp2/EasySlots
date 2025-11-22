/**
 * EasySlots - Booking Success Page
 */

import { getBookingById } from '../services/bookings.js';
import { formatCurrency } from '../utils/currency.js';

async function init() {
    const bookingId = sessionStorage.getItem('lastBookingId');

    if (bookingId) {
        try {
            const booking = await getBookingById(bookingId);
            if (booking) {
                renderBookingDetails(booking);
            }
        } catch (error) {
            console.error('Error loading booking:', error);
        }
        sessionStorage.removeItem('lastBookingId');
    }
}

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
                <span class="label">Total</span>
                <span class="value">${formatCurrency(booking.totalPrice)}</span>
            </div>
            <div class="success-details__item">
                <span class="label">Booking ID</span>
                <span class="value">${booking.id}</span>
            </div>
        </div>
    `;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
