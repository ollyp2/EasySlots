/**
 * EasySeats - Sidebar Navigation Component
 * Renders consistent navigation based on user role and mode
 */

import { auth } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';
import { isSellerModeEnabled } from '../utils/sellerMode.js';

// SVG Icons (Feather Icons style)
export const ICONS = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    ticket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>`,
    events: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path></svg>`,
    scanner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10"></rect></svg>`,
    dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};

// Navigation configurations
export const BUYER_NAV = [
    { href: '/pages/buyer/dashboard.html', icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/pages/buyer/bookings.html', icon: 'calendar', label: 'My Bookings', key: 'bookings' },
    { href: '/pages/buyer/tickets.html', icon: 'ticket', label: 'My Tickets', key: 'tickets' },
    { href: '/pages/buyer/profile.html', icon: 'settings', label: 'Settings', key: 'settings' }
];

export const SELLER_NAV = [
    { href: '/pages/seller/dashboard.html', icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/pages/seller/events/index.html', icon: 'events', label: 'My Events', key: 'events' },
    { href: '/pages/seller/bookings.html', icon: 'calendar', label: 'Bookings', key: 'bookings' },
    { href: '/pages/seller/scanner.html', icon: 'scanner', label: 'Scanner', key: 'scanner' },
    { href: '/pages/seller/payouts.html', icon: 'dollar', label: 'Payouts', key: 'payouts' },
    { href: '/pages/seller/settings.html', icon: 'settings', label: 'Settings', key: 'settings' }
];

/**
 * Get icon SVG by name
 * @param {string} name - Icon name
 * @returns {string} SVG markup
 */
export function getIcon(name) {
    return ICONS[name] || '';
}

/**
 * Determine the active page key from the current URL
 * @returns {string} Active page key
 */
function getActivePageFromUrl() {
    const path = window.location.pathname;

    // Buyer pages
    if (path.includes('/buyer/dashboard')) return 'dashboard';
    if (path.includes('/buyer/bookings')) return 'bookings';
    if (path.includes('/buyer/tickets')) return 'tickets';
    if (path.includes('/buyer/profile')) return 'settings';

    // Seller pages
    if (path.includes('/seller/dashboard')) return 'dashboard';
    if (path.includes('/seller/events')) return 'events';
    if (path.includes('/seller/bookings')) return 'bookings';
    if (path.includes('/seller/scanner')) return 'scanner';
    if (path.includes('/seller/payouts')) return 'payouts';
    if (path.includes('/seller/settings')) return 'settings';

    return '';
}

/**
 * Render a single sidebar link
 * @param {Object} item - Navigation item
 * @param {string} activePage - Currently active page key
 * @returns {string} HTML for the link
 */
function renderSidebarLink(item, activePage) {
    const isActive = activePage === item.key;
    const activeClass = isActive ? 'dashboard-nav__item--active' : '';

    return `
        <a href="${item.href}" class="dashboard-nav__item ${activeClass}">
            ${ICONS[item.icon] || ''}
            ${item.label}
        </a>
    `;
}

/**
 * Get navigation items for current mode
 * @param {boolean} sellerMode - Whether seller mode is active
 * @returns {Array} Navigation items
 */
export function getNavItems(sellerMode) {
    return sellerMode ? SELLER_NAV : BUYER_NAV;
}

/**
 * Render the sidebar navigation
 * @param {string} containerId - ID of the container element (optional)
 * @param {string} activePage - Active page key (optional, auto-detected from URL)
 */
export async function renderSidebar(containerId, activePage) {
    // Find the container
    let container;
    if (containerId) {
        container = document.getElementById(containerId);
    }
    if (!container) {
        container = document.querySelector('.dashboard-nav');
    }
    if (!container) return;

    // Get current user and profile
    const user = auth.currentUser;
    if (!user) return;

    const profile = await getUserProfile(user.uid);
    const isVendor = profile?.role === 'vendor';
    const sellerModeOn = isVendor && isSellerModeEnabled();

    // Auto-detect active page if not provided
    if (!activePage) {
        activePage = getActivePageFromUrl();
    }

    // Select navigation based on mode
    const navItems = sellerModeOn ? SELLER_NAV : BUYER_NAV;

    // Render the navigation
    const html = navItems.map(item => renderSidebarLink(item, activePage)).join('');
    container.innerHTML = html;
}

/**
 * Initialize sidebar with auth state listener
 */
export function initSidebar() {
    if (auth.currentUser) {
        renderSidebar();
    }

    window.addEventListener('sellerModeChanged', () => {
        renderSidebar();
    });
}

export default {
    ICONS,
    BUYER_NAV,
    SELLER_NAV,
    getIcon,
    getNavItems,
    renderSidebar,
    initSidebar
};
