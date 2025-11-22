/**
 * EasySlots - Booking Confirmation Email Trigger
 * Sends confirmation email when booking status changes to 'confirmed'
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendEmail } from './sendgrid.js';
import { bookingConfirmationEmail, vendorNewBookingEmail } from './templates.js';
import { db, FieldValue, getDocument } from '../utils/firestore.js';

/**
 * Firestore trigger: Send booking confirmation email when status changes to 'confirmed'
 */
export const sendBookingConfirmationEmail = onDocumentUpdated(
    'bookings/{bookingId}',
    async (event) => {
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();
        const bookingId = event.params.bookingId;

        // Only send when status changes to 'confirmed'
        if (beforeData.status === 'confirmed' || afterData.status !== 'confirmed') {
            return null;
        }

        // Don't send if already sent
        if (afterData.confirmationEmailSent) {
            console.log(`Confirmation email already sent for booking ${bookingId}`);
            return null;
        }

        console.log(`Sending confirmation email for booking ${bookingId}`);

        try {
            // Wait a moment for tickets to be generated
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get tickets for this booking
            const ticketsSnapshot = await db.collection('tickets')
                .where('bookingId', '==', bookingId)
                .get();

            const tickets = ticketsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Get customer email
            const customerEmail = afterData.customerEmail ||
                afterData.customerInfo?.email;

            if (!customerEmail) {
                console.error(`No customer email found for booking ${bookingId}`);
                return null;
            }

            // Send confirmation to customer
            const customerEmailContent = bookingConfirmationEmail(
                { id: bookingId, ...afterData },
                tickets
            );

            await sendEmail({
                to: customerEmail,
                subject: customerEmailContent.subject,
                html: customerEmailContent.html
            });

            console.log(`Customer confirmation email sent to ${customerEmail}`);

            // Send notification to vendor
            await sendVendorNotification(bookingId, afterData);

            // Mark email as sent
            await event.data.after.ref.update({
                confirmationEmailSent: true,
                confirmationEmailSentAt: FieldValue.serverTimestamp()
            });

            console.log(`Confirmation emails completed for booking ${bookingId}`);
            return null;
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            return null;
        }
    }
);

/**
 * Send notification email to vendor
 * @param {string} bookingId - Booking ID
 * @param {Object} booking - Booking data
 */
async function sendVendorNotification(bookingId, booking) {
    try {
        if (!booking.vendorId) {
            console.log('No vendor ID, skipping vendor notification');
            return;
        }

        // Get vendor info
        const vendor = await getDocument('users', booking.vendorId);
        if (!vendor || !vendor.email) {
            console.log('Vendor not found or no email');
            return;
        }

        const vendorEmailContent = vendorNewBookingEmail(
            { id: bookingId, ...booking },
            vendor
        );

        await sendEmail({
            to: vendor.email,
            subject: vendorEmailContent.subject,
            html: vendorEmailContent.html
        });

        console.log(`Vendor notification sent to ${vendor.email}`);
    } catch (error) {
        console.error('Error sending vendor notification:', error);
        // Don't throw - vendor notification failure shouldn't affect customer flow
    }
}

/**
 * Manual function to send booking confirmation (for webhook use)
 * @param {Object} data - Email data
 */
export async function sendBookingConfirmation(data) {
    const { email, bookingId, eventTitle, eventDate, quantity, totalAmount } = data;

    try {
        const booking = {
            eventTitle,
            date: eventDate,
            quantity,
            totalPrice: totalAmount
        };

        const emailContent = bookingConfirmationEmail(booking, []);

        await sendEmail({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html
        });

        console.log(`Manual confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending manual confirmation email:', error);
        // Don't throw - email failure shouldn't fail the booking
    }
}

export default { sendBookingConfirmationEmail, sendBookingConfirmation };
