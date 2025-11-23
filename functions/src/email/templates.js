/**
 * EasySeats - Email Templates
 * HTML templates for transactional emails
 */

/**
 * Booking confirmation email template
 * @param {Object} booking - Booking data
 * @param {Array} tickets - Tickets array
 * @returns {Object} Email subject and HTML
 */
export function bookingConfirmationEmail(booking, tickets = []) {
    const ticketsList = tickets.map(t => `
        <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; text-align: center;">
            <strong style="font-family: monospace; font-size: 18px; color: #4A90A4;">${t.code}</strong><br>
            <span style="color: #666; font-size: 14px;">Holder: ${t.holderName || booking.customerName || '-'}</span>
        </div>
    `).join('');

    const eventDate = formatDate(booking.date || booking.eventDate);
    const eventTime = booking.eventTime || `${booking.startTime || ''} - ${booking.endTime || ''}`;
    const totalPrice = typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : (booking.totalPrice || '0.00');

    return {
        subject: `Booking Confirmed - ${booking.eventTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #4A90A4; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi ${booking.customerName || booking.customerInfo?.name || 'there'},
                            </p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Great news! Your booking has been confirmed. Here are your details:
                            </p>

                            <h2 style="color: #333; margin: 0 0 15px; font-size: 22px;">${booking.eventTitle}</h2>

                            <table width="100%" style="background-color: #f9f9f9; border-radius: 8px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Date & Time</span><br>
                                        <strong style="color: #333333; font-size: 16px;">${eventDate} at ${eventTime}</strong>
                                    </td>
                                </tr>
                                ${booking.locationName ? `
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Location</span><br>
                                        <strong style="color: #333333; font-size: 16px;">${booking.locationName}</strong>
                                    </td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Vendor</span><br>
                                        <strong style="color: #333333; font-size: 16px;">${booking.vendorName || 'Event Host'}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Quantity</span><br>
                                        <strong style="color: #333333; font-size: 16px;">${booking.quantity} ticket(s)</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Total Paid</span><br>
                                        <strong style="color: #4A90A4; font-size: 20px;">€${totalPrice}</strong>
                                    </td>
                                </tr>
                            </table>

                            ${tickets.length > 0 ? `
                            <h3 style="color: #333; margin: 25px 0 15px; font-size: 18px;">Your Tickets</h3>
                            ${ticketsList}
                            ` : ''}

                            <p style="margin: 30px 0 20px; text-align: center;">
                                <a href="https://easyseats-27784.web.app/pages/buyer/tickets.html"
                                   style="display: inline-block; background-color: #4A90A4; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                    View Tickets with QR Codes
                                </a>
                            </p>

                            <p style="color: #666; font-size: 14px; margin: 20px 0 0; padding-top: 20px; border-top: 1px solid #eee;">
                                📱 Show your QR code at the venue for entry.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 25px; text-align: center;">
                            <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
                                Thank you for booking with EasySeats!
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                Questions? Reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };
}

/**
 * Vendor new booking notification email
 * @param {Object} booking - Booking data
 * @param {Object} vendor - Vendor data
 * @returns {Object} Email subject and HTML
 */
