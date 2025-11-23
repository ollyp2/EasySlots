/**
 * EasySeats - Profile Page
 * Handles user profile management and vendor mode toggle
 */

import { auth, onAuthStateChanged } from '../config/firebase.js';
import { getUserProfile, updateUserProfile } from '../services/auth.js';
import { isSellerModeEnabled, setSellerMode, setBuyerTheme, getThemeSettings } from '../utils/sellerMode.js';
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

        // Setup theme selector
        setupThemeSelector();

        // Setup form submission
        setupFormSubmission();

        // Handle URL hash for scrolling to become-vendor section
        if (window.location.hash === '#become-vendor') {
            const section = document.getElementById('become-vendor-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
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

                // Note: NO REDIRECT - user stays on profile page
            });
        }
    } else {
        // Show become vendor section, hide vendor mode toggle
        if (vendorModeSection) vendorModeSection.style.display = 'none';
        if (becomeVendorSection) becomeVendorSection.style.display = 'block';
    }
}

/**
 * Setup theme selector
 */
function setupThemeSelector() {
    const themeSelector = document.getElementById('buyer-theme-selector');
    if (!themeSelector) return;

    const themeOptions = themeSelector.querySelectorAll('.theme-option');
    const { buyerTheme } = getThemeSettings();

    // Set initial active state
    themeOptions.forEach(option => {
        const theme = option.dataset.theme;
        if (theme === buyerTheme || (buyerTheme === 'default' && theme === 'default')) {
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
                setBuyerTheme(null); // Reset to default
            } else {
                setBuyerTheme(selectedTheme);
            }

            showToast('Theme updated!', 'success');
        });
    });
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

            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile. Please try again.', 'error');
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initProfile);
