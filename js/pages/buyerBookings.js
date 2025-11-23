/**
 * EasySlots - Buyer Bookings Page
 */

import { requireAuth } from '../utils/authGuard.js';
import { getUserBookings, cancelBooking } from '../services/bookings.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { confirm } from '../components/modal.js';
import { formatCurrency } from '../utils/currency.js';
import { renderSidebar } from '../components/sidebar.js';

let userId = null;
let allBookings = [];
let currentFilter = 'upcoming';

async function init() {
    showLoader();

    try {
        const authData = await requireAuth();
        if (!authData) return;

        userId = authData.user.uid;

        // Render sidebar (dynamic based on mode)
        await renderSidebar();

        setupTabs();
        await loadBookings();
    } catch (error) {
        console.error('Bookings page error:', error);
        showToast('Error', 'Failed to load bookings', 'error');
    } finally {
        hideLoader();
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('[data-filter]');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('tab--active'));
            tab.classList.add('tab--active');
            currentFilter = tab.dataset.filter;
            renderBookings();
        });
    });
}

async function loadBookings() {
    try {
        allBookings = await getUserBookings(userId, 'all');
        updateCounts();
        renderBookings();
    } catch (error) {
        console.error('Failed to load bookings:', error);
        showToast('Error', 'Failed to load bookings', 'error');
    }
}

function updateCounts() {
    const today = new Date().toISOString().split('T')[0];

    const upcoming = allBookings.filter(b => b.date >= today && b.status !== 'cancelled').length;
    const past = allBookings.filter(b => b.date < today && b.status !== 'cancelled').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;

    updateCount('upcoming', upcoming);
    updateCount('past', past);
    updateCount('cancelled', cancelled);
}

function updateCount(filter, count) {
    const el = document.querySelector(`[data-count="${filter}"]`);
    if (el) el.textContent = count;
}

function renderBookings() {
    const container = document.getElementById('bookings-list');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    let filteredBookings = allBookings;

    if (currentFilter === 'upcoming') {
        filteredBookings = allBookings.filter(b => b.date >= today && b.status !== 'cancelled');
    } else if (currentFilter === 'past') {
        filteredBookings = allBookings.filter(b => b.date < today && b.status !== 'cancelled');
    } else if (currentFilter === 'cancelled') {
        filteredBookings = allBookings.filter(b => b.status === 'cancelled');
    }

    if (filteredBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3>No ${currentFilter} bookings</h3>
                ${currentFilter === 'upcoming' ? '<a href="/pages/events/index.html" class="btn btn-primary">Browse Events</a>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = filteredBookings.map(booking => renderBookingItem(booking)).join('');

    container.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.addEventListener('click', () => handleCancel(btn.dataset.cancel));
    });
}

function renderBookingItem(booking) {
    const date = new Date(booking.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const imageUrl = booking.eventImage || '/assets/images/placeholder-event.jpg';
    const today = new Date().toISOString().split('T')[0];
    const canCancel = booking.status !== 'cancelled' && booking.date >= today;

    let statusClass = 'default';
    if (booking.status === 'confirmed') statusClass = 'success';
    else if (booking.status === 'cancelled') statusClass = 'danger';

    return `
        <div class="booking-item">
            <div class="booking-item__image">
                <img src="${imageUrl}" alt="${booking.eventTitle}">
            </div>
            <div class="booking-item__content">
                <h3 class="booking-item__title">${booking.eventTitle}</h3>
                <div class="booking-item__details">
                    <span>${formattedDate}</span>
                    <span>${booking.startTime} - ${booking.endTime}</span>
                    <span>${booking.quantity} ${booking.quantity === 1 ? 'spot' : 'spots'}</span>
                </div>
                <div class="booking-item__meta">
                    <span class="badge badge--${statusClass}">${booking.status}</span>
                    <span class="booking-item__price">${formatCurrency(booking.totalPrice)}</span>
                </div>
            </div>
            <div class="booking-item__actions">
                <a href="/pages/events/detail.html?id=${booking.eventId}" class="btn btn-ghost btn-sm">View Event</a>
                ${canCancel ? `<button class="btn btn-ghost btn-sm btn-danger" data-cancel="${booking.id}">Cancel</button>` : ''}
            </div>
        </div>
    `;
}

async function handleCancel(bookingId) {
    const confirmed = await confirm({
        title: 'Cancel Booking',
        message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
        confirmText: 'Yes, Cancel',
        cancelText: 'Keep Booking',
        type: 'danger'
    });

    if (!confirmed) return;

    showLoader();

    try {
        await cancelBooking(bookingId, 'Cancelled by user');
        showToast('Success', 'Booking cancelled successfully', 'success');
        await loadBookings();
    } catch (error) {
        console.error('Cancel error:', error);
        showToast('Error', error.message || 'Failed to cancel booking', 'error');
    } finally {
        hideLoader();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
