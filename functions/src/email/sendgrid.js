/**
 * EasySlots - SendGrid Email Service
 * Handles email sending via SendGrid API
 */

import sgMail from '@sendgrid/mail';
import { defineSecret } from 'firebase-functions/params';

// SendGrid configuration via Firebase secrets
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const SENDER_EMAIL = 'kevin.mario.radtke@outlook.com';
const SENDER_NAME = 'EasySeats';

// Lazy initialization flag
let initialized = false;

/**
 * Initialize SendGrid with API key
 */
function initSendGrid() {
    if (!initialized) {
        sgMail.setApiKey(SENDGRID_API_KEY.value());
        initialized = true;
    }
}

// Export secret for function binding
export { SENDGRID_API_KEY };

/**
 * Send an email via SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail({ to, subject, html, text }) {
    initSendGrid();

    const msg = {
        to: to,
        from: {
            email: SENDER_EMAIL,
            name: SENDER_NAME
        },
        subject: subject,
        html: html,
        text: text || stripHtml(subject)
    };

    try {
        const result = await sgMail.send(msg);
        console.log(`Email sent to ${to}: ${subject}`);
        return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
    } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        throw error;
    }
}

/**
 * Send email with attachments
 * @param {Object} options - Email options with attachments
 */
export async function sendEmailWithAttachments({ to, subject, html, text, attachments }) {
    initSendGrid();

    const msg = {
        to: to,
        from: {
            email: SENDER_EMAIL,
            name: SENDER_NAME
        },
        subject: subject,
        html: html,
        text: text || subject,
        attachments: attachments
    };

    try {
        await sgMail.send(msg);
        console.log(`Email with attachments sent to ${to}: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        throw error;
    }
}

/**
 * Strip HTML tags for plain text version
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export { SENDER_EMAIL, SENDER_NAME };
export default { sendEmail, sendEmailWithAttachments, SENDER_EMAIL, SENDER_NAME };
