/**
 * EasySeats - Profile/Settings Page
 * Handles user profile management, vendor mode toggle, dark mode, and theme colors
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile, updateUserProfile } from '../services/auth.js';
import { isSellerModeEnabled, setSellerMode, isDarkModeEnabled, setDarkMode, getCustomColor, setCustomColor } from '../utils/sellerMode.js';
import { renderSidebar } from '../components/sidebar.js';
import { showToast } from '../utils/toast.js';

let currentUser = null;
let userProfile = null;

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
        // Split display name into first/last
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
        // Show vendor mode toggle, hide become vendor section
        if (vendorModeSection) vendorModeSection.style.display = 'block';
        if (becomeVendorSection) becomeVendorSection.style.display = 'none';

        // Set initial toggle state
        const sellerModeOn = isSellerModeEnabled();
        if (profileSellerToggle) {
            profileSellerToggle.checked = sellerModeOn;
        }
        if (toggleLabelText) {
            toggleLabelText.textContent = sellerModeOn ? 'Seller Mode ON' : 'Seller Mode OFF';
        }

        // Add toggle event listener
        if (profileSellerToggle) {
            profileSellerToggle.addEventListener('change', async (e) => {
                const enabled = e.target.checked;
                setSellerMode(enabled);

                // Update label
                if (toggleLabelText) {
                    toggleLabelText.textContent = enabled ? 'Seller Mode ON' : 'Seller Mode OFF';
                }

                // Re-render sidebar
                await renderSidebar();

                // Show toast
                showToast(
                    enabled ? 'Seller Mode activated!' : 'Seller Mode deactivated!',
                    enabled ? 'success' : 'info'
                );

                // Note: NO REDIRECT - user stays on settings page
            });
        }
    } else {
        // Show become vendor section, hide vendor mode toggle
        if (vendorModeSection) vendorModeSection.style.display = 'none';
        if (becomeVendorSection) becomeVendorSection.style.display = 'block';
    }
}

/**
 * Setup theme settings (dark mode, color picker)
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

    // Color Presets
    const colorPresets = document.querySelectorAll('.color-preset');
    const customColorPicker = document.getElementById('custom-color-picker');
    const resetColorBtn = document.getElementById('reset-color');

    // Get current color
    const currentColor = getCustomColor() || '#4A90A4';

    // Set custom color picker value
    if (customColorPicker) {
        customColorPicker.value = currentColor;
    }

    // Mark active preset
    colorPresets.forEach(preset => {
        if (preset.dataset.color.toLowerCase() === currentColor.toLowerCase()) {
            preset.classList.add('active');
        }

        preset.addEventListener('click', () => {
            const color = preset.dataset.color;

            // Update active state
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');

            // Apply color
            setCustomColor(color);

            // Update custom picker
            if (customColorPicker) {
                customColorPicker.value = color;
            }

            showToast('Theme color updated', 'success');
        });
    });

    // Custom Color Picker
    if (customColorPicker) {
        customColorPicker.addEventListener('change', (e) => {
            const color = e.target.value;

            // Remove active from presets
            colorPresets.forEach(p => p.classList.remove('active'));

            // Apply color
            setCustomColor(color);
            showToast('Custom theme color applied', 'success');
        });
    }

    // Reset Color Button
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', () => {
            // Reset to default
            setCustomColor(null);

            // Reset UI
            if (customColorPicker) {
                customColorPicker.value = '#4A90A4';
            }
            colorPresets.forEach(p => {
                p.classList.remove('active');
                if (p.dataset.color === '#4A90A4') {
                    p.classList.add('active');
                }
            });

            showToast('Theme color reset to default', 'info');
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
