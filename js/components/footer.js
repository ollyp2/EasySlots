/**
 * EasySeats - Footer Component
 * Renders the site footer with dynamic vendor links
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';
import { isSellerModeEnabled, setSellerMode } from '../utils/sellerMode.js';

let currentUser = null;
let userProfile = null;

/**
 * Initialize the footer component
 */
export function initFooter() {
    const footerEl = document.getElementById('footer');
    if (!footerEl) return;

    footerEl.innerHTML = renderFooter();

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            userProfile = await getUserProfile(user.uid);
        } else {
            userProfile = null;
        }
        updateFooterVendorSection(footerEl);
    });

    // Listen for seller mode changes
    window.addEventListener('sellerModeChanged', () => {
        updateFooterVendorSection(footerEl);
    });
}

/**
 * Update the vendor section based on user state
 */
function updateFooterVendorSection(footerEl) {
    const vendorLinksNav = footerEl.querySelector('#footer-vendor-links');
    if (!vendorLinksNav) return;

    const isVendor = userProfile?.role === 'vendor';
    const sellerModeOn = isVendor && isSellerModeEnabled();

    let html = '';

    if (!currentUser) {
        // Not logged in - show register link
        html = `
            <a href="/pages/auth/register.html?role=vendor" class="footer__link">Become a Vendor</a>
            <a href="/pages/seller/dashboard.html" class="footer__link">Vendor Dashboard</a>
        `;
    } else if (isVendor) {
        // Already a vendor - show mode toggle and dashboard
        html = `
            <a href="#" class="footer__link footer__vendor-toggle" id="footer-vendor-toggle">
                ${sellerModeOn ? 'Switch to Buyer Mode' : 'Switch to Seller Mode'}
            </a>
            <a href="/pages/seller/dashboard.html" class="footer__link">Seller Dashboard</a>
        `;
    } else {
        // Logged in as buyer - show upgrade link to profile
        html = `
            <a href="/pages/buyer/profile.html#become-vendor" class="footer__link">Become a Vendor</a>
            <a href="/pages/seller/dashboard.html" class="footer__link">Vendor Dashboard</a>
        `;
    }

    html += `
        <a href="#" class="footer__link">Pricing</a>
        <a href="#" class="footer__link">Help Center</a>
    `;

    vendorLinksNav.innerHTML = html;

    // Attach toggle event
    const toggleLink = vendorLinksNav.querySelector('#footer-vendor-toggle');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const newMode = !isSellerModeEnabled();
            setSellerMode(newMode);
            if (newMode) {
                window.location.href = '/pages/seller/dashboard.html';
            } else {
                window.location.href = '/pages/buyer/dashboard.html';
            }
        });
    }
}

/**
 * Render footer HTML
 * @returns {string} Footer HTML
 */
function renderFooter() {
    const currentYear = new Date().getFullYear();

    return `
        <div class="container">
            <div class="footer__grid">
                <div class="footer__brand">
                    <div class="footer__logo">EasySeats</div>
                    <p class="footer__description">
                        Book amazing events, classes, and experiences from local vendors.
                        Your next adventure is just a click away.
                    </p>
                </div>

                <div class="footer__section">
                    <h4 class="footer__title">Browse</h4>
                    <nav class="footer__links">
                        <a href="/pages/events/index.html" class="footer__link">All Events</a>
                        <a href="/pages/events/index.html?category=fitness" class="footer__link">Fitness</a>
                        <a href="/pages/events/index.html?category=music" class="footer__link">Music</a>
                        <a href="/pages/events/index.html?category=workshop" class="footer__link">Workshops</a>
                        <a href="/pages/events/index.html?category=coaching" class="footer__link">Coaching</a>
                    </nav>
                </div>

                <div class="footer__section">
                    <h4 class="footer__title">For Vendors</h4>
                    <nav class="footer__links" id="footer-vendor-links">
                        <a href="/pages/auth/register.html?role=vendor" class="footer__link">Become a Vendor</a>
                        <a href="/pages/seller/dashboard.html" class="footer__link">Vendor Dashboard</a>
                        <a href="#" class="footer__link">Pricing</a>
                        <a href="#" class="footer__link">Help Center</a>
                    </nav>
                </div>

                <div class="footer__section">
                    <h4 class="footer__title">Company</h4>
                    <nav class="footer__links">
                        <a href="#" class="footer__link">About Us</a>
                        <a href="#" class="footer__link">Contact</a>
                        <a href="#" class="footer__link">Privacy Policy</a>
                        <a href="#" class="footer__link">Terms of Service</a>
                    </nav>
                </div>
            </div>

            <div class="footer__bottom">
                <p class="footer__copyright">
                    &copy; ${currentYear} EasySeats. All rights reserved.
                </p>
                <div class="footer__social">
                    <a href="#" class="footer__social-link" aria-label="Facebook">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                    </a>
                    <a href="#" class="footer__social-link" aria-label="Instagram">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                    </a>
                    <a href="#" class="footer__social-link" aria-label="Twitter">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    `;
}

export default { initFooter };
