import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate or retrieve anonymous user ID from localStorage
 * This acts as a session identifier for chat users
 * Uses crypto.randomUUID() with fallback for environments without crypto
 * Includes timestamp and random string to ensure uniqueness across concurrent sessions
 */
export function getOrCreateAnonymousUserId(): string {
  if (typeof window === 'undefined') {
    // Return a placeholder for server-side rendering
    return 'anonymous-server-' + Date.now();
  }

  const storageKey = 'hotel_booking_anonymous_user_id';
  let userId = localStorage.getItem(storageKey);

  if (!userId) {
    // Try to use crypto.randomUUID() first (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      userId = crypto.randomUUID();
    } else {
      // Fallback: generate a very unique ID using timestamp and random string
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      const sessionId = Math.random().toString(36).substring(2, 10);
      userId = `anonymous-${timestamp}-${randomStr}-${sessionId}`;
    }
    localStorage.setItem(storageKey, userId);
  }

  return userId;
}

/**
 * Clear the anonymous user ID from localStorage
 */
export function clearAnonymousUserId(): void {
  if (typeof window === 'undefined') return;
  
  const storageKey = 'hotel_booking_anonymous_user_id';
  localStorage.removeItem(storageKey);
}
