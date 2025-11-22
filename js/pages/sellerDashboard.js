/**
 * EasySlots - Seller Dashboard Page
 * Shows vendor stats, recent bookings, and upcoming events
 */

import { requireSeller } from '../utils/authGuard.js';
import { getEventsByVendor, getVendorEventStats } from '../services/events.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, formatRelativeTime } from '../utils/dates.js';

let vendorId = null;

/**
 * Initialize seller dashboard
 */
async function init() {
    showLoader();

    try {
        // Require seller auth
        const authData = await requireSeller();
        if (!authData) return;

        vendorId = authData.profile.vendorId || authData.user.uid;

        // Load dashboard data
        await Promise.all([
            loadStats(),
            loadRecentBookings(),
            loadUpcomingEvents()
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
        const stats = await getVendorEventStats(vendorId);

        // Update stats display
        updateStatCard('active-events', stats.published);

        // These would typically come from bookings/payments service
        // For now, showing placeholder values
        updateStatCard('revenue-today', formatCurrency(0));
        updateStatCard('bookings-today', '0');
        updateStatCard('pending-payouts', formatCurrency(0));
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
 * Load recent bookings
 */
async function loadRecentBookings() {
    const tbody = document.querySelector('#recent-bookings tbody');
    if (!tbody) return;

    // For now, show empty state since we haven't implemented bookings fully
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="table-empty">
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <p>No recent bookings</p>
                    <span class="text-muted">Bookings will appear here once customers start booking</span>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Load upcoming events
 */
async function loadUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    if (!container) return;

    try {
        const events = await getEventsByVendor(vendorId, 'published');
        const upcomingEvents = events.slice(0, 5); // Get first 5

        if (upcomingEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <p>No published events</p>
                    <a href="/pages/seller/events/create.html" class="btn btn-primary btn-sm">Create your first event</a>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingEvents.map(event => renderEventItem(event)).join('');
    } catch (error) {
        console.error('Failed to load events:', error);
        container.innerHTML = '<p class="text-muted">Failed to load events</p>';
    }
}

/**
 * Render an event item for the list
 * @param {Object} event - Event data
 * @returns {string} HTML string
 */
function renderEventItem(event) {
    const imageUrl = event.imageURL || '/assets/images/placeholder-event.jpg';

    return `
        <div class="event-list-item">
            <div class="event-list-item__image">
                <img src="${imageUrl}" alt="${event.title}">
            </div>
            <div class="event-list-item__content">
                <h3 class="event-list-item__title">${event.title}</h3>
                <p class="event-list-item__meta">
                    <span class="badge badge--${event.status === 'published' ? 'success' : 'default'}">${event.status}</span>
                    ${event.category ? `<span class="text-muted">${event.category}</span>` : ''}
                </p>
            </div>
            <div class="event-list-item__actions">
                <a href="/pages/seller/events/edit.html?id=${event.id}" class="btn btn-ghost btn-sm">Edit</a>
                <a href="/pages/events/detail.html?id=${event.id}" class="btn btn-ghost btn-sm" target="_blank">View</a>
            </div>
        </div>
    `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
