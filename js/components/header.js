/**
 * EasySeats - Header Component
 * Renders and manages the site header with auth state and seller mode toggle
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { logout, getUserProfile } from '../services/auth.js';
import { isSellerModeEnabled, setSellerMode } from '../utils/sellerMode.js';
import { getIcon, renderSidebar } from './sidebar.js';

// SVG Icons for header (Feather Icons style)
const HEADER_ICONS = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    ticket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    events: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path></svg>`,
    scanner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10"></rect></svg>`,
    dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    userAvatar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    sellerAvatar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
};

let currentUser = null;
let userProfile = null;

/**
 * Initialize the header component
 */
export function initHeader() {
    const headerEl = document.getElementById('header');
    if (!headerEl) return;

    headerEl.innerHTML = renderHeader();
    attachHeaderEvents(headerEl);

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            userProfile = await getUserProfile(user.uid);
        } else {
            userProfile = null;
        }
        updateHeaderAuthState(headerEl);
    });

    // Listen for seller mode changes
    window.addEventListener('sellerModeChanged', () => {
        updateHeaderAuthState(headerEl);
    });
}

/**
 * Render header HTML
 * @returns {string} Header HTML
 */
function renderHeader() {
    return `
        <div class="container">
            <div class="header__inner">
                <a href="/" class="header__logo">
                    <span>EasySeats</span>
                </a>

                <nav class="header__nav">
                    <a href="/pages/events/index.html" class="header__nav-link">Browse Events</a>
                    <a href="/pages/events/index.html?category=fitness" class="header__nav-link">Fitness</a>
                    <a href="/pages/events/index.html?category=music" class="header__nav-link">Music</a>
                    <a href="/pages/events/index.html?category=workshop" class="header__nav-link">Workshops</a>
                </nav>

                <div class="header__actions">
                    <div class="header__guest-actions" data-auth="guest">
                        <a href="/pages/auth/login.html" class="btn btn-ghost">Sign In</a>
                        <a href="/pages/auth/register.html" class="btn btn-primary">Get Started</a>
                    </div>
                    <div class="header__user-actions" data-auth="required" style="display: none;">
                        <div class="header__user-menu">
                            <button class="header__user-btn" id="user-menu-btn">
                                <span class="header__user-name" data-user="name">Account</span>
                                <div class="header__avatar" id="user-avatar">
                                    <span class="header__avatar-icon" id="avatar-icon"></span>
                                </div>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="dropdown-menu" id="user-dropdown" style="display: none;">
                                <!-- Dropdown content rendered dynamically -->
                            </div>
                        </div>
                    </div>
                    <button class="header__menu-btn" id="mobile-menu-btn" aria-label="Menu">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div class="mobile-menu" id="mobile-menu" style="display: none;">
            <nav class="mobile-menu__nav">
                <a href="/pages/events/index.html" class="mobile-menu__link">Browse Events</a>
                <a href="/pages/events/index.html?category=fitness" class="mobile-menu__link">Fitness</a>
                <a href="/pages/events/index.html?category=music" class="mobile-menu__link">Music</a>
                <a href="/pages/events/index.html?category=workshop" class="mobile-menu__link">Workshops</a>
            </nav>
            <div class="mobile-menu__actions" data-auth="guest">
                <a href="/pages/auth/login.html" class="btn btn-ghost btn-block">Sign In</a>
                <a href="/pages/auth/register.html" class="btn btn-primary btn-block">Get Started</a>
            </div>
            <div class="mobile-menu__user" data-auth="required" style="display: none;" id="mobile-user-menu">
                <!-- Mobile menu content rendered dynamically -->
            </div>
        </div>
    `;
}

/**
 * Render dropdown menu content based on user role and mode
 * @param {boolean} isVendor - Whether user is a vendor
 * @param {boolean} sellerModeOn - Whether seller mode is enabled
 * @returns {string} Dropdown HTML
 */
