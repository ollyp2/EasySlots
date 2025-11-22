/**
 * EasySlots - Booking Cancellation Email Trigger
 * Sends cancellation email when booking status changes to 'cancelled'
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendEmail } from './sendgrid.js';
import { cancellationEmail } from './templates.js';
import { db, FieldValue, getDocument } from '../utils/firestore.js';

/**
 * Firestore trigger: Send cancellation email when status changes to 'cancelled'
 */
export const sendCancellationEmail = onDocumentUpdated(
    'bookings/{bookingId}',
    async (event) => {
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();
        const bookingId = event.params.bookingId;

        // Only send when status changes to 'cancelled'
        if (beforeData.status === 'cancelled' || afterData.status !== 'cancelled') {
            return null;
        }

        // Don't send if already sent
        if (afterData.cancellationEmailSent) {
            console.log(`Cancellation email already sent for booking ${bookingId}`);
            return null;
        }

        console.log(`Sending cancellation email for booking ${bookingId}`);

        try {
            // Get customer email
            const customerEmail = afterData.customerEmail ||
                afterData.customerInfo?.email;

            if (!customerEmail) {
                console.error(`No customer email found for booking ${bookingId}`);
                return null;
            }

            // Send cancellation email to customer
            const customerEmailContent = cancellationEmail(
                { id: bookingId, ...afterData },
                false // isVendor = false
            );

            await sendEmail({
                to: customerEmail,
                subject: customerEmailContent.subject,
                html: customerEmailContent.html
            });

            console.log(`Customer cancellation email sent to ${customerEmail}`);

            // Send notification to vendor
            await sendVendorCancellationNotification(bookingId, afterData);

            // Mark email as sent
            await event.data.after.ref.update({
                cancellationEmailSent: true,
                cancellationEmailSentAt: FieldValue.serverTimestamp()
            });

            console.log(`Cancellation emails completed for booking ${bookingId}`);
            return null;
        } catch (error) {
            console.error('Error sending cancellation email:', error);
            return null;
        }
    }
);

/**
 * Send cancellation notification email to vendor
 * @param {string} bookingId - Booking ID
 * @param {Object} booking - Booking data
 */
async function sendVendorCancellationNotification(bookingId, booking) {
    try {
        if (!booking.vendorId) {
            console.log('No vendor ID, skipping vendor cancellation notification');
            return;
        }

        // Get vendor info
        const vendor = await getDocument('users', booking.vendorId);
        if (!vendor || !vendor.email) {
            console.log('Vendor not found or no email');
            return;
        }

        const vendorEmailContent = cancellationEmail(
            { id: bookingId, ...booking },
            true // isVendor = true
        );

        await sendEmail({
            to: vendor.email,
            subject: vendorEmailContent.subject,
            html: vendorEmailContent.html
        });

        console.log(`Vendor cancellation notification sent to ${vendor.email}`);
    } catch (error) {
        console.error('Error sending vendor cancellation notification:', error);
        // Don't throw - vendor notification failure shouldn't affect customer flow
    }
}

export default { sendCancellationEmail };
