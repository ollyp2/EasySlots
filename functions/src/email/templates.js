/**
 * EasySlots - Email Templates
 */

/**
 * Get booking confirmation email template
 * @param {Object} data - Template data
 * @returns {string} HTML email content
 */
export function getConfirmationTemplate({ bookingId, eventTitle, eventDate, quantity, totalAmount }) {
    const formattedDate = new Date(eventDate).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
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
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #4A90A4; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Thank you for your booking! Here are your details:
                            </p>

                            <table width="100%" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        <p style="margin: 0; color: #666666; font-size: 14px;">Event</p>
                                        <p style="margin: 5px 0 0; color: #333333; font-size: 18px; font-weight: 600;">${eventTitle}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        <p style="margin: 0; color: #666666; font-size: 14px;">Date</p>
                                        <p style="margin: 5px 0 0; color: #333333; font-size: 16px;">${formattedDate}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        <p style="margin: 0; color: #666666; font-size: 14px;">Quantity</p>
                                        <p style="margin: 5px 0 0; color: #333333; font-size: 16px;">${quantity} ticket(s)</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        <p style="margin: 0; color: #666666; font-size: 14px;">Total</p>
                                        <p style="margin: 5px 0 0; color: #333333; font-size: 18px; font-weight: 600;">€${totalAmount.toFixed(2)}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #666666; font-size: 14px; margin: 0 0 20px;">
                                Booking ID: <strong>${bookingId}</strong>
                            </p>

                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Your tickets have been sent in a separate email. You can also view them in your account.
                            </p>

                            <a href="https://easyslots.app/pages/buyer/tickets.html" style="display: inline-block; background-color: #4A90A4; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                                View My Tickets
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px; text-align: center;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} EasySlots. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Get ticket email template
 * @param {Object} data - Template data
 * @returns {string} HTML email content
 */
export function getTicketEmailTemplate({ tickets, eventTitle }) {
    const ticketHTML = tickets.map(ticket => `
        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #333333; margin: 0 0 10px;">${eventTitle}</h3>
            <p style="color: #666666; font-size: 14px; margin: 0 0 15px;">
                ${new Date(ticket.eventDate).toLocaleDateString('de-DE')} at ${ticket.eventTime}
            </p>
            <img src="${ticket.qrCodeUrl}" alt="Ticket QR Code" style="width: 150px; height: 150px; margin-bottom: 10px;">
            <p style="color: #999999; font-size: 12px; font-family: monospace; margin: 0;">${ticket.code}</p>
        </div>
    `).join('');

    return `
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
                            <h1 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Your Tickets</h1>
                            <p style="color: #ffffff; opacity: 0.9; margin: 0 0 30px;">Show these QR codes at the event entrance</p>
                            ${ticketHTML}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

export default { getConfirmationTemplate, getTicketEmailTemplate };
