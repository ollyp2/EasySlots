/**
 * EasySlots - Ticket Scanner Page
 * QR code scanning and manual ticket validation for sellers
 */

import { requireSeller } from '../utils/authGuard.js';
import { getCurrentUser } from '../services/auth.js';
import { getVendorByUserId } from '../services/vendors.js';
import { validateTicketViaCloud } from '../services/tickets.js';
import { showToast } from '../components/toast.js';
import { renderSidebar } from '../components/sidebar.js';

let videoStream = null;
let scannerActive = false;
let lastScannedCode = null;
let lastScanTime = 0;
let vendorId = null;
const recentScans = [];

const $ = (sel) => document.querySelector(sel);

/**
 * Initialize the ticket scanner page
 */
export async function initTicketScannerPage() {
    // Require seller access
    const hasAccess = await requireSeller();
    if (!hasAccess) return;

    const user = getCurrentUser();
    if (!user) return;

    // Render sidebar (dynamic based on mode)
    await renderSidebar();

    // Get vendor profile
    const vendor = await getVendorByUserId(user.uid);

    if (!vendor) {
        showToast('Vendor profile not found', 'error');
        return;
    }

    vendorId = vendor.id;

    // Setup event listeners
    $('#start-scanner')?.addEventListener('click', startScanner);
    $('#stop-scanner')?.addEventListener('click', stopScanner);
    $('#validate-manual')?.addEventListener('click', handleManualValidation);

    $('#manual-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleManualValidation();
    });

    // Auto-format manual input
    $('#manual-code')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

/**
 * Start the camera scanner
 */
async function startScanner() {
    try {
        const video = $('#scanner-video');

        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = videoStream;
        await video.play();
        scannerActive = true;

        $('#start-scanner').style.display = 'none';
        $('#stop-scanner').style.display = 'block';

        showToast('Camera started. Point at QR code.', 'success');

        // Start scanning loop
        scanQRCode();

    } catch (error) {
        console.error('Camera error:', error);
        showToast('Could not access camera. Please allow camera permissions.', 'error');
    }
}

/**
 * Stop the camera scanner
 */
function stopScanner() {
    scannerActive = false;

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    const video = $('#scanner-video');
    if (video) video.srcObject = null;

    $('#start-scanner').style.display = 'block';
    $('#stop-scanner').style.display = 'none';
}

/**
 * Scan for QR codes using BarcodeDetector API
 */
async function scanQRCode() {
    if (!scannerActive) return;

    const video = $('#scanner-video');

    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
        try {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(video);

            if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;

                // Debounce: only process if different code or 3+ seconds passed
                const now = Date.now();
                if (code !== lastScannedCode || (now - lastScanTime) > 3000) {
                    lastScannedCode = code;
                    lastScanTime = now;
                    await processScannedCode(code);
                }
            }
        } catch (error) {
            // Silent fail, continue scanning
        }
    }

    // Continue scanning
    if (scannerActive) {
        requestAnimationFrame(scanQRCode);
    }
}

/**
 * Process a scanned QR code
 * @param {string} rawData - Raw QR code data
 */
async function processScannedCode(rawData) {
    let ticketCode;

    try {
        // Try parsing as JSON (QR data format)
        const qrData = JSON.parse(rawData);
        ticketCode = qrData.code;
    } catch (error) {
        // Maybe it's just the code string directly
        if (rawData.startsWith('ES-')) {
            ticketCode = rawData;
        } else {
            showResult('error', 'Invalid QR Code', 'Could not read ticket data');
            return;
        }
    }

    await validateAndShowResult(ticketCode);
}

/**
 * Handle manual code validation
 */
async function handleManualValidation() {
    const input = $('#manual-code');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        showToast('Please enter a ticket code', 'error');
        return;
    }

    if (!code.startsWith('ES-') || code.length !== 11) {
        showToast('Invalid code format. Expected: ES-XXXXXXXX', 'error');
        return;
    }

    await validateAndShowResult(code);
    input.value = '';
}

/**
 * Validate ticket and show result
 * @param {string} ticketCode - Ticket code to validate
 */
