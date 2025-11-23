/**
 * EasySeats - Event Detail Page
 * View event details, select date/slot, and proceed to booking
 */

import { getEventById } from '../services/events.js';
import { getSlotsByEvent, getAvailableSlots, getAvailableDates } from '../services/slots.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { formatCurrency } from '../utils/currency.js';
import { calculateBookingTotals } from '../services/bookings.js';

let event = null;
let selectedDate = null;
let selectedSlot = null;
let quantity = 1;
let availableDates = [];

async function init() {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId) {
        window.location.href = '/pages/events/index.html';
        return;
    }

    showLoader();

    try {
        await loadEvent(eventId);
    } catch (error) {
        console.error('Error loading event:', error);
        showToast('Error', 'Failed to load event', 'error');
    } finally {
        hideLoader();
    }
}

async function loadEvent(eventId) {
    event = await getEventById(eventId);

    if (!event || event.status !== 'published') {
        showToast('Error', 'Event not found', 'error');
        window.location.href = '/pages/events/index.html';
        return;
    }

    renderEventDetails();
    await loadAvailableDates();
    setupCalendar();
    setupQuantityControls();
    setupBookButton();
    updateSummary();
}

function renderEventDetails() {
    document.title = `${event.title} - EasySeats`;

    const elements = {
        'event-title': event.title,
        'event-category': event.category || 'Event',
        'event-description': event.description || '',
        'event-price': formatCurrency(event.basePrice || 0)
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const imageEl = document.getElementById('event-image');
    if (imageEl) {
        const imageUrl = event.imageURL || '/assets/images/placeholder-event.jpg';
        imageEl.innerHTML = `<img src="${imageUrl}" alt="${event.title}">`;
    }

    const locationEl = document.getElementById('event-location');
    if (locationEl) {
        const locationType = event.locationType || 'physical';
        let locationHtml = '';
        if (locationType === 'online') {
            locationHtml = '<p><strong>Online Event</strong></p><p>Link will be provided after booking</p>';
        } else if (locationType === 'hybrid') {
            locationHtml = `<p><strong>Hybrid Event</strong></p><p>${event.location || 'Location TBD'}</p>`;
        } else {
            locationHtml = `<p>${event.location || 'Location TBD'}</p>`;
        }
        locationEl.innerHTML = locationHtml;
    }

    const vendorLink = document.getElementById('vendor-link');
    if (vendorLink) {
        vendorLink.textContent = event.vendorName || 'Vendor';
        vendorLink.href = `/pages/vendor/profile.html?id=${event.vendorId}`;
    }
}

async function loadAvailableDates() {
    try {
        availableDates = await getAvailableDates(event.id);
    } catch (error) {
        console.error('Error loading available dates:', error);
        availableDates = [];
    }
}

function setupCalendar() {
    const calendarContainer = document.getElementById('booking-calendar');
    if (!calendarContainer) return;

    const today = new Date();
    renderCalendar(today.getFullYear(), today.getMonth());
}

function renderCalendar(year, month) {
    const container = document.getElementById('booking-calendar');
    if (!container) return;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date().toISOString().split('T')[0];

    let html = `
        <div class="calendar">
            <div class="calendar__header">
                <button type="button" class="calendar__nav" data-nav="prev"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                <span class="calendar__month">${monthNames[month]} ${year}</span>
                <button type="button" class="calendar__nav" data-nav="next"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
            </div>
            <div class="calendar__weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
            <div class="calendar__days">
    `;

    for (let i = 0; i < startDay; i++) {
        html += '<span class="calendar__day calendar__day--empty"></span>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isPast = dateStr < today;
        const isAvailable = availableDates.includes(dateStr);
        const isSelected = dateStr === selectedDate;

        let classes = 'calendar__day';
        if (isPast) classes += ' calendar__day--disabled';
        else if (isAvailable) classes += ' calendar__day--available';
        else classes += ' calendar__day--unavailable';
        if (isSelected) classes += ' calendar__day--selected';

        html += `<button type="button" class="${classes}" data-date="${dateStr}" ${isPast || !isAvailable ? 'disabled' : ''}>${day}</button>`;
    }

    html += '</div></div>';
    container.innerHTML = html;

    container.querySelectorAll('.calendar__day[data-date]').forEach(btn => {
        btn.addEventListener('click', () => handleDateSelect(btn.dataset.date));
    });

    container.querySelector('[data-nav="prev"]')?.addEventListener('click', () => {
        const newMonth = month === 0 ? 11 : month - 1;
        const newYear = month === 0 ? year - 1 : year;
        renderCalendar(newYear, newMonth);
    });

    container.querySelector('[data-nav="next"]')?.addEventListener('click', () => {
        const newMonth = month === 11 ? 0 : month + 1;
        const newYear = month === 11 ? year + 1 : year;
        renderCalendar(newYear, newMonth);
    });
}

async function handleDateSelect(date) {
    selectedDate = date;
    selectedSlot = null;

    document.querySelectorAll('.calendar__day--selected').forEach(el => el.classList.remove('calendar__day--selected'));
    document.querySelector(`[data-date="${date}"]`)?.classList.add('calendar__day--selected');

    await loadSlots(date);
    updateBookButton();
}

async function loadSlots(date) {
    const container = document.getElementById('slot-picker');
    if (!container) return;

    container.innerHTML = '<p class="text-muted">Loading slots...</p>';

    try {
        const slots = await getAvailableSlots(event.id, date);

        if (slots.length === 0) {
            container.innerHTML = '<p class="text-muted">No slots available for this date</p>';
            return;
        }

        container.innerHTML = `
            <label class="form-label">Select a time</label>
            <div class="slot-list">
                ${slots.map(slot => {
                    const available = (slot.capacity || slot.maxSpots || 0) - (slot.bookedCount || slot.bookedSpots || 0);
                    const price = slot.priceOverride || event.basePrice || 0;
                    return `
                        <button type="button" class="slot-option" data-slot-id="${slot.id}">
                            <span class="slot-option__time">${slot.startTime} - ${slot.endTime}</span>
                            <span class="slot-option__info">
                                <span class="slot-option__spots">${available} spots left</span>
                                <span class="slot-option__price">${formatCurrency(price)}</span>
                            </span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.slot-option').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedSlot = slots.find(s => s.id === btn.dataset.slotId);
                document.querySelectorAll('.slot-option--selected').forEach(el => el.classList.remove('slot-option--selected'));
                btn.classList.add('slot-option--selected');
                updateSpotsAvailable();
                updateSummary();
                updateBookButton();
            });
        });
    } catch (error) {
        console.error('Error loading slots:', error);
        container.innerHTML = '<p class="text-muted text-danger">Failed to load slots</p>';
    }
}

