/**
 * EasySlots - Loader Component
 * Shows loading states
 */

/**
 * Show the full-page loader
 */
export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

/**
 * Hide the full-page loader
 */
export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Show inline loader in an element
 * @param {HTMLElement} element - Target element
 */
export function showInlineLoader(element) {
    if (!element) return;

    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '<div class="loader loader--sm"></div>';
    element.disabled = true;
}

/**
 * Hide inline loader and restore content
 * @param {HTMLElement} element - Target element
 */
export function hideInlineLoader(element) {
    if (!element) return;

    element.innerHTML = element.dataset.originalContent || '';
    element.disabled = false;
    delete element.dataset.originalContent;
}

/**
 * Create a skeleton loader placeholder
 * @param {string} type - Skeleton type: 'text', 'card', 'avatar'
 * @returns {string} Skeleton HTML
 */
export function createSkeleton(type = 'text') {
    const skeletons = {
        text: '<div class="skeleton skeleton--text"></div>',
        card: `
            <div class="skeleton skeleton--card">
                <div class="skeleton skeleton--image"></div>
                <div class="skeleton skeleton--text"></div>
                <div class="skeleton skeleton--text skeleton--short"></div>
            </div>
        `,
        avatar: '<div class="skeleton skeleton--avatar"></div>'
    };

    return skeletons[type] || skeletons.text;
}

export default { showLoader, hideLoader, showInlineLoader, hideInlineLoader, createSkeleton };