async function validateAndShowResult(ticketCode) {
    showResult('loading', 'Validating...', '<div class="loader"></div>');

    try {
        const result = await validateTicketViaCloud(ticketCode, vendorId);

        if (result.valid) {
            showResult('success', 'Ticket Valid!', `
                <div class="ticket-details">
                    <p><strong>Code:</strong> ${result.ticket.code}</p>
                    <p><strong>Event:</strong> ${result.ticket.eventTitle}</p>
                    ${result.ticket.holderName ? `<p><strong>Holder:</strong> ${result.ticket.holderName}</p>` : ''}
                    <p><strong>Date:</strong> ${formatDate(result.ticket.eventDate)} ${result.ticket.eventTime ? `at ${result.ticket.eventTime}` : ''}</p>
                    ${result.ticket.seatId ? `<p><strong>Seat:</strong> ${result.ticket.seatId}</p>` : ''}
                </div>
                <p style="margin-top: 16px; color: var(--color-success); font-weight: bold;">
                    Checked in successfully
                </p>
            `);

            addToRecentScans(result.ticket, 'valid');

        } else {
            const errorCode = result.code || 'INVALID';

            if (errorCode === 'ALREADY_USED') {
                showResult('warning', 'Already Used', `
                    <p>This ticket was already scanned.</p>
                    ${result.usedAt ? `
                    <div class="ticket-details">
                        <p><strong>Code:</strong> ${ticketCode}</p>
                        <p><strong>Used at:</strong> ${formatDateTime(result.usedAt)}</p>
                    </div>
                    ` : ''}
                `);
                addToRecentScans({ code: ticketCode }, 'used');

            } else {
                showResult('error', 'Invalid Ticket', `
                    <p>${result.error || 'Ticket not found or not valid for your events'}</p>
                `);
            }
        }

    } catch (error) {
        console.error('Validation error:', error);
        showResult('error', 'Error', 'Could not validate ticket. Check your connection and try again.');
    }
}

/**
 * Show result in the result area
 * @param {string} type - Result type (success, error, warning, loading)
 * @param {string} title - Result title
 * @param {string} message - Result message HTML
 */
function showResult(type, title, message) {
    const resultDiv = $('#scanner-result');
    if (!resultDiv) return;

    resultDiv.className = `scanner-result ${type}`;
    resultDiv.innerHTML = `<h2 style="margin: 0 0 8px 0;">${title}</h2>${message}`;

    // Auto-hide after 5 seconds (except for loading state)
    if (type && type !== 'loading') {
        setTimeout(() => {
            resultDiv.className = 'scanner-result';
            resultDiv.innerHTML = '';
        }, 5000);
    }
}

/**
 * Add scan to recent scans list
 * @param {Object} ticket - Ticket data
 * @param {string} status - Scan status
 */
function addToRecentScans(ticket, status) {
    if (!ticket) return;

    recentScans.unshift({
        code: ticket.code,
        holder: ticket.holderName || 'Unknown',
        event: ticket.eventTitle || 'Unknown Event',
        status: status,
        time: new Date()
    });

    // Keep only last 10
    if (recentScans.length > 10) recentScans.pop();

    renderRecentScans();
}

/**
 * Render the recent scans list
 */
function renderRecentScans() {
    const list = $('#recent-scans-list');
    if (!list) return;

    if (recentScans.length === 0) {
        list.innerHTML = '<p class="text-secondary">No scans yet</p>';
        return;
    }

    list.innerHTML = recentScans.map(scan => `
        <div class="recent-scan-item">
            <div>
                <strong>${scan.code}</strong><br>
                <span class="text-secondary" style="font-size: 12px;">${scan.holder}</span>
            </div>
            <div style="text-align: right;">
                <span class="badge badge--${scan.status === 'valid' ? 'success' : 'warning'}">
                    ${scan.status === 'valid' ? 'Valid' : 'Used'}
                </span><br>
                <span class="text-secondary" style="font-size: 11px;">
                    ${formatTime(scan.time)}
                </span>
            </div>
        </div>
    `).join('');
}

/**
 * Format date for display
 * @param {string|Date|Object} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    if (!date) return 'Unknown';
    const d = typeof date === 'string' ? new Date(date) : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString();
}

/**
 * Format date and time for display
 * @param {string|Date|Object} timestamp - Timestamp to format
 * @returns {string} Formatted datetime
 */
function formatDateTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    return date.toLocaleString();
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time
 */
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTicketScannerPage);
} else {
    initTicketScannerPage();
}
