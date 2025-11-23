/**
 * EasySeats - Home Page
 */

import { getFeaturedEvents } from '../services/events.js';
import { renderEventCards } from '../components/eventCard.js';
import { CONSTANTS } from '../config/constants.js';

async function init() {
    await loadFeaturedEvents();
    renderCategories();
}

async function loadFeaturedEvents() {
    const container = document.getElementById('featured-events');
    if (!container) return;

    try {
        const events = await getFeaturedEvents(6);
        renderEventCards(container, events);
    } catch (error) {
        console.error('Error loading featured events:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    const icons = {
        fitness: '<path d="M6.5 6.5h11v11h-11z"></path><circle cx="12" cy="12" r="2"></circle>',
        music: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
        coaching: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
        rentals: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
        workshop: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
        other: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
    };

    container.innerHTML = CONSTANTS.CATEGORIES.map(cat => `
        <a href="/pages/events/index.html?category=${cat.id}" class="category-card">
            <div class="category-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icons[cat.id] || icons.other}
                </svg>
            </div>
            <span class="category-card__name">${cat.name}</span>
        </a>
    `).join('');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
