/**
 * EasySlots - Application Constants
 */

export const CONSTANTS = {
    // App Info
    APP_NAME: 'EasySlots',
    APP_VERSION: '1.0.0',

    // Locale Settings
    CURRENCY: 'EUR',
    CURRENCY_SYMBOL: '€',
    DATE_FORMAT: 'DD.MM.YYYY',
    TIME_FORMAT: 'HH:mm',
    LOCALE: 'de-DE',

    // Event Categories
    CATEGORIES: [
        { id: 'fitness', name: 'Fitness', icon: 'dumbbell' },
        { id: 'music', name: 'Music', icon: 'music' },
        { id: 'coaching', name: 'Coaching', icon: 'user-check' },
        { id: 'rentals', name: 'Rentals', icon: 'home' },
        { id: 'workshop', name: 'Workshop', icon: 'tool' },
        { id: 'other', name: 'Other', icon: 'grid' }
    ],

    // Booking Statuses
    BOOKING_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        CANCELLED: 'cancelled',
        REFUNDED: 'refunded',
        COMPLETED: 'completed'
    },

    // Event Statuses
    EVENT_STATUS: {
        DRAFT: 'draft',
        ACTIVE: 'active',
        PAUSED: 'paused',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed'
    },

    // Ticket Statuses
    TICKET_STATUS: {
        VALID: 'valid',
        USED: 'used',
        EXPIRED: 'expired',
        CANCELLED: 'cancelled'
    },

    // User Roles
    USER_ROLES: {
        BUYER: 'buyer',
        VENDOR: 'vendor',
        ADMIN: 'admin'
    },

    // Booking Types
    BOOKING_TYPES: {
        SPOTS: 'spots',
        SEATING: 'seating'
    },

    // Event Types
    EVENT_TYPES: {
        SINGLE: 'single',
        RECURRING: 'recurring'
    },

    // Limits
    MAX_SPOTS_PER_BOOKING: 10,
    MAX_IMAGE_SIZE_MB: 5,
    MAX_EVENTS_PER_PAGE: 12,
    MAX_BOOKINGS_PER_PAGE: 20,

    // Platform Fee (percentage)
    PLATFORM_FEE_PERCENT: 5,

    // Cancellation Policies
    CANCELLATION_POLICIES: {
        FLEXIBLE: {
            id: 'flexible',
            name: 'Flexible',
            description: 'Full refund up to 24 hours before',
            refundHours: 24,
            refundPercent: 100
        },
        MODERATE: {
            id: 'moderate',
            name: 'Moderate',
            description: 'Full refund up to 7 days before',
            refundDays: 7,
            refundPercent: 100
        },
        STRICT: {
            id: 'strict',
            name: 'Strict',
            description: '50% refund up to 7 days before',
            refundDays: 7,
            refundPercent: 50
        },
        NONE: {
            id: 'none',
            name: 'No refunds',
            description: 'No refunds available',
            refundPercent: 0
        }
    },

    // Time slot durations (in minutes)
    SLOT_DURATIONS: [15, 30, 45, 60, 90, 120, 180, 240],

    // Days of week
    DAYS_OF_WEEK: [
        { value: 0, short: 'Sun', long: 'Sunday' },
        { value: 1, short: 'Mon', long: 'Monday' },
        { value: 2, short: 'Tue', long: 'Tuesday' },
        { value: 3, short: 'Wed', long: 'Wednesday' },
        { value: 4, short: 'Thu', long: 'Thursday' },
        { value: 5, short: 'Fri', long: 'Friday' },
        { value: 6, short: 'Sat', long: 'Saturday' }
    ],

    // API Endpoints (for Cloud Functions)
    API: {
        CREATE_CHECKOUT: '/api/createCheckoutSession',
        WEBHOOK: '/api/stripeWebhook',
        VALIDATE_TICKET: '/api/validateTicket',
        CONNECT_ACCOUNT: '/api/createConnectAccount'
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'easyslots_auth',
        USER_DATA: 'easyslots_user',
        CART: 'easyslots_cart',
        THEME: 'easyslots_theme'
    },

    // Toast durations (in ms)
    TOAST_DURATION: {
        SHORT: 3000,
        NORMAL: 5000,
        LONG: 8000
    }
};

// Freeze the constants object to prevent modifications
Object.freeze(CONSTANTS);
Object.freeze(CONSTANTS.CATEGORIES);
Object.freeze(CONSTANTS.BOOKING_STATUS);
Object.freeze(CONSTANTS.EVENT_STATUS);
Object.freeze(CONSTANTS.TICKET_STATUS);
Object.freeze(CONSTANTS.USER_ROLES);
Object.freeze(CONSTANTS.CANCELLATION_POLICIES);

export default CONSTANTS;
