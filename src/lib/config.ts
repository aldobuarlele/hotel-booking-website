// Global configuration constants for the hotel booking system

// File upload configuration
export const MAX_FILE_SIZE_MB = 2;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const VALID_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Bank account information for payments
export const BANK_ACCOUNT_NUMBER = 'BCA 1234567890 a.n. Hotel Booking';

// Application settings
export const APP_NAME = 'Hotel Booking System';
export const HOTEL_NAME = 'LuxuryStay';
export const CURRENCY = 'IDR';
export const DEFAULT_LOCALE = 'id-ID';

// Date formatting
export const DATE_FORMAT = DEFAULT_LOCALE;
export const DATE_DISPLAY_FORMAT = {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
} as const;

// Booking settings
export const MIN_BOOKING_DAYS = 1;
export const MAX_BOOKING_DAYS = 30;

// Supabase configuration
export const SUPABASE_BUCKETS = {
  ROOM_PHOTOS: 'room-photos'
} as const;

// Database table names
export const DB_TABLES = {
  ROOMS: 'rooms',
  BOOKINGS: 'bookings',
  CHAT_MESSAGES: 'chat_messages'
} as const;

// Room status enum (matches database enum)
export const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  TEMPORARILY_RESERVED: 'TEMPORARILY_RESERVED',
  INQUIRY_ONLY: 'INQUIRY_ONLY'
} as const;

// Payment status enum (matches database enum)
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  ANONYMOUS: 'anonymous'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  SEND_MESSAGE_FAILED: 'Gagal mengirim pesan. Silakan coba lagi.',
  FETCH_MESSAGES_FAILED: 'Gagal mengambil pesan.',
  RELEASE_ROOM_FAILED: 'Gagal melepas kamar. Silakan coba lagi.',
  UPLOAD_FILE_TOO_LARGE: (maxSizeMB: number) => `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`,
  UPLOAD_FILE_INVALID_TYPE: (validTypes: string[]) => `Format file tidak didukung. Gunakan ${validTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()}.`,
  SAVE_ROOM_FAILED: 'Gagal menyimpan kamar. Silakan coba lagi.',
  DELETE_ROOM_FAILED: 'Gagal menghapus kamar. Silakan coba lagi.',
  LOGIN_FAILED: 'Login gagal. Periksa email dan password Anda.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ROOM_RELEASED: 'Kamar berhasil dilepas dan sekarang tersedia untuk booking.',
  ROOM_SAVED: (isEditing: boolean) => isEditing ? 'Kamar berhasil diperbarui!' : 'Kamar baru berhasil ditambahkan!',
  MESSAGE_SENT: 'Pesan berhasil dikirim.'
} as const;

// UI labels
export const UI_LABELS = {
  ROOM_STATUS: {
    AVAILABLE: 'Tersedia',
    TEMPORARILY_RESERVED: 'Sementara Dipesan',
    INQUIRY_ONLY: 'Hanya Inquiry'
  },
  PAYMENT_STATUS: {
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Lunas',
    FAILED: 'Gagal',
    REFUNDED: 'Dikembalikan'
  }
} as const;