function setupQuantityControls() {
    const qtyInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('qty-decrease');
    const increaseBtn = document.getElementById('qty-increase');

    decreaseBtn?.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            if (qtyInput) qtyInput.value = quantity;
            updateSummary();
        }
    });

    increaseBtn?.addEventListener('click', () => {
        const maxSpots = selectedSlot ? (selectedSlot.capacity || selectedSlot.maxSpots || 10) - (selectedSlot.bookedCount || selectedSlot.bookedSpots || 0) : 10;
        if (quantity < maxSpots) {
            quantity++;
            if (qtyInput) qtyInput.value = quantity;
            updateSummary();
        }
    });

    qtyInput?.addEventListener('change', (e) => {
        quantity = Math.max(1, parseInt(e.target.value) || 1);
        e.target.value = quantity;
        updateSummary();
    });
}

function updateSpotsAvailable() {
    const spotsEl = document.getElementById('spots-left');
    if (spotsEl && selectedSlot) {
        const available = (selectedSlot.capacity || selectedSlot.maxSpots || 0) - (selectedSlot.bookedCount || selectedSlot.bookedSpots || 0);
        spotsEl.textContent = available;
    }
}

function updateSummary() {
    if (!event) return;

    const unitPrice = selectedSlot?.priceOverride || event.basePrice || 0;
    const { subtotal, total } = calculateBookingTotals(unitPrice, quantity);

    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function setupBookButton() {
    const bookBtn = document.getElementById('book-now');
    bookBtn?.addEventListener('click', handleBookNow);
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

function handleBookNow() {
    if (!selectedDate || !selectedSlot) {
        showToast('Error', 'Please select a date and time slot', 'error');
        return;
    }

    const bookingData = {
        eventId: event.id,
        eventTitle: event.title,
        eventImage: event.imageURL,
        vendorId: event.vendorId,
        vendorName: event.vendorName,
        date: selectedDate,
        slotId: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        quantity,
        unitPrice: selectedSlot.priceOverride || event.basePrice || 0
    };

    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    window.location.href = '/pages/booking/checkout.html';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