export function vendorNewBookingEmail(booking, vendor) {
    const eventDate = formatDate(booking.date || booking.eventDate);
    const eventTime = booking.eventTime || `${booking.startTime || ''} - ${booking.endTime || ''}`;
    const revenue = (booking.totalPrice || 0) - (booking.serviceFee || 0);

    return {
        subject: `New Booking! ${booking.eventTitle} - ${booking.customerName || 'Customer'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background-color: #F5A623; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎫 New Booking Received!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi ${vendor.businessName || vendor.displayName || 'there'},
                            </p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                You have a new booking! Here are the details:
                            </p>

                            <table width="100%" style="margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 12px 15px; background: #f9f9f9; border-radius: 4px; margin-bottom: 8px;">
                                        <strong>Event:</strong> ${booking.eventTitle}
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 15px; background: #f9f9f9; border-radius: 4px;">
                                        <strong>Date:</strong> ${eventDate} at ${eventTime}
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 15px; background: #f9f9f9; border-radius: 4px;">
                                        <strong>Customer:</strong> ${booking.customerName || booking.customerInfo?.name || '-'}
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 15px; background: #f9f9f9; border-radius: 4px;">
                                        <strong>Email:</strong> ${booking.customerEmail || booking.customerInfo?.email || '-'}
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 15px; background: #f9f9f9; border-radius: 4px;">
                                        <strong>Quantity:</strong> ${booking.quantity} ticket(s)
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 15px; background: #e8f5e9; border-radius: 4px;">
                                        <strong>Your Revenue:</strong> €${revenue.toFixed(2)}
                                    </td>
                                </tr>
                                ${booking.notes ? `
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 15px; background: #fff3e0; border-radius: 4px;">
                                        <strong>Customer Notes:</strong> ${booking.notes}
                                    </td>
                                </tr>
                                ` : ''}
                            </table>

                            <p style="margin: 30px 0 0; text-align: center;">
                                <a href="https://easyseats-27784.web.app/pages/seller/bookings.html"
                                   style="display: inline-block; background-color: #4A90A4; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600;">
                                    View All Bookings
                                </a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };
}

/**
 * Booking cancellation email template
 * @param {Object} booking - Booking data
 * @param {boolean} isVendor - Whether recipient is vendor
 * @returns {Object} Email subject and HTML
 */
export function cancellationEmail(booking, isVendor = false) {
    const eventDate = formatDate(booking.date || booking.eventDate);
    const eventTime = booking.eventTime || `${booking.startTime || ''} - ${booking.endTime || ''}`;
    const recipientName = isVendor ? (booking.vendorName || 'Vendor') : (booking.customerName || booking.customerInfo?.name || 'Customer');

    return {
        subject: `Booking Cancelled - ${booking.eventTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background-color: #e74c3c; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Booking Cancelled</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi ${recipientName},
                            </p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                ${isVendor ? 'A booking for your event has been cancelled.' : 'Your booking has been cancelled.'}
                            </p>

                            <table width="100%" style="background-color: #f9f9f9; border-radius: 8px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Event</span><br>
                                        <strong style="color: #333333; font-size: 16px;">${booking.eventTitle}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Date & Time</span><br>
                                        <strong style="color: #333333; font-size: 16px;">${eventDate} at ${eventTime}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Booking ID</span><br>
                                        <strong style="color: #333333; font-size: 14px; font-family: monospace;">${booking.id || '-'}</strong>
                                    </td>
                                </tr>
                            </table>

                            ${booking.cancellationReason ? `
                            <p style="color: #666; font-size: 14px; margin: 0 0 20px;">
                                <strong>Reason:</strong> ${booking.cancellationReason}
                            </p>
                            ` : ''}

                            ${!isVendor ? `
                            <p style="color: #666; font-size: 14px; margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 4px;">
                                💳 If you were charged, a refund will be processed within 5-10 business days.
                            </p>

                            <p style="margin: 30px 0 0; text-align: center;">
                                <a href="https://easyseats-27784.web.app/pages/events/index.html"
                                   style="display: inline-block; background-color: #4A90A4; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600;">
                                    Browse Other Events
                                </a>
                            </p>
                            ` : ''}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };
}

/**
 * Ticket email template (with QR codes)
 * @param {Object} data - Template data
 * @returns {Object} Email subject and HTML
 */
export function ticketEmail({ tickets, eventTitle, customerName }) {
    const ticketCards = tickets.map(ticket => `
        <div style="background: #fff; border: 2px dashed #4A90A4; border-radius: 12px; padding: 20px; margin: 15px 0; text-align: center;">
            <h3 style="color: #333; margin: 0 0 10px; font-size: 18px;">${eventTitle}</h3>
            <p style="color: #666; font-size: 14px; margin: 0 0 15px;">
                ${formatDate(ticket.eventDate)} at ${ticket.eventTime || ticket.startTime || '-'}
            </p>
            ${ticket.qrCodeImage ? `
            <img src="${ticket.qrCodeImage}" alt="Ticket QR Code" style="width: 180px; height: 180px; margin: 10px 0;">
            ` : ''}
            <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #4A90A4; margin: 10px 0 0; letter-spacing: 2px;">
                ${ticket.code}
            </p>
        </div>
    `).join('');

    return {
        subject: `Your Tickets - ${eventTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #4A90A4; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 28px;">🎫 Your Tickets</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 0 0 30px; font-size: 16px;">
                                Hi ${customerName || 'there'}! Show these QR codes at the event entrance.
                            </p>
                            ${ticketCards}
                            <p style="color: rgba(255,255,255,0.8); margin: 30px 0 0; font-size: 14px;">
                                You can also view your tickets anytime at<br>
                                <a href="https://easyseats-27784.web.app/pages/buyer/tickets.html" style="color: #fff;">easyseats.app/tickets</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Legacy exports for backward compatibility
export function getConfirmationTemplate(data) {
    return bookingConfirmationEmail(data, []).html;
}

export function getTicketEmailTemplate(data) {
    return ticketEmail(data).html;
}

export default {
    bookingConfirmationEmail,
    vendorNewBookingEmail,
    cancellationEmail,
    ticketEmail,
    getConfirmationTemplate,
    getTicketEmailTemplate
};
