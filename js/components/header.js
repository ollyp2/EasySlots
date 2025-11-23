/**
 * EasySlots - Header Component
 * Renders and manages the site header with auth state and seller mode toggle
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { logout, getUserProfile } from '../services/auth.js';
import { isSellerModeEnabled, setSellerMode } from '../utils/sellerMode.js';

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
                    <span>EasySlots</span>
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
                                <div class="header__avatar" id="user-avatar">
                                    <span class="header__avatar-icon" id="avatar-icon"></span>
                                </div>
                                <span class="header__user-name" data-user="name">Account</span>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
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
        // SELLER MENU
        html += `
            <a href="/pages/seller/dashboard.html" class="dropdown-item">
                <span class="dropdown-icon">📊</span>
                Seller Dashboard
            </a>
            <a href="/pages/seller/events/index.html" class="dropdown-item">
                <span class="dropdown-icon">🎪</span>
                My Events
            </a>
            <a href="/pages/seller/bookings.html" class="dropdown-item">
                <span class="dropdown-icon">📅</span>
                Bookings
            </a>
            <a href="/pages/seller/scanner.html" class="dropdown-item">
                <span class="dropdown-icon">📱</span>
                Scanner
            </a>
            <a href="/pages/seller/payouts.html" class="dropdown-item">
                <span class="dropdown-icon">💰</span>
                Payouts
            </a>
            <a href="/pages/seller/settings.html" class="dropdown-item">
                <span class="dropdown-icon">⚙️</span>
                Settings
            </a>
        `;
    } else {
        // BUYER MENU
        html += `
            <a href="/pages/buyer/dashboard.html" class="dropdown-item">
                <span class="dropdown-icon">📊</span>
                My Dashboard
            </a>
            <a href="/pages/buyer/bookings.html" class="dropdown-item">
                <span class="dropdown-icon">📅</span>
                My Bookings
            </a>
            <a href="/pages/buyer/tickets.html" class="dropdown-item">
                <span class="dropdown-icon">🎫</span>
                My Tickets
            </a>
        `;
    }

    // Common items
    html += `
        <hr class="dropdown-divider">
        <a href="/pages/buyer/profile.html" class="dropdown-item">
            <span class="dropdown-icon">👤</span>
            Profile
        </a>
        <hr class="dropdown-divider">
        <button class="dropdown-item dropdown-item--danger" id="logout-btn">
            <span class="dropdown-icon">🚪</span>
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
        html += `
            <a href="/pages/seller/dashboard.html" class="mobile-menu__link">📊 Seller Dashboard</a>
            <a href="/pages/seller/events/index.html" class="mobile-menu__link">🎪 My Events</a>
            <a href="/pages/seller/bookings.html" class="mobile-menu__link">📅 Bookings</a>
            <a href="/pages/seller/scanner.html" class="mobile-menu__link">📱 Scanner</a>
            <a href="/pages/seller/payouts.html" class="mobile-menu__link">💰 Payouts</a>
        `;
    } else {
        html += `
            <a href="/pages/buyer/dashboard.html" class="mobile-menu__link">📊 My Dashboard</a>
            <a href="/pages/buyer/bookings.html" class="mobile-menu__link">📅 My Bookings</a>
            <a href="/pages/buyer/tickets.html" class="mobile-menu__link">🎫 My Tickets</a>
        `;
    }

    html += `
        <a href="/pages/buyer/profile.html" class="mobile-menu__link">👤 Profile</a>
        <button class="btn btn-ghost btn-block" id="mobile-logout-btn">🚪 Sign Out</button>
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

        // Update avatar icon based on mode
        const avatarIcon = headerEl.querySelector('#avatar-icon');
        if (avatarIcon) {
            if (currentUser.photoURL) {
                avatarIcon.innerHTML = `<img src="${currentUser.photoURL}" alt="${displayName}" class="header__avatar-img">`;
            } else {
                avatarIcon.textContent = sellerModeOn ? '💰' : '👤';
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
                sellerToggle.addEventListener('change', (e) => {
                    setSellerMode(e.target.checked);
                    window.location.reload();
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
                mobileSellerToggle.addEventListener('change', (e) => {
                    setSellerMode(e.target.checked);
                    window.location.reload();
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
