/**
 * EasySlots - Header Component
 * Renders and manages the site header with auth state
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { logout, getUserProfile } from '../services/auth.js';

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
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <span class="header__user-name" data-user="name">Account</span>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="dropdown-menu" id="user-dropdown" style="display: none;">
                                <div class="dropdown-header" id="dropdown-header">
                                    <span class="dropdown-email" data-user="email"></span>
                                </div>
                                <hr class="dropdown-divider">
                                <a href="/pages/buyer/dashboard.html" class="dropdown-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    My Dashboard
                                </a>
                                <a href="/pages/buyer/bookings.html" class="dropdown-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    My Bookings
                                </a>
                                <a href="/pages/buyer/tickets.html" class="dropdown-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                                    </svg>
                                    My Tickets
                                </a>
                                <a href="/pages/buyer/profile.html" class="dropdown-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                    Settings
                                </a>
                                <div class="dropdown-seller-section" data-role="seller" style="display: none;">
                                    <hr class="dropdown-divider">
                                    <a href="/pages/seller/dashboard.html" class="dropdown-item dropdown-item--highlight">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                        Seller Dashboard
                                    </a>
                                </div>
                                <hr class="dropdown-divider">
                                <button class="dropdown-item dropdown-item--danger" id="logout-btn">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    Sign Out
                                </button>
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
            <div class="mobile-menu__user" data-auth="required" style="display: none;">
                <a href="/pages/buyer/dashboard.html" class="mobile-menu__link">My Dashboard</a>
                <a href="/pages/buyer/bookings.html" class="mobile-menu__link">My Bookings</a>
                <a href="/pages/buyer/tickets.html" class="mobile-menu__link">My Tickets</a>
                <div data-role="seller" style="display: none;">
                    <a href="/pages/seller/dashboard.html" class="mobile-menu__link mobile-menu__link--highlight">Seller Dashboard</a>
                </div>
                <button class="btn btn-ghost btn-block" id="mobile-logout-btn">Sign Out</button>
            </div>
        </div>
    `;
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

        const nameElements = headerEl.querySelectorAll('[data-user="name"]');
        nameElements.forEach(el => {
            el.textContent = displayName;
        });

        const emailElements = headerEl.querySelectorAll('[data-user="email"]');
        emailElements.forEach(el => {
            el.textContent = email;
        });

        // Update avatar with photo or initial
        const avatarEl = headerEl.querySelector('#user-avatar');
        if (avatarEl && currentUser.photoURL) {
            avatarEl.innerHTML = `<img src="${currentUser.photoURL}" alt="${displayName}" class="header__avatar-img">`;
        }

        // Show seller section if user is a vendor
        const sellerElements = headerEl.querySelectorAll('[data-role="seller"]');
        const isSeller = userProfile?.role === 'vendor';
        sellerElements.forEach(el => {
            el.style.display = isSeller ? '' : 'none';
        });
    }
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

    // Logout buttons
    const logoutBtn = headerEl.querySelector('#logout-btn');
    const mobileLogoutBtn = headerEl.querySelector('#mobile-logout-btn');

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', handleLogout);
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
