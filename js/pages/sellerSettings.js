/**
 * EasySeats - Seller Settings Page
 * Handles vendor settings and theme selection
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile } from '../services/auth.js';
import { setSellerTheme, getThemeSettings, ensureSellerMode } from '../utils/sellerMode.js';
import { renderSidebar } from '../components/sidebar.js';
import { showToast } from '../utils/toast.js';

let currentUser = null;
let userProfile = null;

/**
 * Initialize the seller settings page
 */
async function initSellerSettings() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/pages/auth/login.html';
            return;
        }

        currentUser = user;
        userProfile = await getUserProfile(user.uid);

        // Check if user is a vendor
        if (userProfile?.role !== 'vendor') {
            window.location.href = '/pages/buyer/dashboard.html';
            return;
        }

        // Ensure seller mode is active
        await ensureSellerMode();

        // Render sidebar
        await renderSidebar();

        // Setup theme selector
        setupThemeSelector();

        // Setup form submission (placeholder for future)
        setupFormSubmission();
    });
}

/**
 * Setup theme selector
 */
function setupThemeSelector() {
    const themeSelector = document.getElementById('seller-theme-selector');
    if (!themeSelector) return;

    const themeOptions = themeSelector.querySelectorAll('.theme-option');
    const { sellerTheme } = getThemeSettings();

    // Set initial active state
    themeOptions.forEach(option => {
        const theme = option.dataset.theme;
        if (theme === sellerTheme || (sellerTheme === 'default' && theme === 'default')) {
            option.classList.add('active');
        }

        // Add click handler
        option.addEventListener('click', () => {
            // Remove active from all
            themeOptions.forEach(opt => opt.classList.remove('active'));
            // Add active to clicked
            option.classList.add('active');

            // Apply theme
            const selectedTheme = option.dataset.theme;
            if (selectedTheme === 'default') {
                setSellerTheme(null); // Reset to default
            } else {
                setSellerTheme(selectedTheme);
            }

            showToast('Seller theme updated!', 'success');
        });
    });
}

/**
 * Setup form submission handler (placeholder)
 */
function setupFormSubmission() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const formData = {
            businessName: document.getElementById('business-name')?.value?.trim() || '',
            businessDescription: document.getElementById('business-description')?.value?.trim() || '',
            contactEmail: document.getElementById('contact-email')?.value?.trim() || '',
            contactPhone: document.getElementById('contact-phone')?.value?.trim() || '',
            website: document.getElementById('website')?.value?.trim() || '',
            defaultAddress: document.getElementById('default-address')?.value?.trim() || '',
            defaultCity: document.getElementById('default-city')?.value?.trim() || '',
            defaultPostal: document.getElementById('default-postal')?.value?.trim() || '',
            cancellationPolicy: document.getElementById('cancellation-policy')?.value || 'flexible',
            autoConfirm: document.getElementById('auto-confirm')?.checked || false
        };

        // TODO: Save to Firestore
        console.log('Settings to save:', formData);

        showToast('Settings saved successfully!', 'success');
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initSellerSettings);
