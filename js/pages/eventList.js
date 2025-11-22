/**
 * EasySlots - Event List Page
 */

import { getEvents } from '../services/events.js';
import { renderEventCards } from '../components/eventCard.js';
import { getQueryParams, setQueryParams } from '../utils/router.js';

let currentFilters = {};

async function init() {
    currentFilters = getQueryParams();
    setupFilters();
    await loadEvents();
}

function setupFilters() {
    const categorySelect = document.getElementById('filter-category');
    const dateInput = document.getElementById('filter-date');
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');

    if (categorySelect && currentFilters.category) {
        categorySelect.value = currentFilters.category;
    }

    if (dateInput && currentFilters.date) {
        dateInput.value = currentFilters.date;
    }

    applyBtn?.addEventListener('click', applyFilters);
    clearBtn?.addEventListener('click', clearFilters);
}

function applyFilters() {
    const category = document.getElementById('filter-category')?.value;
    const date = document.getElementById('filter-date')?.value;
    const priceMin = document.getElementById('filter-price-min')?.value;
    const priceMax = document.getElementById('filter-price-max')?.value;

    currentFilters = { category, date, priceMin, priceMax };
    setQueryParams(currentFilters);
    loadEvents();
}

function clearFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-price-min').value = '';
    document.getElementById('filter-price-max').value = '';

    currentFilters = {};
    setQueryParams({}, true);
    loadEvents();
}

async function loadEvents() {
    const container = document.getElementById('events-grid');
    const countEl = document.getElementById('results-count');
    if (!container) return;

    try {
        const events = await getEvents(currentFilters);
        renderEventCards(container, events);
        if (countEl) countEl.textContent = events.length;
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
