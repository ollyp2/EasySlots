/**
 * EasySlots - Booking Cancel Page
 */

function init() {
    // Clear any pending booking data
    sessionStorage.removeItem('pendingBooking');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
