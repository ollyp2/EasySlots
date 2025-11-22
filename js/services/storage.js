/**
 * EasySlots - Storage Service
 * Handles Firebase Storage operations for file uploads
 */

import {
    storage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from '../config/firebase.js';

/**
 * Upload event image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} eventId - Event ID for organizing storage
 * @returns {Promise<string>} Download URL of uploaded image
 */
export async function uploadEventImage(file, eventId) {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `events/${eventId}/${timestamp}.${extension}`;

    const storageRef = ref(storage, fileName);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
            eventId,
            uploadedAt: new Date().toISOString()
        }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

/**
 * Upload event image with progress tracking
 * @param {File} file - Image file to upload
 * @param {string} eventId - Event ID
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL
 */
export async function uploadEventImageWithProgress(file, eventId, onProgress) {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `events/${eventId}/${timestamp}.${extension}`;

    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type
    });

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) {
                    onProgress(Math.round(progress));
                }
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

/**
 * Delete event image from Firebase Storage
 * @param {string} imageUrl - Full URL of image to delete
 * @returns {Promise<void>}
 */
export async function deleteEventImage(imageUrl) {
    try {
        // Extract storage path from URL
        const storageRef = ref(storage, getPathFromUrl(imageUrl));
        await deleteObject(storageRef);
    } catch (error) {
        // Ignore if file doesn't exist
        if (error.code !== 'storage/object-not-found') {
            throw error;
        }
    }
}

/**
 * Upload vendor logo
 * @param {File} file - Logo image file
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<string>} Download URL
 */
export async function uploadVendorLogo(file, vendorId) {
    const extension = file.name.split('.').pop();
    const fileName = `vendors/${vendorId}/logo.${extension}`;

    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type
    });

    return getDownloadURL(snapshot.ref);
}

/**
 * Delete vendor logo
 * @param {string} logoUrl - Logo URL to delete
 * @returns {Promise<void>}
 */
export async function deleteVendorLogo(logoUrl) {
    try {
        const storageRef = ref(storage, getPathFromUrl(logoUrl));
        await deleteObject(storageRef);
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            throw error;
        }
    }
}

/**
 * Upload user avatar
 * @param {File} file - Avatar image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} Download URL
 */
export async function uploadUserAvatar(file, userId) {
    const extension = file.name.split('.').pop();
    const fileName = `users/${userId}/avatar.${extension}`;

    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type
    });

    return getDownloadURL(snapshot.ref);
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result { valid, error }
 */
export function validateImageFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
        };
    }

    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSizeMB}MB`
        };
    }

    return { valid: true, error: null };
}

/**
 * Create image preview URL (for local preview before upload)
 * @param {File} file - Image file
 * @returns {string} Object URL for preview
 */
export function createImagePreview(file) {
    return URL.createObjectURL(file);
}

/**
 * Revoke image preview URL (cleanup)
 * @param {string} previewUrl - Preview URL to revoke
 */
export function revokeImagePreview(previewUrl) {
    URL.revokeObjectURL(previewUrl);
}

/**
 * Extract storage path from download URL
 * @param {string} url - Firebase Storage download URL
 * @returns {string} Storage path
 */
function getPathFromUrl(url) {
    // Firebase Storage URLs contain the path after /o/ and before ?
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
        return decodeURIComponent(match[1]);
    }
    throw new Error('Invalid Firebase Storage URL');
}

export default {
    uploadEventImage,
    uploadEventImageWithProgress,
    deleteEventImage,
    uploadVendorLogo,
    deleteVendorLogo,
    uploadUserAvatar,
    validateImageFile,
    createImagePreview,
    revokeImagePreview
};
