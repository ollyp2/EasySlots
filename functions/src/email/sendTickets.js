/**
 * EasySlots - Send Tickets Email
 */

import sgMail from '@sendgrid/mail';
import { defineString } from 'firebase-functions/params';
import { getTicketEmailTemplate } from './templates.js';

const sendgridApiKey = defineString('SENDGRID_API_KEY');

/**
 * Send ticket email with QR codes
 * @param {Object} data - Email data
 */
export async function sendTicketEmail(data) {
    const { email, tickets, eventTitle } = data;

    try {
        sgMail.setApiKey(sendgridApiKey.value());

        const msg = {
            to: email,
            from: {
                email: 'tickets@easyslots.app',
                name: 'EasySlots'
            },
            subject: `Your Tickets: ${eventTitle}`,
            html: getTicketEmailTemplate({ tickets, eventTitle })
        };

        await sgMail.send(msg);
        console.log(`Ticket email sent to ${email}`);
    } catch (error) {
        console.error('Error sending ticket email:', error);
    }
}

export default { sendTicketEmail };
