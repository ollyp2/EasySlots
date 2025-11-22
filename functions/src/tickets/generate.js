/**
 * EasySlots - Ticket Generation
 */

import QRCode from 'qrcode';
import crypto from 'crypto';
import { createDocument } from '../utils/firestore.js';

/**
 * Generate a unique ticket code
 * @returns {string} Ticket code
 */
function generateTicketCode() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `ES-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate QR code as data URL
 * @param {string} data - Data to encode
 * @returns {Promise<string>} QR code data URL
 */
async function generateQRCodeDataUrl(data) {
    return await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
}

/**
 * Generate a ticket for a booking
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<string>} Ticket ID
 */
export async function generateTicket(ticketData) {
    const {
        bookingId,
        userId,
        eventId,
        slotId,
        vendorId,
        eventTitle,
        vendorName,
        eventDate,
        eventTime,
        seatId = null
    } = ticketData;

    // Generate unique ticket code
    const code = generateTicketCode();

    // Generate QR code
    const qrData = JSON.stringify({
        code,
        eventId,
        slotId,
        vendorId
    });
    const qrCodeUrl = await generateQRCodeDataUrl(qrData);

    // Create ticket document
    const ticketId = await createDocument('tickets', {
        code,
        bookingId,
        userId,
        eventId,
        slotId,
        vendorId,
        eventTitle,
        vendorName,
        eventDate,
        eventTime,
        seatId,
        qrCodeUrl,
        status: 'valid',
        usedAt: null
    });

    console.log(`Generated ticket ${code} for booking ${bookingId}`);
    return ticketId;
}

export default { generateTicket };