function renderDropdownContent(isVendor, sellerModeOn) {
    let html = '';

    // Header with email
    html += `
        <div class="dropdown-header">
            <span class="dropdown-email" data-user="email"></span>
            ${isVendor ? `<span class="badge badge--vendor">${sellerModeOn ? 'Seller Mode' : 'Buyer Mode'}</span>` : ''}
        </div>
    `;

    // Seller Mode Toggle (only for vendors)
    if (isVendor) {
        html += `
            <div class="dropdown-item seller-mode-toggle">
                <span>Seller Mode</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="seller-mode-toggle" ${sellerModeOn ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <hr class="dropdown-divider">
        `;
    }

    if (sellerModeOn && isVendor) {
        // SELLER MENU - matches SELLER_NAV in sidebar.js
        html += `
            <a href="/pages/seller/dashboard.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.dashboard}</span>
                Dashboard
            </a>
            <a href="/pages/seller/events/index.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.events}</span>
                My Events
            </a>
            <a href="/pages/seller/bookings.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.calendar}</span>
                Bookings
            </a>
            <a href="/pages/seller/scanner.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.scanner}</span>
                Scanner
            </a>
            <a href="/pages/seller/payouts.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.dollar}</span>
                Payouts
            </a>
            <a href="/pages/seller/settings.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.settings}</span>
                Settings
            </a>
        `;
    } else {
        // BUYER MENU - matches BUYER_NAV in sidebar.js
        html += `
            <a href="/pages/buyer/dashboard.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.dashboard}</span>
                Dashboard
            </a>
            <a href="/pages/buyer/bookings.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.calendar}</span>
                My Bookings
            </a>
            <a href="/pages/buyer/tickets.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.ticket}</span>
                My Tickets
            </a>
            <a href="/pages/buyer/profile.html" class="dropdown-item">
                <span class="dropdown-icon">${HEADER_ICONS.settings}</span>
                Settings
            </a>
        `;
    }

    // Logout (always shown)
    html += `
        <hr class="dropdown-divider">
        <button class="dropdown-item dropdown-item--danger" id="logout-btn">
            <span class="dropdown-icon">${HEADER_ICONS.logout}</span>
            Sign Out
        </button>
    `;

    return html;
}

/**
 * Render mobile menu content based on user role and mode
 * @param {boolean} isVendor - Whether user is a vendor
 * @param {boolean} sellerModeOn - Whether seller mode is enabled
 * @returns {string} Mobile menu HTML
 */
function renderMobileMenuContent(isVendor, sellerModeOn) {
    let html = '';

    // Seller Mode Toggle (only for vendors)
    if (isVendor) {
        html += `
            <div class="mobile-menu__toggle">
                <span>Seller Mode</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="mobile-seller-mode-toggle" ${sellerModeOn ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <hr class="mobile-menu__divider">
        `;
    }

    if (sellerModeOn && isVendor) {
        // SELLER MOBILE MENU - matches SELLER_NAV
        html += `
            <a href="/pages/seller/dashboard.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.dashboard}</span> Dashboard</a>
            <a href="/pages/seller/events/index.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.events}</span> My Events</a>
            <a href="/pages/seller/bookings.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.calendar}</span> Bookings</a>
            <a href="/pages/seller/scanner.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.scanner}</span> Scanner</a>
            <a href="/pages/seller/payouts.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.dollar}</span> Payouts</a>
            <a href="/pages/seller/settings.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.settings}</span> Settings</a>
        `;
    } else {
        // BUYER MOBILE MENU - matches BUYER_NAV
        html += `
            <a href="/pages/buyer/dashboard.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.dashboard}</span> Dashboard</a>
            <a href="/pages/buyer/bookings.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.calendar}</span> My Bookings</a>
            <a href="/pages/buyer/tickets.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.ticket}</span> My Tickets</a>
            <a href="/pages/buyer/profile.html" class="mobile-menu__link"><span class="mobile-menu__icon">${HEADER_ICONS.settings}</span> Settings</a>
        `;
    }

    html += `
        <hr class="mobile-menu__divider">
        <button class="btn btn-ghost btn-block mobile-menu__logout" id="mobile-logout-btn"><span class="mobile-menu__icon">${HEADER_ICONS.logout}</span> Sign Out</button>
    `;

    return html;
}

/**
 * Update header based on auth state
 * @param {HTMLElement} headerEl - Header element
 */
