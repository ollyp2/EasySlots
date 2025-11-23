/**
 * EasySeats - Modal Component
 * Handles modal dialogs
 */

/**
 * Open a modal
 * @param {string} modalId - Modal element ID
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    const overlay = modal.querySelector('.modal__overlay');
    if (overlay) {
        overlay.addEventListener('click', () => closeModal(modalId), { once: true });
    }

    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal(modalId);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/**
 * Close a modal
 * @param {string} modalId - Modal element ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
}

/**
 * Create and show a confirm dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<boolean>} User's choice
 */
export function confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' }) {
    return new Promise((resolve) => {
        const modalId = 'confirm-modal-' + Date.now();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal modal--open';
        modal.innerHTML = `
            <div class="modal__overlay"></div>
            <div class="modal__content modal__content--sm">
                <div class="modal__header">
                    <h3 class="modal__title">${title}</h3>
                </div>
                <div class="modal__body">
                    <p>${message}</p>
                </div>
                <div class="modal__footer">
                    <button class="btn btn-outline" data-action="cancel">${cancelText}</button>
                    <button class="btn btn-${type}" data-action="confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const handleAction = (confirmed) => {
            modal.remove();
            document.body.style.overflow = '';
            resolve(confirmed);
        };

        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction(true));
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction(false));
        modal.querySelector('.modal__overlay').addEventListener('click', () => handleAction(false));
    });
}

export default { openModal, closeModal, confirm };
