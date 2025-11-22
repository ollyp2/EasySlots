/**
 * EasySlots - QR Scanner Component
 * Camera-based QR code scanning for ticket validation
 */

/**
 * Create QR scanner component
 * @param {HTMLElement} videoElement - Video element for camera feed
 * @param {Object} options - Scanner options
 * @returns {Object} Scanner instance
 */
export function createScanner(videoElement, options = {}) {
    let stream = null;
    let scanning = false;
    const onScan = options.onScan || (() => {});
    const onError = options.onError || console.error;

    async function start() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            videoElement.srcObject = stream;
            scanning = true;
            scanFrame();
        } catch (err) {
            onError('Camera access denied or not available');
        }
    }

    function stop() {
        scanning = false;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        videoElement.srcObject = null;
    }

    function scanFrame() {
        if (!scanning) return;

        // Note: Actual QR code detection would require a library like jsQR
        // This is a placeholder implementation
        requestAnimationFrame(scanFrame);
    }

    return {
        start,
        stop,
        isScanning: () => scanning
    };
}

export default { createScanner };
