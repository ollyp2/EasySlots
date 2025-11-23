/**
 * EasySeats - Event Card Component
 * Renders event cards for listings
 */

import { formatPrice } from '../services/payments.js';
import { formatDate } from '../utils/dates.js';

/**
 * Create an event card element
 * @param {Object} event - Event data
 * @returns {HTMLElement} Event card element
 */
export function createEventCard(event) {
    const card = document.createElement('article');
    card.className = 'event-card';

    card.innerHTML = `
        <a href="/pages/events/detail.html?id=${event.id}" class="event-card__link">
            <div class="event-card__image">
                <img src="${event.imageUrl || '/assets/images/placeholder-event.jpg'}" alt="${event.title}" loading="lazy">
                ${event.featured ? '<span class="event-card__badge badge badge--primary">Featured</span>' : ''}
            </div>
            <div class="event-card__content">
                <span class="event-card__category">${event.category}</span>
                <h3 class="event-card__title">${event.title}</h3>
                <div class="event-card__meta">
                    <div class="event-card__meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${formatDate(event.startDate)}</span>
                    </div>
                    <div class="event-card__meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${event.location?.city || 'Online'}</span>
                    </div>
                </div>
                <div class="event-card__footer">
                    <div class="event-card__price">
                        ${formatPrice(event.price)}
                        <span class="event-card__price-label">/ person</span>
                    </div>
                </div>
            </div>
        </a>
    `;

    return card;
}

/**
 * Render multiple event cards to a container
 * @param {HTMLElement} container - Container element
 * @param {Array} events - Events array
 */
export function renderEventCards(container, events) {
    if (!container) return;

    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3>No events found</h3>
                <p>Try adjusting your filters or check back later</p>
            </div>
        `;
        return;
    }

    events.forEach(event => {
        container.appendChild(createEventCard(event));
    });
}

export default { createEventCard, renderEventCards };
