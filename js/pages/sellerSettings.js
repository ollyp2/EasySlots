/**
 * EasySeats - Seller Settings Page
 * Handles vendor settings: personal info, appearance (dual color pickers), business settings
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile, updateUserProfile } from '../services/auth.js';
import {
    isDarkModeEnabled,
    setDarkMode,
    getBuyerColor,
    setBuyerColor,
    getSellerColor,
    setSellerColor,
    ensureSellerMode
} from '../utils/sellerMode.js';
import { renderSidebar } from '../components/sidebar.js';
import { showToast } from '../components/toast.js';

let currentUser = null;
let userProfile = null;

// Default colors
const DEFAULT_BUYER_COLOR = '#4A90A4';
const DEFAULT_SELLER_COLOR = '#28A745';

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

        // Populate form fields
        populateForm();

        // Setup theme settings (dark mode + dual color pickers)
        setupThemeSettings();

        // Setup form submission
        setupFormSubmission();
    });
}

/**
 * Populate form fields with user/business data
 */
function populateForm() {
    // Personal Information
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    if (currentUser) {
        const displayName = userProfile?.displayName || currentUser.displayName || '';
        const nameParts = displayName.split(' ');

        if (firstNameInput) {
            firstNameInput.value = userProfile?.firstName || nameParts[0] || '';
        }
        if (lastNameInput) {
            lastNameInput.value = userProfile?.lastName || nameParts.slice(1).join(' ') || '';
        }
        if (emailInput) {
            emailInput.value = currentUser.email || '';
        }
        if (phoneInput) {
            phoneInput.value = userProfile?.phone || '';
        }
    }

    // Business Information
    const businessNameInput = document.getElementById('business-name');
    const businessDescInput = document.getElementById('business-description');
    const contactEmailInput = document.getElementById('contact-email');
    const contactPhoneInput = document.getElementById('contact-phone');
    const websiteInput = document.getElementById('website');

    if (businessNameInput) {
        businessNameInput.value = userProfile?.businessName || '';
    }
    if (businessDescInput) {
        businessDescInput.value = userProfile?.businessDescription || '';
    }
    if (contactEmailInput) {
        contactEmailInput.value = userProfile?.contactEmail || currentUser?.email || '';
    }
    if (contactPhoneInput) {
        contactPhoneInput.value = userProfile?.contactPhone || userProfile?.phone || '';
    }
    if (websiteInput) {
        websiteInput.value = userProfile?.website || '';
    }

    // Business Location
    const addressInput = document.getElementById('default-address');
    const cityInput = document.getElementById('default-city');
    const postalInput = document.getElementById('default-postal');

    if (addressInput) {
        addressInput.value = userProfile?.defaultAddress || '';
    }
    if (cityInput) {
        cityInput.value = userProfile?.defaultCity || '';
    }
    if (postalInput) {
        postalInput.value = userProfile?.defaultPostal || '';
    }

    // Booking Settings
    const cancellationSelect = document.getElementById('cancellation-policy');
    const autoConfirmToggle = document.getElementById('auto-confirm');

    if (cancellationSelect) {
        cancellationSelect.value = userProfile?.cancellationPolicy || 'flexible';
    }
    if (autoConfirmToggle) {
        autoConfirmToggle.checked = userProfile?.autoConfirm || false;
    }
}

/**
 * Setup theme settings (dark mode, dual color pickers)
 */
function setupThemeSettings() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeLabel = document.getElementById('dark-mode-label');

    if (darkModeToggle) {
        darkModeToggle.checked = isDarkModeEnabled();
        if (darkModeLabel) {
            darkModeLabel.textContent = isDarkModeEnabled() ? 'On' : 'Off';
        }

        darkModeToggle.addEventListener('change', (e) => {
            setDarkMode(e.target.checked);
            if (darkModeLabel) {
                darkModeLabel.textContent = e.target.checked ? 'On' : 'Off';
            }
            showToast(
                e.target.checked ? 'Dark mode enabled' : 'Dark mode disabled',
                'info'
            );
        });
    }

    // Setup Buyer Color Picker
    setupColorPicker('buyer', getBuyerColor(), setBuyerColor, DEFAULT_BUYER_COLOR);

    // Setup Seller Color Picker
    setupColorPicker('seller', getSellerColor(), setSellerColor, DEFAULT_SELLER_COLOR);
}

