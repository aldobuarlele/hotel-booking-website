// Global configuration constants for the hotel booking system

// File upload configuration
export const MAX_FILE_SIZE_MB = 2;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const VALID_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Bank account information for payments
export const BANK_ACCOUNT_NUMBER = 'BCA 1234567890 a.n. Hotel Booking';

// Application settings
export const APP_NAME = 'Hotel Booking System';
export const CURRENCY = 'IDR';

// Date formatting
export const DATE_FORMAT = 'id-ID';
export const DATE_DISPLAY_FORMAT = {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
} as const;

// Booking settings
export const MIN_BOOKING_DAYS = 1;
export const MAX_BOOKING_DAYS = 30;