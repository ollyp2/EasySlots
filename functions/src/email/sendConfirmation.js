/**
 * EasySlots - Send Booking Confirmation Email
 */

import sgMail from '@sendgrid/mail';
import { defineString } from 'firebase-functions/params';
import { getConfirmationTemplate } from './templates.js';

const sendgridApiKey = defineString('SENDGRID_API_KEY');

/**
 * Send booking confirmation email
 * @param {Object} data - Email data
 */
export async function sendBookingConfirmation(data) {
    const { email, bookingId, eventTitle, eventDate, quantity, totalAmount } = data;

    try {
        sgMail.setApiKey(sendgridApiKey.value());

        const msg = {
            to: email,
            from: {
                email: 'bookings@easyslots.app',
                name: 'EasySlots'
            },
            subject: `Booking Confirmed: ${eventTitle}`,
            html: getConfirmationTemplate({
                bookingId,
                eventTitle,
                eventDate,
                quantity,
                totalAmount
            })
        };

        await sgMail.send(msg);
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't throw - email failure shouldn't fail the booking
    }
}

export default { sendBookingConfirmation };