/**
 * Setup a color picker with presets and custom input
 * @param {string} mode - 'buyer' or 'seller'
 * @param {string} currentColor - Current color value
 * @param {Function} setColorFn - Function to set the color
 * @param {string} defaultColor - Default color value
 */
function setupColorPicker(mode, currentColor, setColorFn, defaultColor) {
    const colorPresets = document.querySelectorAll(`.color-preset[data-mode="${mode}"]`);
    const customColorPicker = document.getElementById(`${mode}-color-picker`);
    const resetColorBtn = document.getElementById(`reset-${mode}-color`);

    // Set custom color picker value
    if (customColorPicker) {
        customColorPicker.value = currentColor || defaultColor;
    }

    // Mark active preset
    colorPresets.forEach(preset => {
        if (preset.dataset.color.toLowerCase() === (currentColor || defaultColor).toLowerCase()) {
            preset.classList.add('active');
        }

        preset.addEventListener('click', () => {
            const color = preset.dataset.color;

            // Update active state for this mode only
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');

            // Apply color
            setColorFn(color);

            // Update custom picker
            if (customColorPicker) {
                customColorPicker.value = color;
            }

            showToast(`${mode === 'buyer' ? 'Buy-Mode' : 'Seller-Mode'} color updated`, 'success');
        });
    });

    // Custom Color Picker
    if (customColorPicker) {
        customColorPicker.addEventListener('change', (e) => {
            const color = e.target.value;

            // Remove active from presets for this mode
            colorPresets.forEach(p => p.classList.remove('active'));

            // Apply color
            setColorFn(color);
            showToast(`Custom ${mode === 'buyer' ? 'Buy-Mode' : 'Seller-Mode'} color applied`, 'success');
        });
    }

    // Reset Color Button
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', () => {
            // Reset to default
            setColorFn(null);

            // Reset UI
            if (customColorPicker) {
                customColorPicker.value = defaultColor;
            }
            colorPresets.forEach(p => {
                p.classList.remove('active');
                if (p.dataset.color === defaultColor) {
                    p.classList.add('active');
                }
            });

            showToast(`${mode === 'buyer' ? 'Buy-Mode' : 'Seller-Mode'} color reset to default`, 'info');
        });
    }
}

/**
 * Setup form submission handler
 */
function setupFormSubmission() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Personal Information
        const firstName = document.getElementById('first-name')?.value?.trim() || '';
        const lastName = document.getElementById('last-name')?.value?.trim() || '';
        const phone = document.getElementById('phone')?.value?.trim() || '';

        // Business Information
        const businessName = document.getElementById('business-name')?.value?.trim() || '';
        const businessDescription = document.getElementById('business-description')?.value?.trim() || '';
        const contactEmail = document.getElementById('contact-email')?.value?.trim() || '';
        const contactPhone = document.getElementById('contact-phone')?.value?.trim() || '';
        const website = document.getElementById('website')?.value?.trim() || '';

        // Business Location
        const defaultAddress = document.getElementById('default-address')?.value?.trim() || '';
        const defaultCity = document.getElementById('default-city')?.value?.trim() || '';
        const defaultPostal = document.getElementById('default-postal')?.value?.trim() || '';

        // Booking Settings
        const cancellationPolicy = document.getElementById('cancellation-policy')?.value || 'flexible';
        const autoConfirm = document.getElementById('auto-confirm')?.checked || false;

        try {
            await updateUserProfile(currentUser.uid, {
                // Personal
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`.trim(),
                phone,
                // Business
                businessName,
                businessDescription,
                contactEmail,
                contactPhone,
                website,
                // Location
                defaultAddress,
                defaultCity,
                defaultPostal,
                // Settings
                cancellationPolicy,
                autoConfirm,
                updatedAt: new Date()
            });

            showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error updating settings:', error);
            showToast('Failed to save settings. Please try again.', 'error');
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initSellerSettings);
