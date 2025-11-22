/**
 * EasySlots - Event Detail Page
 */

import { getEventById } from '../services/events.js';
import { getEventSlots } from '../services/slots.js';
import { getVendorById } from '../services/vendors.js';
import { createCalendar } from '../components/calendar.js';
import { createSlotPicker } from '../components/slotPicker.js';
import { formatPrice, calculateTotal } from '../services/payments.js';
import { formatDate } from '../utils/dates.js';
import { getQueryParam, navigate } from '../utils/router.js';
import { showToast } from '../components/toast.js';

let event = null;
let vendor = null;
let selectedDate = null;
let selectedSlot = null;
let quantity = 1;
let calendar = null;
let slotPicker = null;

async function init() {
    const eventId = getQueryParam('id');
    if (!eventId) {
        navigate('/pages/events/index.html');
        return;
    }

    await loadEvent(eventId);
    setupQuantityControls();
    setupBookButton();
}

async function loadEvent(eventId) {
    try {
        event = await getEventById(eventId);
        if (!event) {
            showToast('Error', 'Event not found', 'error');
            navigate('/pages/events/index.html');
            return;
        }

        vendor = await getVendorById(event.vendorId);
        renderEventDetails();
        initCalendar();
    } catch (error) {
        console.error('Error loading event:', error);
        showToast('Error', 'Failed to load event', 'error');
    }
}

function renderEventDetails() {
    document.title = `${event.title} - EasySlots`;

    const elements = {
        'event-title': event.title,
        'event-category': event.category,
        'event-description': event.description,
        'event-price': formatPrice(event.price),
        'vendor-link': vendor?.businessName || 'Unknown Vendor'
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const imageEl = document.getElementById('event-image');
    if (imageEl && event.imageUrl) {
        imageEl.innerHTML = `<img src="${event.imageUrl}" alt="${event.title}">`;
    }
}

function initCalendar() {
    const calendarContainer = document.getElementById('booking-calendar');
    const slotContainer = document.getElementById('slot-picker');

    if (calendarContainer) {
        calendar = createCalendar(calendarContainer, {
            availableDates: [], // Would be populated from slots
            onSelect: async (date) => {
                selectedDate = date;
                await loadSlots(date);
                updateBookButton();
            }
        });
    }

    if (slotContainer) {
        slotPicker = createSlotPicker(slotContainer, {
            slots: [],
            onSelect: (slot) => {
                selectedSlot = slot;
                updateSpotsAvailable();
                updateBookButton();
            }
        });
    }
}

async function loadSlots(date) {
    if (!slotPicker) return;

    try {
        const slots = await getEventSlots(event.id, new Date(date));
        slotPicker.setSlots(slots);
    } catch (error) {
        console.error('Error loading slots:', error);
    }
}

function setupQuantityControls() {
    const qtyInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('qty-decrease');
    const increaseBtn = document.getElementById('qty-increase');

    decreaseBtn?.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            qtyInput.value = quantity;
            updateSummary();
        }
    });

    increaseBtn?.addEventListener('click', () => {
        const maxSpots = selectedSlot ? selectedSlot.maxSpots - selectedSlot.bookedSpots : 10;
        if (quantity < maxSpots) {
            quantity++;
            qtyInput.value = quantity;
            updateSummary();
        }
    });

    qtyInput?.addEventListener('change', (e) => {
        quantity = Math.max(1, parseInt(e.target.value) || 1);
        qtyInput.value = quantity;
        updateSummary();
    });
}

function updateSpotsAvailable() {
    const spotsEl = document.getElementById('spots-left');
    if (spotsEl && selectedSlot) {
        spotsEl.textContent = selectedSlot.maxSpots - selectedSlot.bookedSpots;
    }
}

function updateSummary() {
    if (!event) return;

    const { subtotal, total } = calculateTotal(event.price, quantity);
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(total);
}

function setupBookButton() {
    const bookBtn = document.getElementById('book-now');
    bookBtn?.addEventListener('click', () => {
        if (selectedDate && selectedSlot) {
            const params = new URLSearchParams({
                eventId: event.id,
                date: selectedDate,
                slotId: selectedSlot.id,
                quantity: quantity
            });
            navigate(`/pages/booking/checkout.html?${params}`);
        }
    });
}

function updateBookButton() {
    const bookBtn = document.getElementById('book-now');
    if (!bookBtn) return;

    if (selectedDate && selectedSlot) {
        bookBtn.disabled = false;
        bookBtn.textContent = 'Book Now';
    } else if (selectedDate) {
        bookBtn.disabled = true;
        bookBtn.textContent = 'Select a time slot';
    } else {
        bookBtn.disabled = true;
        bookBtn.textContent = 'Select a date & time';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
