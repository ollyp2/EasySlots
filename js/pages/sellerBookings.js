/**
 * EasySlots - Seller Bookings Page
 */

import { requireSeller } from '../utils/authGuard.js';
import { renderSidebar } from '../components/sidebar.js';

async function init() {
    // Require seller access
    const hasAccess = await requireSeller();
    if (!hasAccess) return;

    // Render sidebar (dynamic based on mode)
    await renderSidebar();

    // TODO: Implement seller bookings functionality
    console.log('Seller bookings page loaded');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
