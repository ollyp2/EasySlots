/**
 * EasySlots - Header Component
 * Renders and manages the site header
 */

import { AppState, isAuthenticated } from '../app.js';
import { logout } from '../services/auth.js';

/**
 * Initialize the header component
 */
export function initHeader() {
    const headerEl = document.getElementById('header');
    if (!headerEl) return;

    headerEl.innerHTML = renderHeader();
    attachHeaderEvents(headerEl);
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
                    <div data-auth="guest">
                        <a href="/pages/auth/login.html" class="btn btn-ghost">Sign In</a>
                        <a href="/pages/auth/register.html" class="btn btn-primary">Get Started</a>
                    </div>
                    <div data-auth="required" style="display: none;">
                        <div class="header__user-menu">
                            <button class="btn btn-ghost" id="user-menu-btn">
                                <span data-user="name">Account</span>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="dropdown-menu" id="user-dropdown" style="display: none;">
                                <a href="/pages/buyer/dashboard.html" class="dropdown-item">My Dashboard</a>
                                <a href="/pages/buyer/bookings.html" class="dropdown-item">My Bookings</a>
                                <a href="/pages/buyer/tickets.html" class="dropdown-item">My Tickets</a>
                                <hr class="dropdown-divider">
                                <a href="/pages/seller/dashboard.html" class="dropdown-item">Vendor Dashboard</a>
                                <hr class="dropdown-divider">
                                <button class="dropdown-item" id="logout-btn">Sign Out</button>
                            </div>
                        </div>
                    </div>
                    <button class="header__menu-btn" id="mobile-menu-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
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
        userMenuBtn.addEventListener('click', () => {
            userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = 'none';
            }
        });
    }

    // Logout button
    const logoutBtn = headerEl.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
            window.location.href = '/';
        });
    }

    // Mobile menu toggle
    const mobileMenuBtn = headerEl.querySelector('#mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            // Toggle mobile menu (implement mobile menu component)
            console.log('Mobile menu clicked');
        });
    }
}

export default { initHeader };
