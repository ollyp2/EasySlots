/**
 * EasySeats - Router Utilities
 * URL and navigation helpers
 */

/**
 * Get URL query parameters
 * @param {string} url - URL string (default: current URL)
 * @returns {Object} Query parameters object
 */
export function getQueryParams(url = window.location.href) {
    const params = {};
    const urlObj = new URL(url);
    for (const [key, value] of urlObj.searchParams.entries()) {
        params[key] = value;
    }
    return params;
}

/**
 * Get single query parameter
 * @param {string} name - Parameter name
 * @param {string} defaultValue - Default value if not found
 * @returns {string|null} Parameter value
 */
export function getQueryParam(name, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || defaultValue;
}

/**
 * Set query parameters
 * @param {Object} params - Parameters to set
 * @param {boolean} replace - Replace history instead of push
 */
export function setQueryParams(params, replace = false) {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });

    const method = replace ? 'replaceState' : 'pushState';
    history[method]({}, '', url.toString());
}

/**
 * Navigate to URL
 * @param {string} url - Destination URL
 */
export function navigate(url) {
    window.location.href = url;
}

/**
 * Go back in history
 */
export function goBack() {
    history.back();
}

/**
 * Redirect with return URL
 * @param {string} url - Destination URL
 * @param {string} returnUrl - URL to return to (default: current URL)
 */
export function redirectWithReturn(url, returnUrl = window.location.href) {
    const redirectUrl = new URL(url, window.location.origin);
    redirectUrl.searchParams.set('redirect', returnUrl);
    navigate(redirectUrl.toString());
}

/**
 * Get return URL from query params
 * @param {string} defaultUrl - Default URL if no return param
 * @returns {string} Return URL
 */
export function getReturnUrl(defaultUrl = '/') {
    return getQueryParam('redirect', defaultUrl);
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} Full URL
 */
export function buildUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
}

export default {
    getQueryParams,
    getQueryParam,
    setQueryParams,
    navigate,
    goBack,
    redirectWithReturn,
    getReturnUrl,
    buildUrl
};
