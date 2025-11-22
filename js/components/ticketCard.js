/**
 * EasySlots - Ticket Card Component
 * Displays ticket information with QR code
 */

import { formatDate, formatTime } from '../utils/dates.js';

/**
 * Create a ticket card element
 * @param {Object} ticket - Ticket data
 * @returns {HTMLElement} Ticket card element
 */
export function createTicketCard(ticket) {
    const card = document.createElement('div');
    card.className = `ticket-card ${ticket.status === 'used' ? 'ticket-card--used' : ''}`;

    card.innerHTML = `
        <div class="ticket-card__header">
            <div class="ticket-card__event">${ticket.eventTitle}</div>
            <div class="ticket-card__vendor">${ticket.vendorName}</div>
        </div>
        <div class="ticket-card__body">
            <div class="ticket-card__info">
                <div class="ticket-card__info-item">
                    <div class="ticket-card__label">Date</div>
                    <div class="ticket-card__value">${formatDate(ticket.eventDate)}</div>
                </div>
                <div class="ticket-card__info-item">
                    <div class="ticket-card__label">Time</div>
                    <div class="ticket-card__value">${formatTime(ticket.eventTime)}</div>
                </div>
            </div>
            <div class="ticket-card__qr">
                <img src="${ticket.qrCodeUrl || generateQRPlaceholder(ticket.code)}" alt="Ticket QR Code">
            </div>
            <div class="ticket-card__footer">
                <span class="ticket-card__code">${ticket.code}</span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Generate placeholder QR code URL
 * @param {string} code - Ticket code
 * @returns {string} QR placeholder URL
 */
function generateQRPlaceholder(code) {
    // Using a free QR code API for placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(code)}`;
}

export default { createTicketCard };
