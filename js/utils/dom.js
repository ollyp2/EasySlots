/**
 * EasySeats - DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null} Element or null
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {NodeList} NodeList of elements
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Create element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {string|HTMLElement|Array} content - Content (string, element, or array)
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, content = null) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                el.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });

    if (content !== null) {
        if (typeof content === 'string') {
            el.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            el.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    el.appendChild(child);
                }
            });
        }
    }

    return el;
}

/**
 * Add event listener to element(s)
 * @param {HTMLElement|NodeList|string} target - Target element(s) or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 */
export function on(target, event, handler, options = {}) {
    const elements = typeof target === 'string' ? $$(target) : (target instanceof NodeList ? target : [target]);
    elements.forEach(el => el?.addEventListener(event, handler, options));
}

/**
 * Remove event listener from element(s)
 * @param {HTMLElement|NodeList|string} target - Target element(s) or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function off(target, event, handler) {
    const elements = typeof target === 'string' ? $$(target) : (target instanceof NodeList ? target : [target]);
    elements.forEach(el => el?.removeEventListener(event, handler));
}

/**
 * Delegate event to parent element
 * @param {HTMLElement} parent - Parent element
 * @param {string} event - Event name
 * @param {string} selector - Child selector
 * @param {Function} handler - Event handler
 */
export function delegate(parent, event, selector, handler) {
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target && parent.contains(target)) {
            handler.call(target, e, target);
        }
    });
}

/**
 * Get form data as object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data object
 */
export function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

/**
 * Set form values from object
 * @param {HTMLFormElement} form - Form element
 * @param {Object} data - Data object
 */
export function setFormData(form, data) {
    Object.entries(data).forEach(([key, value]) => {
        const input = form.elements[key];
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = Boolean(value);
            } else if (input.type === 'radio') {
                form.querySelectorAll(`[name="${key}"]`).forEach(radio => {
                    radio.checked = radio.value === value;
                });
            } else {
                input.value = value;
            }
        }
    });
}

/**
 * Show element
 * @param {HTMLElement|string} el - Element or selector
 */
export function show(el) {
    const element = typeof el === 'string' ? $(el) : el;
    if (element) element.style.display = '';
}

/**
 * Hide element
 * @param {HTMLElement|string} el - Element or selector
 */
export function hide(el) {
    const element = typeof el === 'string' ? $(el) : el;
    if (element) element.style.display = 'none';
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} el - Element or selector
 */
export function toggle(el) {
    const element = typeof el === 'string' ? $(el) : el;
    if (element) {
        element.style.display = element.style.display === 'none' ? '' : 'none';
    }
}

export default { $, $$, createElement, on, off, delegate, getFormData, setFormData, show, hide, toggle };
