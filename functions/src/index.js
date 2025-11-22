/**
 * EasySlots - Firebase Cloud Functions
 * Main entry point
 */

// Stripe functions
export { createCheckoutSession } from './stripe/createCheckout.js';
export { getCheckoutSession } from './stripe/getSession.js';
export { handleStripeWebhook } from './stripe/webhook.js';
export { createConnectAccount, createConnectAccountLink } from './stripe/connect.js';

// Email functions
export { sendBookingConfirmation } from './email/sendConfirmation.js';
export { sendTicketEmail } from './email/sendTickets.js';

// Ticket functions
export { generateTicketsOnBookingConfirm, generateTicket } from './tickets/generate.js';
export { validateTicketCode } from './tickets/validate.js';
