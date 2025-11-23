/**
 * EasySeats - Seating Chart Component
 * Interactive seat selection for events with assigned seating
 */

/**
 * Create a seating chart component
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Seating chart options
 * @returns {Object} Seating chart instance
 */
export function createSeatingChart(container, options = {}) {
    const state = {
        layout: options.layout || [],
        bookedSeats: options.bookedSeats || [],
        selectedSeats: options.selectedSeats || [],
        maxSelection: options.maxSelection || 10,
        onSelect: options.onSelect || (() => {})
    };

    function render() {
        container.innerHTML = `
            <div class="seating-chart">
                ${options.showStage ? '<div class="seating-chart__stage">Stage</div>' : ''}
                <div class="seating-chart__grid">
                    ${state.layout.map((row, rowIndex) => `
                        <div class="seating-row">
                            <span class="seating-row__label">${row.label || String.fromCharCode(65 + rowIndex)}</span>
                            <div class="seating-row__seats">
                                ${row.seats.map((seat, seatIndex) => {
                                    const seatId = `${row.label || String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;
                                    const isBooked = state.bookedSeats.includes(seatId);
                                    const isSelected = state.selectedSeats.includes(seatId);

                                    if (seat.type === 'aisle') {
                                        return '<div class="seat seat--aisle"></div>';
                                    }

                                    let classes = ['seat'];
                                    if (isBooked) classes.push('seat--unavailable');
                                    if (isSelected) classes.push('seat--selected');
                                    if (seat.premium) classes.push('seat--premium');
                                    if (seat.accessible) classes.push('seat--accessible');

                                    return `
                                        <button class="${classes.join(' ')}"
                                                data-seat-id="${seatId}"
                                                ${isBooked ? 'disabled' : ''}>
                                            ${seatIndex + 1}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="seating-legend">
                    <div class="seating-legend__item">
                        <span class="seating-legend__icon seating-legend__icon--available"></span>
                        Available
                    </div>
                    <div class="seating-legend__item">
                        <span class="seating-legend__icon seating-legend__icon--selected"></span>
                        Selected
                    </div>
                    <div class="seating-legend__item">
                        <span class="seating-legend__icon seating-legend__icon--unavailable"></span>
                        Unavailable
                    </div>
                </div>
                ${state.selectedSeats.length > 0 ? `
                    <div class="seating-selection">
                        <div class="seating-selection__title">Selected Seats:</div>
                        <div class="seating-selection__seats">
                            ${state.selectedSeats.map(seatId => `
                                <span class="seating-selection__seat">
                                    ${seatId}
                                    <button class="seating-selection__remove" data-seat-id="${seatId}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Attach seat click events
        container.querySelectorAll('.seat:not([disabled]):not(.seat--aisle)').forEach(seat => {
            seat.addEventListener('click', () => {
                const seatId = seat.dataset.seatId;
                toggleSeat(seatId);
            });
        });

        // Attach remove button events
        container.querySelectorAll('.seating-selection__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const seatId = btn.dataset.seatId;
                toggleSeat(seatId);
            });
        });
    }

    function toggleSeat(seatId) {
        const index = state.selectedSeats.indexOf(seatId);
        if (index > -1) {
            state.selectedSeats.splice(index, 1);
        } else if (state.selectedSeats.length < state.maxSelection) {
            state.selectedSeats.push(seatId);
        }

        state.onSelect([...state.selectedSeats]);
        render();
    }

    render();

    return {
        setBookedSeats: (seats) => {
            state.bookedSeats = seats;
            render();
        },
        setSelectedSeats: (seats) => {
            state.selectedSeats = seats;
            render();
        },
        getSelectedSeats: () => [...state.selectedSeats],
        clearSelection: () => {
            state.selectedSeats = [];
            render();
        }
    };
}

export default { createSeatingChart };
