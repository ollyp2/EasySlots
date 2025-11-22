/**
 * EasySlots - Ticket Card Component
 * Renders ticket cards with QR codes
 */

/**
 * Create a ticket card element
 * @param {Object} ticket - Ticket data
 * @param {Object} options - Display options
 * @returns {HTMLElement} Ticket card element
 */
export function createTicketCard(ticket, options = {}) {
    const { showQR = true, compact = false, showActions = true } = options;

    const card = document.createElement('div');
    card.className = `ticket-card ${compact ? 'ticket-card--compact' : ''} ${ticket.status !== 'valid' ? 'ticket-card--' + ticket.status : ''}`;
    card.dataset.ticketId = ticket.id;

    const statusLabel = getStatusLabel(ticket.status);
    const statusClass = getStatusClass(ticket.status);

    // Format date
    const eventDate = formatTicketDate(ticket.eventDate);

    // Get QR code image (from stored data or fallback)
    const qrImage = ticket.qrCodeImage || ticket.qrCodeUrl || generateQRPlaceholder(ticket.code);

    card.innerHTML = `
        <div class="ticket-card__header">
            <span class="ticket-card__code">${ticket.code}</span>
            <span class="ticket-card__status ticket-card__status--${statusClass}">
                ${statusLabel}
            </span>
        </div>

        <div class="ticket-card__body">
            <h3 class="ticket-card__event">${ticket.eventTitle || 'Event'}</h3>
            <p class="ticket-card__vendor">${ticket.vendorName || ''}</p>

            <div class="ticket-card__details">
                <div class="ticket-card__detail">
                    <span class="ticket-card__label">Date</span>
                    <span class="ticket-card__value">${eventDate}</span>
                </div>
                <div class="ticket-card__detail">
                    <span class="ticket-card__label">Time</span>
                    <span class="ticket-card__value">${ticket.eventTime || ticket.startTime || '-'}</span>
                </div>
                ${ticket.locationName ? `
                <div class="ticket-card__detail ticket-card__detail--full">
                    <span class="ticket-card__label">Location</span>
                    <span class="ticket-card__value">${ticket.locationName}</span>
                </div>
                ` : ''}
                ${ticket.totalTickets > 1 ? `
                <div class="ticket-card__detail">
                    <span class="ticket-card__label">Ticket</span>
                    <span class="ticket-card__value">${ticket.ticketNumber} of ${ticket.totalTickets}</span>
                </div>
                ` : ''}
            </div>

            <p class="ticket-card__holder">
                <strong>Holder:</strong> ${ticket.holderName || '-'}
            </p>
        </div>

        ${showQR ? `
        <div class="ticket-card__qr">
            <img src="${qrImage}" alt="QR Code for ${ticket.code}" loading="lazy">
        </div>
        ` : ''}

        ${showActions && ticket.status === 'valid' ? `
        <div class="ticket-card__footer">
            <button class="btn btn-outline btn-sm ticket-download-btn" data-ticket-id="${ticket.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
            </button>
        </div>
        ` : ''}
    `;

    // Add download handler
    const downloadBtn = card.querySelector('.ticket-download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => handleDownload(ticket));
    }

    return card;
}

/**
 * Create a compact ticket list item
 * @param {Object} ticket - Ticket data
 * @returns {HTMLElement} Ticket list item
 */
export function createTicketListItem(ticket) {
    const item = document.createElement('div');
    item.className = 'ticket-list-item';
    item.dataset.ticketId = ticket.id;

    const eventDate = formatTicketDate(ticket.eventDate);
    const statusClass = getStatusClass(ticket.status);

    item.innerHTML = `
        <div class="ticket-list-item__info">
            <span class="ticket-list-item__code">${ticket.code}</span>
            <span class="ticket-list-item__event">${ticket.eventTitle}</span>
            <span class="ticket-list-item__date">${eventDate}</span>
        </div>
        <span class="badge badge--${statusClass}">${ticket.status}</span>
    `;

    return item;
}

/**
 * Get status display label
 * @param {string} status - Ticket status
 * @returns {string} Display label
 */
function getStatusLabel(status) {
    switch (status) {
        case 'valid': return 'Valid';
        case 'used': return 'Used';
        case 'cancelled': return 'Cancelled';
        case 'expired': return 'Expired';
        default: return status;
    }
}

/**
 * Get status CSS class
 * @param {string} status - Ticket status
 * @returns {string} CSS class
 */
function getStatusClass(status) {
    switch (status) {
        case 'valid': return 'success';
        case 'used': return 'default';
        case 'cancelled': return 'error';
        case 'expired': return 'warning';
        default: return 'default';
    }
}

/**
 * Format ticket date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatTicketDate(date) {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Generate placeholder QR code URL
 * @param {string} code - Ticket code
 * @returns {string} QR placeholder URL
 */
function generateQRPlaceholder(code) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`;
}

/**
 * Handle ticket download (print)
 * @param {Object} ticket - Ticket data
 */
function handleDownload(ticket) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const eventDate = formatTicketDate(ticket.eventDate);
    const qrImage = ticket.qrCodeImage || ticket.qrCodeUrl || generateQRPlaceholder(ticket.code);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket - ${ticket.code}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .ticket {
                    border: 2px dashed #ccc;
                    border-radius: 12px;
                    padding: 24px;
                }
                .ticket__header {
                    text-align: center;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 16px;
                    margin-bottom: 16px;
                }
                .ticket__code {
                    font-family: monospace;
                    font-size: 24px;
                    font-weight: bold;
                    letter-spacing: 2px;
                }
                .ticket__event {
                    font-size: 20px;
                    margin: 0 0 8px;
                }
                .ticket__vendor {
                    color: #666;
                    margin: 0;
                }
                .ticket__details {
                    margin: 16px 0;
                }
                .ticket__detail {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .ticket__label { color: #666; }
                .ticket__qr {
                    text-align: center;
                    margin: 24px 0;
                }
                .ticket__qr img {
                    width: 200px;
                    height: 200px;
                }
                .ticket__footer {
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="ticket__header">
                    <div class="ticket__code">${ticket.code}</div>
                </div>
                <h2 class="ticket__event">${ticket.eventTitle}</h2>
                <p class="ticket__vendor">${ticket.vendorName}</p>
                <div class="ticket__details">
                    <div class="ticket__detail">
                        <span class="ticket__label">Date</span>
                        <span>${eventDate}</span>
                    </div>
                    <div class="ticket__detail">
                        <span class="ticket__label">Time</span>
                        <span>${ticket.eventTime || ticket.startTime || '-'}</span>
                    </div>
                    ${ticket.locationName ? `
                    <div class="ticket__detail">
                        <span class="ticket__label">Location</span>
                        <span>${ticket.locationName}</span>
                    </div>
                    ` : ''}
                    <div class="ticket__detail">
                        <span class="ticket__label">Holder</span>
                        <span>${ticket.holderName || '-'}</span>
                    </div>
                </div>
                <div class="ticket__qr">
                    <img src="${qrImage}" alt="QR Code">
                </div>
                <div class="ticket__footer">
                    Present this ticket at the event entrance
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

export default { createTicketCard, createTicketListItem };