function updateHeaderAuthState(headerEl) {
    // Show/hide auth elements
    const guestElements = headerEl.querySelectorAll('[data-auth="guest"]');
    const authElements = headerEl.querySelectorAll('[data-auth="required"]');

    guestElements.forEach(el => {
        el.style.display = currentUser ? 'none' : '';
    });

    authElements.forEach(el => {
        el.style.display = currentUser ? '' : 'none';
    });

    // Update user info
    if (currentUser) {
        const displayName = userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        const email = currentUser.email || '';
        const isVendor = userProfile?.role === 'vendor';
        const sellerModeOn = isVendor && isSellerModeEnabled();

        // Update name
        const nameElements = headerEl.querySelectorAll('[data-user="name"]');
        nameElements.forEach(el => {
            el.textContent = displayName;
        });

        // Update avatar icon based on mode (SVG icons instead of emojis)
        const avatarIcon = headerEl.querySelector('#avatar-icon');
        if (avatarIcon) {
            if (currentUser.photoURL) {
                avatarIcon.innerHTML = `<img src="${currentUser.photoURL}" alt="${displayName}" class="header__avatar-img">`;
            } else {
                avatarIcon.innerHTML = sellerModeOn ? HEADER_ICONS.sellerAvatar : HEADER_ICONS.userAvatar;
            }
        }

        // Render dropdown content
        const dropdown = headerEl.querySelector('#user-dropdown');
        if (dropdown) {
            dropdown.innerHTML = renderDropdownContent(isVendor, sellerModeOn);

            // Update email in dropdown
            const dropdownEmail = dropdown.querySelector('[data-user="email"]');
            if (dropdownEmail) {
                dropdownEmail.textContent = email;
            }

            // Re-attach logout button event
            const logoutBtn = dropdown.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }

            // Attach seller mode toggle event
            const sellerToggle = dropdown.querySelector('#seller-mode-toggle');
            if (sellerToggle) {
                sellerToggle.addEventListener('change', async (e) => {
                    setSellerMode(e.target.checked);
                    // Re-render sidebar if on a dashboard page
                    const sidebarNav = document.querySelector('.dashboard-nav');
                    if (sidebarNav) {
                        await renderSidebar();
                    }
                    // Update header state (no redirect - user stays on current page)
                    updateHeaderAuthState(headerEl);
                });
            }
        }

        // Render mobile menu content
        const mobileUserMenu = headerEl.querySelector('#mobile-user-menu');
        if (mobileUserMenu) {
            mobileUserMenu.innerHTML = renderMobileMenuContent(isVendor, sellerModeOn);

            // Re-attach mobile logout button event
            const mobileLogoutBtn = mobileUserMenu.querySelector('#mobile-logout-btn');
            if (mobileLogoutBtn) {
                mobileLogoutBtn.addEventListener('click', handleLogout);
            }

            // Attach mobile seller mode toggle event
            const mobileSellerToggle = mobileUserMenu.querySelector('#mobile-seller-mode-toggle');
            if (mobileSellerToggle) {
                mobileSellerToggle.addEventListener('change', async (e) => {
                    setSellerMode(e.target.checked);
                    // Re-render sidebar if on a dashboard page
                    const sidebarNav = document.querySelector('.dashboard-nav');
                    if (sidebarNav) {
                        await renderSidebar();
                    }
                    // Update header state (no redirect - user stays on current page)
                    updateHeaderAuthState(headerEl);
                });
            }
        }
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    await logout();
    window.location.href = '/';
}

/**
 * Attach event listeners to header elements
 * @param {HTMLElement} headerEl - Header element
 */
function attachHeaderEvents(headerEl) {
    // User menu toggle
    const userMenuBtn = headerEl.querySelector('#user-menu-btn');
    const userDropdown = headerEl.querySelector('#user-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = 'none';
            }
        });
    }

    // Mobile menu toggle
    const mobileMenuBtn = headerEl.querySelector('#mobile-menu-btn');
    const mobileMenu = headerEl.querySelector('#mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.style.display !== 'none';
            mobileMenu.style.display = isOpen ? 'none' : 'block';
            mobileMenuBtn.setAttribute('aria-expanded', !isOpen);
        });
    }
}

export default { initHeader };
