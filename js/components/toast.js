/**
 * EasySlots - Toast Notification Component
 * Shows temporary notification messages
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Show a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (optional)
 */
export function showToast(title, message, type = 'info', duration = CONSTANTS.TOAST_DURATION.NORMAL) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = createToastElement(title, message, type);

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('toast--hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Create toast element
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type
 * @returns {HTMLElement} Toast element
 */
function createToastElement(title, message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
        success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
        error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
    };

    toast.innerHTML = `
        <svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icons[type] || icons.info}
        </svg>
        <div class="toast__content">
            ${title ? `<div class="toast__title">${title}</div>` : ''}
            ${message ? `<div class="toast__message">${message}</div>` : ''}
        </div>
        <button class="toast__close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    // Close button handler
    toast.querySelector('.toast__close').addEventListener('click', () => {
        toast.classList.add('toast--hiding');
        setTimeout(() => toast.remove(), 300);
    });

    return toast;
}

// Shorthand methods
export const toast = {
    success: (title, message, duration) => showToast(title, message, 'success', duration),
    error: (title, message, duration) => showToast(title, message, 'error', duration),
    warning: (title, message, duration) => showToast(title, message, 'warning', duration),
    info: (title, message, duration) => showToast(title, message, 'info', duration)
};

export default { showToast, toast };
