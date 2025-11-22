/**
 * EasySlots - Buyer Dashboard Page
 * Shows user stats and upcoming bookings overview
 */

import { requireAuth } from '../utils/authGuard.js';
import { getUserBookings } from '../services/bookings.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { formatCurrency } from '../utils/currency.js';
import { formatRelativeTime } from '../utils/dates.js';

let userId = null;

/**
 * Initialize buyer dashboard
 */
async function init() {
    showLoader();

    try {
        // Require authentication
        const authData = await requireAuth();
        if (!authData) return;

        userId = authData.user.uid;

        // Load dashboard data
        await Promise.all([
            loadStats(),
            loadUpcomingBookings()
        ]);
    } catch (error) {
        console.error('Dashboard error:', error);
        showToast('Error', 'Failed to load dashboard', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Load dashboard statistics
 */
async function loadStats() {
    try {
        const bookings = await getUserBookings(userId);

        const now = new Date();
        const stats = {
            upcoming: 0,
            completed: 0,
            totalSpent: 0
        };

        bookings.forEach(booking => {
            if (booking.status === 'cancelled') return;

            const bookingDate = new Date(booking.date);

            if (bookingDate >= now && booking.status !== 'cancelled') {
                stats.upcoming++;
            } else if (booking.status === 'confirmed' || booking.status === 'completed') {
                stats.completed++;
            }

            if (booking.status !== 'cancelled') {
                stats.totalSpent += booking.totalPrice || 0;
            }
        });

        // Update stat displays
        updateStatCard('upcoming-bookings', stats.upcoming);
        updateStatCard('completed-bookings', stats.completed);
        updateStatCard('total-spent', formatCurrency(stats.totalSpent));
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

/**
 * Update a stat card value
 * @param {string} elementId - Element ID
 * @param {string|number} value - Value to display
 */
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Load upcoming bookings
 */
async function loadUpcomingBookings() {
    const container = document.getElementById('upcoming-bookings-list');
    if (!container) return;

    try {
        const bookings = await getUserBookings(userId);

        // Filter to upcoming only
        const now = new Date();
        const upcomingBookings = bookings
            .filter(booking => {
                const bookingDate = new Date(booking.date);
                return bookingDate >= now && booking.status !== 'cancelled';
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcomingBookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <p>No upcoming bookings</p>
                    <a href="/pages/events/index.html" class="btn btn-primary btn-sm">Browse Events</a>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingBookings.map(booking => renderBookingItem(booking)).join('');
    } catch (error) {
        console.error('Failed to load bookings:', error);
        container.innerHTML = '<p class="text-muted">Failed to load bookings</p>';
    }
}

/**
 * Render a booking item for the list
 * @param {Object} booking - Booking data
 * @returns {string} HTML string
 */
function renderBookingItem(booking) {
    const date = new Date(booking.date);

    const relativeTime = formatRelativeTime(date);

    return `
        <div class="booking-list-item">
            <div class="booking-list-item__date">
                <span class="booking-list-item__day">${date.getDate()}</span>
                <span class="booking-list-item__month">${date.toLocaleDateString('en-US', { month: 'short' })}</span>
            </div>
            <div class="booking-list-item__content">
                <h4 class="booking-list-item__title">${booking.eventTitle}</h4>
                <p class="booking-list-item__meta">
                    <span>${booking.startTime} - ${booking.endTime}</span>
                    <span class="text-muted">${relativeTime}</span>
                </p>
            </div>
            <div class="booking-list-item__actions">
                <span class="badge badge--${getStatusBadgeClass(booking.status)}">${booking.status}</span>
            </div>
        </div>
    `;
}

/**
 * Get badge class for booking status
 * @param {string} status - Booking status
 * @returns {string} Badge class
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'confirmed':
            return 'success';
        case 'pending':
            return 'warning';
        case 'cancelled':
            return 'error';
        case 'completed':
            return 'default';
        default:
            return 'default';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
