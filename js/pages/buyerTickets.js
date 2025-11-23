/**
 * EasySlots - Buyer Tickets Page
 * Displays user's tickets with QR codes
 */

import { requireAuth } from '../utils/authGuard.js';
import { getUserTickets, groupTicketsByEvent } from '../services/tickets.js';
import { createTicketCard } from '../components/ticketCard.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { renderSidebar } from '../components/sidebar.js';

let userId = null;

/**
 * Initialize buyer tickets page
 */
async function init() {
    showLoader();

    try {
        const authData = await requireAuth();
        if (!authData) return;

        userId = authData.user.uid;

        // Render sidebar (dynamic based on mode)
        await renderSidebar();

        await loadTickets();
    } catch (error) {
        console.error('Tickets page error:', error);
        showToast('Error', 'Failed to load tickets', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Load user's tickets
 */
async function loadTickets() {
    const container = document.getElementById('tickets-grid');
    const emptyState = document.getElementById('empty-state');

    if (!container) return;

    try {
        const tickets = await getUserTickets(userId);

        if (tickets.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = '';
        emptyState.style.display = 'none';

        // Group tickets by event and date
        const grouped = groupTicketsByEvent(tickets);

        // Clear and rebuild container
        container.innerHTML = '';

        // Render grouped tickets
        Object.entries(grouped).forEach(([key, eventTickets]) => {
            const section = createTicketSection(eventTickets);
            container.appendChild(section);
        });

    } catch (error) {
        console.error('Failed to load tickets:', error);
        showToast('Error', 'Failed to load tickets', 'error');
    }
}

/**
 * Create a ticket section for an event
 * @param {Array} tickets - Tickets for this event
 * @returns {HTMLElement} Section element
 */
function createTicketSection(tickets) {
    const section = document.createElement('div');
    section.className = 'tickets-section';

    const firstTicket = tickets[0];
    const eventDate = formatEventDate(firstTicket.eventDate);

    // Separate valid and used/cancelled tickets
    const validTickets = tickets.filter(t => t.status === 'valid');
    const otherTickets = tickets.filter(t => t.status !== 'valid');

    section.innerHTML = `
        <div class="tickets-section__header">
            <h2 class="tickets-section__title">${firstTicket.eventTitle || 'Event'}</h2>
            <p class="tickets-section__meta">
                <span>${eventDate}</span>
                ${firstTicket.vendorName ? `<span class="divider">•</span><span>${firstTicket.vendorName}</span>` : ''}
            </p>
        </div>
        <div class="tickets-section__grid"></div>
    `;

    const grid = section.querySelector('.tickets-section__grid');

    // Add valid tickets first
    validTickets.forEach(ticket => {
        const card = createTicketCard(ticket, { showQR: true, showActions: true });
        grid.appendChild(card);
    });

    // Add other tickets (collapsed/compact)
    otherTickets.forEach(ticket => {
        const card = createTicketCard(ticket, { showQR: false, showActions: false, compact: true });
        grid.appendChild(card);
    });

    return section;
}

/**
 * Format event date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatEventDate(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
