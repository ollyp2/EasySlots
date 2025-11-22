/**
 * EasySlots - Ticket Generation
 * Handles ticket creation with QR codes
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { db, FieldValue, createDocument, getDocument } from '../utils/firestore.js';

/**
 * Generate a unique ticket code
 * @returns {string} Ticket code (ES-XXXXXXXX format)
 */
function generateTicketCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ES-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate QR code as data URL
 * @param {Object} data - Data to encode in QR
 * @returns {Promise<string>} QR code data URL
 */
async function generateQRCodeDataUrl(data) {
    return await QRCode.toDataURL(JSON.stringify(data), {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
    });
}

/**
 * Firestore trigger: Generate tickets when booking status changes to 'confirmed'
 */
export const generateTicketsOnBookingConfirm = onDocumentUpdated(
    'bookings/{bookingId}',
    async (event) => {
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();
        const bookingId = event.params.bookingId;

        // Only generate if status changed to 'confirmed' and tickets not yet generated
        if (beforeData.status === afterData.status) {
            return null;
        }

        if (afterData.status !== 'confirmed') {
            return null;
        }

        if (afterData.ticketsGenerated) {
            console.log(`Tickets already generated for booking ${bookingId}`);
            return null;
        }

        console.log(`Generating tickets for booking ${bookingId}`);
        await createTicketsForBooking(bookingId, afterData);
        return null;
    }
);

/**
 * Create tickets for a booking
 * @param {string} bookingId - Booking ID
 * @param {Object} booking - Booking data
 */
async function createTicketsForBooking(bookingId, booking) {
    const ticketIds = [];
    const quantity = booking.quantity || 1;

    // Get event details for ticket
    let eventDetails = {};
    if (booking.eventId) {
        const event = await getDocument('events', booking.eventId);
        if (event) {
            eventDetails = {
                locationName: event.location?.name || event.locationName || '',
                locationAddress: event.location?.address || ''
            };
        }
    }

    for (let i = 0; i < quantity; i++) {
        const ticketCode = generateTicketCode();

        // Create QR data
        const qrData = {
            code: ticketCode,
            bookingId: bookingId,
            eventId: booking.eventId,
            vendorId: booking.vendorId,
            ticketIndex: i + 1,
            totalTickets: quantity
        };

        const qrCodeImage = await generateQRCodeDataUrl(qrData);

        // Create ticket document
        const ticketData = {
            code: ticketCode,
            bookingId: bookingId,
            userId: booking.userId,
            vendorId: booking.vendorId,
            eventId: booking.eventId,
            slotId: booking.slotId,

            // Event details
            eventTitle: booking.eventTitle || '',
            eventDate: booking.date || '',
            eventTime: `${booking.startTime || ''} - ${booking.endTime || ''}`,
            startTime: booking.startTime || '',
            endTime: booking.endTime || '',
            vendorName: booking.vendorName || '',
            locationName: eventDetails.locationName || '',
            locationAddress: eventDetails.locationAddress || '',

            // Holder info
            holderName: booking.customerInfo?.name || booking.customerName || '',
            holderEmail: booking.customerInfo?.email || booking.customerEmail || '',

            // QR code
            qrData: JSON.stringify(qrData),
            qrCodeImage: qrCodeImage,

            // Status
            status: 'valid',
            checkedIn: false,
            checkedInAt: null,
            checkedInBy: null,

            // Ticket number for multiple tickets
            ticketNumber: i + 1,
            totalTickets: quantity,

            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        const ticketId = await createDocument('tickets', ticketData);
        ticketIds.push(ticketId);

        console.log(`Created ticket ${ticketCode} (${i + 1}/${quantity}) for booking ${bookingId}`);
    }

    // Update booking with ticket IDs
    await db.collection('bookings').doc(bookingId).update({
        ticketIds: ticketIds,
        ticketsGenerated: true,
        updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`Generated ${ticketIds.length} tickets for booking ${bookingId}`);
    return ticketIds;
}

/**
 * Manual ticket generation (callable function)
 * Used when generating tickets via webhook or manually
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
        holderName = '',
        holderEmail = ''
    } = ticketData;

    const ticketCode = generateTicketCode();

    const qrData = {
        code: ticketCode,
        bookingId,
        eventId,
        vendorId
    };

    const qrCodeImage = await generateQRCodeDataUrl(qrData);

    const ticketId = await createDocument('tickets', {
        code: ticketCode,
        bookingId,
        userId,
        eventId,
        slotId,
        vendorId,
        eventTitle,
        vendorName,
        eventDate,
        eventTime: eventTime || '',
        holderName,
        holderEmail,
        qrData: JSON.stringify(qrData),
        qrCodeImage,
        status: 'valid',
        checkedIn: false,
        checkedInAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`Generated ticket ${ticketCode} for booking ${bookingId}`);
    return ticketId;
}

export default { generateTicketsOnBookingConfirm, generateTicket };
