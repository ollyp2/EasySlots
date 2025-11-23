/**
 * EasySeats - Seller Events Page
 * Lists vendor's events with filtering and actions
 */

import { requireSeller } from '../utils/authGuard.js';
import { getEventsByVendor, deleteEvent, publishEvent, unpublishEvent } from '../services/events.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { confirm } from '../components/modal.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDate } from '../utils/dates.js';
import { renderSidebar } from '../components/sidebar.js';

let vendorId = null;
let allEvents = [];
let currentFilter = 'all';

/**
 * Initialize seller events page
 */
async function init() {
    showLoader();

    try {
        const authData = await requireSeller();
        if (!authData) return;

        vendorId = authData.profile.vendorId || authData.user.uid;

        // Render sidebar (dynamic based on mode)
        await renderSidebar();

        // Setup filter tabs
        setupFilters();

        // Load events
        await loadEvents();
    } catch (error) {
        console.error('Events page error:', error);
        showToast('Error', 'Failed to load events', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Setup filter tabs
 */
function setupFilters() {
    const filterTabs = document.querySelectorAll('[data-filter]');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            filterTabs.forEach(t => t.classList.remove('tab--active'));
            tab.classList.add('tab--active');

            // Apply filter
            currentFilter = tab.dataset.filter;
            renderEvents();
        });
    });
}

/**
 * Load vendor events
 */
async function loadEvents() {
    try {
        allEvents = await getEventsByVendor(vendorId);
        renderEvents();
        updateCounts();
    } catch (error) {
        console.error('Failed to load events:', error);
        showToast('Error', 'Failed to load events', 'error');
    }
}

/**
 * Update filter tab counts
 */
function updateCounts() {
    const allCount = document.querySelector('[data-count="all"]');
    const publishedCount = document.querySelector('[data-count="published"]');
    const draftCount = document.querySelector('[data-count="draft"]');

    if (allCount) allCount.textContent = allEvents.length;
    if (publishedCount) publishedCount.textContent = allEvents.filter(e => e.status === 'published').length;
    if (draftCount) draftCount.textContent = allEvents.filter(e => e.status === 'draft').length;
}

/**
 * Render events based on current filter
 */
function renderEvents() {
    const container = document.getElementById('events-list');
    if (!container) return;

    let filteredEvents = allEvents;

    if (currentFilter !== 'all') {
        filteredEvents = allEvents.filter(e => e.status === currentFilter);
    }

    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3>${currentFilter === 'all' ? 'No events yet' : `No ${currentFilter} events`}</h3>
                <p class="text-muted">Create your first event to start selling</p>
                <a href="/pages/seller/events/create.html" class="btn btn-primary">Create Event</a>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredEvents.map(event => renderEventCard(event)).join('');

    // Attach event handlers
    attachEventHandlers();
}

/**
 * Render an event card
 * @param {Object} event - Event data
 * @returns {string} HTML string
 */
function renderEventCard(event) {
    const imageUrl = event.imageURL || '/assets/images/placeholder-event.jpg';
    const statusClass = event.status === 'published' ? 'success' : 'default';

    return `
        <div class="event-card event-card--horizontal" data-event-id="${event.id}">
            <div class="event-card__image">
                <img src="${imageUrl}" alt="${event.title}">
                <span class="badge badge--${statusClass} event-card__badge">${event.status}</span>
            </div>
            <div class="event-card__content">
                <div class="event-card__header">
                    <h3 class="event-card__title">${event.title}</h3>
                    <span class="event-card__category">${event.category || 'Uncategorized'}</span>
                </div>
                <p class="event-card__description">${event.shortDescription || event.description?.substring(0, 100) || 'No description'}</p>
                <div class="event-card__meta">
                    <span class="event-card__price">${formatCurrency(event.basePrice || 0)}</span>
                    <span class="event-card__type">${event.eventType || 'Event'}</span>
                </div>
            </div>
            <div class="event-card__actions">
                <a href="/pages/seller/events/edit.html?id=${event.id}" class="btn btn-ghost btn-sm">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </a>
                ${event.status === 'draft' ? `
                    <button class="btn btn-success btn-sm" data-action="publish" data-event-id="${event.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Publish
                    </button>
                ` : `
                    <button class="btn btn-ghost btn-sm" data-action="unpublish" data-event-id="${event.id}">
                        Unpublish
                    </button>
                `}
                <button class="btn btn-ghost btn-sm btn-danger" data-action="delete" data-event-id="${event.id}">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

/**
 * Attach event handlers to action buttons
 */
function attachEventHandlers() {
    // Publish buttons
    document.querySelectorAll('[data-action="publish"]').forEach(btn => {
        btn.addEventListener('click', () => handlePublish(btn.dataset.eventId));
    });

    // Unpublish buttons
    document.querySelectorAll('[data-action="unpublish"]').forEach(btn => {
        btn.addEventListener('click', () => handleUnpublish(btn.dataset.eventId));
    });

    // Delete buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.eventId));
    });
}

/**
 * Handle publish action
 * @param {string} eventId - Event ID
 */
async function handlePublish(eventId) {
    showLoader();

    try {
        await publishEvent(eventId);
        showToast('Success', 'Event published successfully', 'success');
        await loadEvents();
    } catch (error) {
        console.error('Publish error:', error);
        showToast('Error', 'Failed to publish event', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Handle unpublish action
 * @param {string} eventId - Event ID
 */
async function handleUnpublish(eventId) {
    showLoader();

    try {
        await unpublishEvent(eventId);
        showToast('Success', 'Event unpublished', 'success');
        await loadEvents();
    } catch (error) {
        console.error('Unpublish error:', error);
        showToast('Error', 'Failed to unpublish event', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Handle delete action
 * @param {string} eventId - Event ID
 */
async function handleDelete(eventId) {
    const confirmed = await confirm(
        'Delete Event',
        'Are you sure you want to delete this event? This action cannot be undone.'
    );

    if (!confirmed) return;

    showLoader();

    try {
        await deleteEvent(eventId);
        showToast('Success', 'Event deleted', 'success');
        await loadEvents();
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Error', 'Failed to delete event', 'error');
    } finally {
        hideLoader();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
