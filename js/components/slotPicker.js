/**
 * EasySlots - Slot Picker Component
 * Time slot selection for bookings
 */

import { formatTime } from '../utils/dates.js';

/**
 * Create a slot picker component
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Slot picker options
 * @returns {Object} Slot picker instance
 */
export function createSlotPicker(container, options = {}) {
    const state = {
        slots: options.slots || [],
        selectedSlot: options.selectedSlot || null,
        onSelect: options.onSelect || (() => {})
    };

    function render() {
        if (state.slots.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No slots available for this date</p>';
            return;
        }

        container.innerHTML = `
            <div class="slot-picker">
                <div class="slot-picker__title">Available Times</div>
                <div class="slot-picker__grid">
                    ${state.slots.map(slot => {
                        const available = slot.maxSpots - slot.bookedSpots;
                        const isSelected = state.selectedSlot?.id === slot.id;
                        const isDisabled = available <= 0;

                        let classes = ['slot-picker__slot'];
                        if (isSelected) classes.push('slot-picker__slot--selected');
                        if (isDisabled) classes.push('slot-picker__slot--disabled');

                        return `
                            <button class="${classes.join(' ')}"
                                    data-slot-id="${slot.id}"
                                    ${isDisabled ? 'disabled' : ''}>
                                <span class="slot-picker__time">${formatTime(slot.startTime)}</span>
                                <span class="slot-picker__spots">${available} left</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Attach events
        container.querySelectorAll('.slot-picker__slot:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const slotId = btn.dataset.slotId;
                state.selectedSlot = state.slots.find(s => s.id === slotId);
                state.onSelect(state.selectedSlot);
                render();
            });
        });
    }

    render();

    return {
        setSlots: (slots) => {
            state.slots = slots;
            state.selectedSlot = null;
            render();
        },
        setSelectedSlot: (slot) => {
            state.selectedSlot = slot;
            render();
        },
        getSelectedSlot: () => state.selectedSlot
    };
}

export default { createSlotPicker };
