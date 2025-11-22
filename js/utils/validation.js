/**
 * EasySlots - Validation Utilities
 * Form validation helpers
 */

/**
 * Validation rules
 */
export const rules = {
    required: (value) => {
        const valid = value !== null && value !== undefined && String(value).trim() !== '';
        return { valid, message: 'This field is required' };
    },

    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = emailRegex.test(value);
        return { valid, message: 'Please enter a valid email address' };
    },

    minLength: (min) => (value) => {
        const valid = String(value).length >= min;
        return { valid, message: `Must be at least ${min} characters` };
    },

    maxLength: (max) => (value) => {
        const valid = String(value).length <= max;
        return { valid, message: `Must be no more than ${max} characters` };
    },

    min: (minValue) => (value) => {
        const valid = Number(value) >= minValue;
        return { valid, message: `Must be at least ${minValue}` };
    },

    max: (maxValue) => (value) => {
        const valid = Number(value) <= maxValue;
        return { valid, message: `Must be no more than ${maxValue}` };
    },

    pattern: (regex, message = 'Invalid format') => (value) => {
        const valid = regex.test(value);
        return { valid, message };
    },

    phone: (value) => {
        const phoneRegex = /^[\d\s\-+()]{7,20}$/;
        const valid = !value || phoneRegex.test(value);
        return { valid, message: 'Please enter a valid phone number' };
    },

    url: (value) => {
        try {
            new URL(value);
            return { valid: true, message: '' };
        } catch {
            return { valid: false, message: 'Please enter a valid URL' };
        }
    },

    match: (otherFieldId, fieldName = 'fields') => (value, form) => {
        const otherValue = form?.querySelector(`#${otherFieldId}`)?.value;
        const valid = value === otherValue;
        return { valid, message: `${fieldName} must match` };
    }
};

/**
 * Validate a single field
 * @param {HTMLElement} field - Form field element
 * @param {Array} fieldRules - Array of validation rules
 * @param {HTMLFormElement} form - Parent form (for cross-field validation)
 * @returns {Object} Validation result
 */
export function validateField(field, fieldRules, form = null) {
    const value = field.type === 'checkbox' ? field.checked : field.value;

    for (const rule of fieldRules) {
        const result = typeof rule === 'function' ? rule(value, form) : rule;
        if (!result.valid) {
            return { valid: false, message: result.message };
        }
    }

    return { valid: true, message: '' };
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form element
 * @param {Object} schema - Validation schema { fieldId: [rules] }
 * @returns {Object} Validation results
 */
export function validateForm(form, schema) {
    const errors = {};
    let isValid = true;

    Object.entries(schema).forEach(([fieldId, fieldRules]) => {
        const field = form.querySelector(`#${fieldId}`);
        if (!field) return;

        const result = validateField(field, fieldRules, form);
        if (!result.valid) {
            errors[fieldId] = result.message;
            isValid = false;
        }
    });

    return { isValid, errors };
}

/**
 * Show validation error on field
 * @param {HTMLElement} field - Field element
 * @param {string} message - Error message
 */
export function showFieldError(field, message) {
    const group = field.closest('.form-group');
    if (!group) return;

    group.classList.add('form-group--error');
    field.classList.add('form-input--error');

    // Remove existing error message
    const existingError = group.querySelector('.form-error');
    if (existingError) existingError.remove();

    // Add error message
    const error = document.createElement('p');
    error.className = 'form-error';
    error.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        ${message}
    `;
    field.parentNode.insertBefore(error, field.nextSibling);
}

/**
 * Clear validation error from field
 * @param {HTMLElement} field - Field element
 */
export function clearFieldError(field) {
    const group = field.closest('.form-group');
    if (!group) return;

    group.classList.remove('form-group--error');
    field.classList.remove('form-input--error');

    const error = group.querySelector('.form-error');
    if (error) error.remove();
}

/**
 * Clear all form errors
 * @param {HTMLFormElement} form - Form element
 */
export function clearFormErrors(form) {
    form.querySelectorAll('.form-group--error').forEach(group => {
        group.classList.remove('form-group--error');
    });
    form.querySelectorAll('.form-input--error').forEach(input => {
        input.classList.remove('form-input--error');
    });
    form.querySelectorAll('.form-error').forEach(error => {
        error.remove();
    });
}

export default {
    rules,
    validateField,
    validateForm,
    showFieldError,
    clearFieldError,
    clearFormErrors
};
