/**
 * EasySlots - QR Code Component
 * Generates QR codes for tickets
 */

/**
 * Generate QR code image URL
 * @param {string} data - Data to encode
 * @param {number} size - QR code size
 * @returns {string} QR code image URL
 */
export function generateQRCodeUrl(data, size = 200) {
    // Using free QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

/**
 * Create QR code element
 * @param {string} data - Data to encode
 * @param {number} size - QR code size
 * @returns {HTMLElement} QR code image element
 */
export function createQRCodeElement(data, size = 200) {
    const img = document.createElement('img');
    img.src = generateQRCodeUrl(data, size);
    img.alt = 'QR Code';
    img.width = size;
    img.height = size;
    return img;
}

export default { generateQRCodeUrl, createQRCodeElement };
