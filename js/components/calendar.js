/**
 * EasySlots - Calendar Component
 * Date picker and calendar for slot selection
 */

/**
 * Create a calendar component
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Calendar options
 * @returns {Object} Calendar instance
 */
export function createCalendar(container, options = {}) {
    const state = {
        currentDate: new Date(),
        selectedDate: options.selectedDate || null,
        availableDates: options.availableDates || [],
        minDate: options.minDate || new Date(),
        maxDate: options.maxDate || null,
        onSelect: options.onSelect || (() => {})
    };

    function render() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let html = `
            <div class="calendar calendar--bordered">
                <div class="calendar__header">
                    <button class="calendar__nav-btn" data-action="prev">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <span class="calendar__title">${monthNames[month]} ${year}</span>
                    <button class="calendar__nav-btn" data-action="next">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                <div class="calendar__weekdays">
                    ${dayNames.map(d => `<div class="calendar__weekday">${d}</div>`).join('')}
                </div>
                <div class="calendar__days">
        `;

        // Previous month's trailing days
        const prevMonth = new Date(year, month, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            html += `<button class="calendar__day calendar__day--outside" disabled>${day}</button>`;
        }

        // Current month's days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = date.getTime() === today.getTime();
            const isSelected = state.selectedDate && date.getTime() === new Date(state.selectedDate).setHours(0, 0, 0, 0);
            const isPast = date < state.minDate;
            const hasSlots = state.availableDates.includes(dateStr);

            let classes = ['calendar__day'];
            if (isToday) classes.push('calendar__day--today');
            if (isSelected) classes.push('calendar__day--selected');
            if (isPast) classes.push('calendar__day--disabled');
            if (hasSlots) classes.push('calendar__day--has-slots');

            html += `<button class="${classes.join(' ')}" data-date="${dateStr}" ${isPast ? 'disabled' : ''}>${day}</button>`;
        }

        // Next month's leading days
        const remainingDays = 42 - (startDay + daysInMonth);
        for (let day = 1; day <= remainingDays; day++) {
            html += `<button class="calendar__day calendar__day--outside" disabled>${day}</button>`;
        }

        html += '</div></div>';
        container.innerHTML = html;

        // Attach events
        container.querySelectorAll('.calendar__nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'prev') {
                    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                } else {
                    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                }
                render();
            });
        });

        container.querySelectorAll('.calendar__day:not([disabled])').forEach(day => {
            day.addEventListener('click', () => {
                state.selectedDate = day.dataset.date;
                state.onSelect(state.selectedDate);
                render();
            });
        });
    }

    render();

    return {
        setAvailableDates: (dates) => {
            state.availableDates = dates;
            render();
        },
        setSelectedDate: (date) => {
            state.selectedDate = date;
            render();
        },
        getSelectedDate: () => state.selectedDate
    };
}

export default { createCalendar };
