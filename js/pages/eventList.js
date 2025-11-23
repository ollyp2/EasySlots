/**
 * EasySeats - Event List Page
 * Browse and filter published events
 */

import { getPublishedEvents, searchEvents } from '../services/events.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { formatCurrency } from '../utils/currency.js';

let currentFilters = {};
let allEvents = [];

/**
 * Initialize event list page
 */
async function init() {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    currentFilters = {
        category: params.get('category') || '',
        search: params.get('q') || '',
        sort: params.get('sort') || 'date-desc'
    };

    setupFilters();
    setupSearch();
    setupSort();
    await loadEvents();
}

/**
 * Setup filter controls
 */
function setupFilters() {
    const categorySelect = document.getElementById('filter-category');
    const locationSelect = document.getElementById('filter-location');
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');

    if (categorySelect && currentFilters.category) {
        categorySelect.value = currentFilters.category;
    }

    categorySelect?.addEventListener('change', () => applyFilters());
    locationSelect?.addEventListener('change', () => applyFilters());

    applyBtn?.addEventListener('click', applyFilters);
    clearBtn?.addEventListener('click', clearFilters);
}

/**
 * Setup search functionality
 */
function setupSearch() {
    const searchInput = document.getElementById('search-events');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput && currentFilters.search) {
        searchInput.value = currentFilters.search;
    }

    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    searchBtn?.addEventListener('click', handleSearch);
}

/**
 * Setup sort controls
 */
function setupSort() {
    const sortSelect = document.getElementById('sort-events');

    if (sortSelect && currentFilters.sort) {
        sortSelect.value = currentFilters.sort;
    }

    sortSelect?.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        sortAndRenderEvents();
        updateUrl();
    });
}

/**
 * Apply current filters
 */
function applyFilters() {
    const category = document.getElementById('filter-category')?.value || '';
    const location = document.getElementById('filter-location')?.value || '';
    const priceMin = document.getElementById('filter-price-min')?.value || '';
    const priceMax = document.getElementById('filter-price-max')?.value || '';

    currentFilters = {
        ...currentFilters,
        category,
        location,
        priceMin,
        priceMax
    };

    updateUrl();
    loadEvents();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-location')?.value && (document.getElementById('filter-location').value = '');
    document.getElementById('filter-price-min')?.value && (document.getElementById('filter-price-min').value = '');
    document.getElementById('filter-price-max')?.value && (document.getElementById('filter-price-max').value = '');
    document.getElementById('search-events')?.value && (document.getElementById('search-events').value = '');

    currentFilters = { sort: 'date-desc' };
    updateUrl();
    loadEvents();
}

/**
 * Handle search
 */
async function handleSearch() {
    const searchInput = document.getElementById('search-events');
    currentFilters.search = searchInput?.value || '';
    updateUrl();
    await loadEvents();
}

/**
 * Update URL with current filters
 */
function updateUrl() {
    const params = new URLSearchParams();

    if (currentFilters.category) params.set('category', currentFilters.category);
    if (currentFilters.search) params.set('q', currentFilters.search);
    if (currentFilters.sort && currentFilters.sort !== 'date-desc') params.set('sort', currentFilters.sort);

    const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
}

/**
 * Load events from Firestore
 */
async function loadEvents() {
    const container = document.getElementById('events-grid');
    const countEl = document.getElementById('results-count');

    if (!container) return;

    showLoader();

    try {
        if (currentFilters.search) {
            allEvents = await searchEvents(currentFilters.search);
        } else {
            allEvents = await getPublishedEvents({
                category: currentFilters.category,
                limit: 50
            });
        }

        // Apply client-side filters
        let filteredEvents = [...allEvents];

        if (currentFilters.priceMin) {
            filteredEvents = filteredEvents.filter(e => (e.basePrice || 0) >= parseFloat(currentFilters.priceMin));
        }

        if (currentFilters.priceMax) {
            filteredEvents = filteredEvents.filter(e => (e.basePrice || 0) <= parseFloat(currentFilters.priceMax));
        }

        if (currentFilters.location) {
            filteredEvents = filteredEvents.filter(e => e.locationType === currentFilters.location);
        }

        allEvents = filteredEvents;
        sortAndRenderEvents();

        if (countEl) countEl.textContent = allEvents.length;
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Error', 'Failed to load events', 'error');
        container.innerHTML = '<p class="text-center text-muted">Failed to load events</p>';
    } finally {
        hideLoader();
    }
}

/**
 * Sort events and render
 */
function sortAndRenderEvents() {
    let sortedEvents = [...allEvents];

    switch (currentFilters.sort) {
        case 'price-asc':
            sortedEvents.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
            break;
        case 'price-desc':
            sortedEvents.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
            break;
        case 'date-asc':
            sortedEvents.sort((a, b) => new Date(a.createdAt?.toDate?.() || 0) - new Date(b.createdAt?.toDate?.() || 0));
            break;
        case 'date-desc':
        default:
            sortedEvents.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0));
            break;
    }

    renderEvents(sortedEvents);
}

/**
 * Render events to grid
 * @param {Array} events - Events to render
 */
function renderEvents(events) {
    const container = document.getElementById('events-grid');
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No events found</h3>
                <p class="text-muted">Try adjusting your filters or search terms</p>
                <button class="btn btn-outline" onclick="document.getElementById('clear-filters').click()">Clear Filters</button>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => renderEventCard(event)).join('');
}

/**
 * Render a single event card
 * @param {Object} event - Event data
 * @returns {string} HTML string
 */
function renderEventCard(event) {
    const imageUrl = event.imageURL || '/assets/images/placeholder-event.jpg';
    const price = formatCurrency(event.basePrice || 0);

    return `
        <a href="/pages/events/detail.html?id=${event.id}" class="event-card">
            <div class="event-card__image">
                <img src="${imageUrl}" alt="${event.title}" loading="lazy">
                <span class="badge badge--primary event-card__badge">${event.category || 'Event'}</span>
            </div>
            <div class="event-card__content">
                <h3 class="event-card__title">${event.title}</h3>
                <p class="event-card__description">${event.shortDescription || event.description?.substring(0, 80) || ''}</p>
                <div class="event-card__footer">
                    <span class="event-card__price">${price}</span>
                    <span class="event-card__location">
                        ${event.locationType === 'online' ? 'Online' : event.locationType === 'hybrid' ? 'Hybrid' : 'In-person'}
                    </span>
                </div>
            </div>
        </a>
    `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
