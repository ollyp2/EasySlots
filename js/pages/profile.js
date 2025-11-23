/**
 * EasySeats - Profile/Settings Page
 * Handles user profile management, vendor mode toggle, dark mode, and dual theme colors
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile, updateUserProfile } from '../services/auth.js';
import {
    isSellerModeEnabled,
    setSellerMode,
    isDarkModeEnabled,
    setDarkMode,
    getBuyerColor,
    setBuyerColor,
    getSellerColor,
    setSellerColor
} from '../utils/sellerMode.js';
import { renderSidebar } from '../components/sidebar.js';
import { showToast } from '../utils/toast.js';

let currentUser = null;
let userProfile = null;

// Default colors
const DEFAULT_BUYER_COLOR = '#4A90A4';
const DEFAULT_SELLER_COLOR = '#28A745';

/**
 * Initialize the profile page
 */
async function initProfile() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/pages/auth/login.html';
            return;
        }

        currentUser = user;
        userProfile = await getUserProfile(user.uid);

        // Render sidebar
        await renderSidebar();

        // Populate form fields
        populateForm();

        // Setup vendor toggle section
        setupVendorSection();

        // Setup theme settings
        setupThemeSettings();

        // Setup form submission
        setupFormSubmission();
    });
}

/**
 * Populate form fields with user data
 */
function populateForm() {
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
}

/**
 * Setup vendor mode section based on user role
 */
function setupVendorSection() {
    const vendorModeSection = document.getElementById('vendor-mode-section');
    const becomeVendorSection = document.getElementById('become-vendor-section');
    const profileSellerToggle = document.getElementById('profile-seller-toggle');
    const toggleLabelText = document.getElementById('toggle-label-text');

    const isVendor = userProfile?.role === 'vendor';

    if (isVendor) {
        if (vendorModeSection) vendorModeSection.style.display = 'block';
        if (becomeVendorSection) becomeVendorSection.style.display = 'none';

        const sellerModeOn = isSellerModeEnabled();
        if (profileSellerToggle) {
            profileSellerToggle.checked = sellerModeOn;
        }
        if (toggleLabelText) {
            toggleLabelText.textContent = sellerModeOn ? 'Seller Mode ON' : 'Seller Mode OFF';
        }

        if (profileSellerToggle) {
            profileSellerToggle.addEventListener('change', async (e) => {
                const enabled = e.target.checked;
                setSellerMode(enabled);

                if (toggleLabelText) {
                    toggleLabelText.textContent = enabled ? 'Seller Mode ON' : 'Seller Mode OFF';
                }

                await renderSidebar();

                showToast(
                    enabled ? 'Seller Mode activated!' : 'Seller Mode deactivated!',
                    enabled ? 'success' : 'info'
                );
            });
        }
    } else {
        if (vendorModeSection) vendorModeSection.style.display = 'none';
        if (becomeVendorSection) becomeVendorSection.style.display = 'block';
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
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('first-name')?.value?.trim() || '';
        const lastName = document.getElementById('last-name')?.value?.trim() || '';
        const phone = document.getElementById('phone')?.value?.trim() || '';

        try {
            await updateUserProfile(currentUser.uid, {
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`.trim(),
                phone,
                updatedAt: new Date()
            });

            showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to save settings. Please try again.', 'error');
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initProfile);
