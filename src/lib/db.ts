/**
 * Simple JSON File Database for Studio Rentals
 *
 * This replaces Supabase with a file-based storage system.
 * Perfect for low-volume applications (2 rooms, ~24 bookings/year).
 *
 * IMPORTANT: All write operations are protected by a mutex lock
 * to prevent race conditions and data corruption.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_KEYS, TTL, invalidateDbCache, getOrSet } from './cache';

// Database file path - relative to project root
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

/**
 * Simple in-memory mutex lock for database operations
 * Prevents race conditions when multiple requests try to write simultaneously
 */
class DatabaseLock {
  private locked: boolean = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

// Global lock instance (singleton for the process)
const dbLock = new DatabaseLock();

/**
 * Execute a function with database lock protection
 * Ensures only one write operation happens at a time
 */
export async function withLock<T>(fn: () => T): Promise<T> {
  await dbLock.acquire();
  try {
    return fn();
  } finally {
    dbLock.release();
  }
}

// Type definitions
export interface Room {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  monthly_rate: number;
  yearly_rate: number;
  amenities: string[];
  images: string[];
  size_sqm: number;
  created_at: string;
  updated_at: string;
  capacity: number;
  featured: boolean;
  slug: string;
  door_code?: string;
  wifi_network?: string;
  wifi_password?: string;
  studio_guide_url?: string;
  checkin_time?: string;
  checkout_time?: string;
}

export interface Guest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  id_type: string;
  id_number: string | null;
  nationality: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  guest_id: string;
  start_date: string;
  end_date: string;
  rental_type: string;
  rate_at_booking: number;
  total_amount: number;
  status: 'pending' | 'pending_payment' | 'confirmed' | 'cancelled';
  stripe_session_id: string | null;
  payment_status: string;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  rate_model: string;
  duration_days: number | null;
  weekly_cleaning_service: boolean;
  cleaning_fee: number;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  signature: string | null;
  signature_accepted_at: string | null;
  contract_sent: boolean;
  contract_sent_at: string | null;
  contract_pdf_url: string | null;
  buffer_days: number;
  reminders_enabled: boolean;
  guest_locale: string;
  payment_method: string;
  expires_at: string | null;
  cancellation_reason: string | null;
  // Receipt tracking fields
  receipt_sent?: boolean;
  receipt_sent_at?: string | null;
}

export interface AvailabilityBlock {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

export interface ProcessedWebhookEvent {
  id: string;           // Stripe event ID (e.g., evt_xxx)
  event_type: string;   // e.g., 'checkout.session.completed'
  processed_at: string; // ISO timestamp
}

export interface AdminSettings {
  id: string;
  // WhatsApp Configuration (TextMeBot)
  whatsapp_enabled: boolean;

  // Contract Delivery Toggles
  automation_contract_whatsapp: boolean;
  automation_contract_email: boolean;

  // Check-in Reminder Toggles
  automation_checkin_7d: boolean;
  automation_checkin_3d: boolean;
  automation_checkin_same: boolean;

  // Pre-Arrival Toggle
  automation_pre_arrival: boolean;

  // Check-out Reminder Toggles
  automation_checkout_7d: boolean;
  automation_checkout_3d: boolean;
  automation_checkout_same: boolean;

  // Admin WhatsApp Notifications
  admin_whatsapp_number: string;
  admin_notify_booking_created: boolean;
  admin_notify_payment_confirmed: boolean;
  admin_notify_bank_transfer: boolean;

  // Timestamps
  updated_at: string;
}

export interface Database {
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  availabilityBlocks: AvailabilityBlock[];
  processedWebhookEvents: ProcessedWebhookEvent[];
  adminSettings?: AdminSettings;
}

/**
 * Read entire database from JSON file (uncached - for internal use)
 * Use readDB() for cached reads in most cases
 */
function readDBFromFile(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    // Return empty database structure if file doesn't exist
    return {
      rooms: [],
      guests: [],
      bookings: [],
      availabilityBlocks: [],
      processedWebhookEvents: []
    };
  }
}

/**
 * Read entire database from JSON file with caching
 * Cached for 30 seconds to reduce file I/O
 */
export function readDB(): Database {
  return getOrSet(CACHE_KEYS.DATABASE, () => readDBFromFile(), TTL.MEDIUM);
}

/**
 * Force a fresh read bypassing the cache
 * Use this when you need guaranteed fresh data
 */
export function readDBFresh(): Database {
  invalidateDbCache();
  return readDBFromFile();
}

/**
 * Write entire database to JSON file using atomic write pattern
 * Writes to a temp file first, then renames (atomic on most filesystems)
 * Also invalidates all database caches to ensure consistency
 */
export function writeDB(data: Database): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to temporary file first
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // Atomic rename (prevents partial writes from corrupting the file)
    fs.renameSync(tempPath, DB_PATH);

    // Invalidate all database caches after write
    invalidateDbCache();
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}

/**
 * Generate a new UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

// ============ ROOM FUNCTIONS ============

/**
 * Get all rooms (cached for 5 minutes - room data rarely changes)
 */
export function getAllRooms(): Room[] {
  return getOrSet(CACHE_KEYS.ROOMS, () => {
    const db = readDB();
    return db.rooms;
  }, TTL.LONG);
}

/**
 * Get room by ID
 */
export function getRoomById(id: string): Room | null {
  const db = readDB();
  return db.rooms.find(r => r.id === id) || null;
}

/**
 * Get room by slug
 */
export function getRoomBySlug(slug: string): Room | null {
  const db = readDB();
  return db.rooms.find(r => r.slug === slug) || null;
}

/**
 * Get featured rooms
 */
export function getFeaturedRooms(): Room[] {
  const db = readDB();
  return db.rooms.filter(r => r.featured);
}

/**
 * Update a room by ID
 */
export function updateRoom(id: string, updates: Partial<Omit<Room, 'id' | 'created_at'>>): Room | null {
  const db = readDB();
  const index = db.rooms.findIndex(r => r.id === id);

  if (index === -1) {
    return null;
  }

  const updatedRoom: Room = {
    ...db.rooms[index],
    ...updates,
    updated_at: now(),
  };

  db.rooms[index] = updatedRoom;
  writeDB(db);
  invalidateDbCache();

  return updatedRoom;
}

/**
 * Update a room with lock protection
 */
export async function updateRoomLocked(
  id: string,
  updates: Partial<Omit<Room, 'id' | 'created_at'>>
): Promise<Room | null> {
  return withLock(() => updateRoom(id, updates));
}

// ============ GUEST FUNCTIONS ============

/**
 * Get all guests (cached for 30 seconds)
 */
export function getAllGuests(): Guest[] {
  return getOrSet(CACHE_KEYS.GUESTS, () => {
    const db = readDB();
    return db.guests;
  }, TTL.MEDIUM);
}

/**
 * Get guest by ID
 */
export function getGuestById(id: string): Guest | null {
  const db = readDB();
  return db.guests.find(g => g.id === id) || null;
}

/**
 * Get guest by email
 */
export function getGuestByEmail(email: string): Guest | null {
  const db = readDB();
  return db.guests.find(g => g.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Create or update guest (upsert by email)
 */
export function upsertGuest(guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Guest {
  const db = readDB();
  const existingGuest = db.guests.find(g => g.email.toLowerCase() === guestData.email.toLowerCase());

  if (existingGuest) {
    // Update existing guest
    const updatedGuest = {
      ...existingGuest,
      ...guestData,
      updated_at: now()
    };
    const index = db.guests.findIndex(g => g.id === existingGuest.id);
    db.guests[index] = updatedGuest;
    writeDB(db);
    return updatedGuest;
  } else {
    // Create new guest
    const newGuest: Guest = {
      id: generateId(),
      ...guestData,
      created_at: now(),
      updated_at: now()
    };
    db.guests.push(newGuest);
    writeDB(db);
    return newGuest;
  }
}

/**
 * Create or update guest with lock protection
 * Use this in API routes to prevent race conditions
 */
export async function upsertGuestLocked(guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Promise<Guest> {
  return withLock(() => upsertGuest(guestData));
}

// ============ BOOKING FUNCTIONS ============

/**
 * Get all bookings (cached for 30 seconds)
 */
export function getAllBookings(): Booking[] {
  return getOrSet(CACHE_KEYS.BOOKINGS, () => {
    const db = readDB();
    return db.bookings;
  }, TTL.MEDIUM);
}

/**
 * Get booking by ID
 */
export function getBookingById(id: string): Booking | null {
  const db = readDB();
  return db.bookings.find(b => b.id === id) || null;
}

/**
 * Get bookings by room ID
 */
export function getBookingsByRoomId(roomId: string): Booking[] {
  const db = readDB();
  return db.bookings.filter(b => b.room_id === roomId);
}

/**
 * Get active bookings for a room (not cancelled)
 */
export function getActiveBookingsForRoom(roomId: string): Booking[] {
  const db = readDB();
  return db.bookings.filter(b =>
    b.room_id === roomId &&
    b.status !== 'cancelled'
  );
}

/**
 * Check if date range is available for a room
 */
export function isDateRangeAvailable(roomId: string, startDate: string, endDate: string, excludeBookingId?: string): boolean {
  const activeBookings = getActiveBookingsForRoom(roomId);

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const booking of activeBookings) {
    // Skip the booking we're updating (if provided)
    if (excludeBookingId && booking.id === excludeBookingId) continue;

    const bookingStart = new Date(booking.start_date);
    const bookingEnd = new Date(booking.end_date);

    // Check for overlap: ranges overlap if start1 <= end2 AND end1 >= start2
    if (start <= bookingEnd && end >= bookingStart) {
      return false;
    }
  }

  return true;
}

/**
 * Create a new booking
 */
export function createBooking(bookingData: Partial<Booking>): Booking {
  const db = readDB();

  const newBooking: Booking = {
    id: generateId(),
    room_id: bookingData.room_id || '',
    guest_id: bookingData.guest_id || '',
    start_date: bookingData.start_date || '',
    end_date: bookingData.end_date || '',
    rental_type: bookingData.rental_type || 'monthly',
    rate_at_booking: bookingData.rate_at_booking || 0,
    total_amount: bookingData.total_amount || 0,
    status: bookingData.status || 'pending_payment',
    stripe_session_id: bookingData.stripe_session_id || null,
    payment_status: bookingData.payment_status || 'pending',
    created_at: now(),
    confirmed_at: bookingData.confirmed_at || null,
    cancelled_at: bookingData.cancelled_at || null,
    notes: bookingData.notes || null,
    rate_model: bookingData.rate_model || 'monthly',
    duration_days: bookingData.duration_days || null,
    weekly_cleaning_service: bookingData.weekly_cleaning_service || false,
    cleaning_fee: bookingData.cleaning_fee || 0,
    terms_accepted: bookingData.terms_accepted || false,
    terms_accepted_at: bookingData.terms_accepted_at || null,
    signature: bookingData.signature || null,
    signature_accepted_at: bookingData.signature_accepted_at || null,
    contract_sent: bookingData.contract_sent || false,
    contract_sent_at: bookingData.contract_sent_at || null,
    contract_pdf_url: bookingData.contract_pdf_url || null,
    buffer_days: bookingData.buffer_days || 2,
    reminders_enabled: bookingData.reminders_enabled ?? true,
    guest_locale: bookingData.guest_locale || 'en',
    payment_method: bookingData.payment_method || 'bank_transfer',
    expires_at: bookingData.expires_at || null,
    cancellation_reason: bookingData.cancellation_reason || null
  };

  db.bookings.push(newBooking);
  writeDB(db);
  return newBooking;
}

/**
 * Create a new booking with lock protection
 * Use this in API routes to prevent race conditions
 */
export async function createBookingLocked(bookingData: Partial<Booking>): Promise<Booking> {
  return withLock(() => createBooking(bookingData));
}

/**
 * Update a booking
 */
export function updateBooking(id: string, updates: Partial<Booking>): Booking | null {
  const db = readDB();
  const index = db.bookings.findIndex(b => b.id === id);

  if (index === -1) return null;

  db.bookings[index] = {
    ...db.bookings[index],
    ...updates
  };

  writeDB(db);
  return db.bookings[index];
}

/**
 * Update a booking with lock protection
 * Use this in API routes to prevent race conditions
 */
export async function updateBookingLocked(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  return withLock(() => updateBooking(id, updates));
}

/**
 * Update booking status
 */
export function updateBookingStatus(id: string, status: Booking['status'], additionalData?: Partial<Booking>): Booking | null {
  const updates: Partial<Booking> = { status, ...additionalData };

  if (status === 'confirmed') {
    updates.confirmed_at = now();
  } else if (status === 'cancelled') {
    updates.cancelled_at = now();
  }

  return updateBooking(id, updates);
}

/**
 * Update booking status with lock protection
 * Use this in API routes to prevent race conditions
 */
export async function updateBookingStatusLocked(
  id: string,
  status: Booking['status'],
  additionalData?: Partial<Booking>
): Promise<Booking | null> {
  return withLock(() => updateBookingStatus(id, status, additionalData));
}

/**
 * Get bookings with filters
 */
export function getBookingsWithFilters(filters: {
  status?: string;
  roomId?: string;
  startDate?: string;
  endDate?: string;
}): Booking[] {
  let bookings = getAllBookings();

  if (filters.status) {
    bookings = bookings.filter(b => b.status === filters.status);
  }

  if (filters.roomId) {
    bookings = bookings.filter(b => b.room_id === filters.roomId);
  }

  if (filters.startDate) {
    bookings = bookings.filter(b => b.start_date >= filters.startDate!);
  }

  if (filters.endDate) {
    bookings = bookings.filter(b => b.end_date <= filters.endDate!);
  }

  return bookings;
}

// ============ AVAILABILITY BLOCK FUNCTIONS ============

/**
 * Get all availability blocks (cached for 30 seconds)
 */
export function getAllAvailabilityBlocks(): AvailabilityBlock[] {
  return getOrSet(CACHE_KEYS.AVAILABILITY, () => {
    const db = readDB();
    return db.availabilityBlocks;
  }, TTL.MEDIUM);
}

/**
 * Get availability blocks for a room
 */
export function getAvailabilityBlocksForRoom(roomId: string): AvailabilityBlock[] {
  const db = readDB();
  return db.availabilityBlocks.filter(ab => ab.room_id === roomId);
}

/**
 * Create an availability block
 */
export function createAvailabilityBlock(blockData: Omit<AvailabilityBlock, 'id' | 'created_at'>): AvailabilityBlock {
  const db = readDB();

  const newBlock: AvailabilityBlock = {
    id: generateId(),
    ...blockData,
    created_at: now()
  };

  db.availabilityBlocks.push(newBlock);
  writeDB(db);
  return newBlock;
}

/**
 * Delete an availability block
 */
export function deleteAvailabilityBlock(id: string): boolean {
  const db = readDB();
  const index = db.availabilityBlocks.findIndex(ab => ab.id === id);

  if (index === -1) return false;

  db.availabilityBlocks.splice(index, 1);
  writeDB(db);
  return true;
}

// ============ STATS FUNCTIONS ============

/**
 * Get booking statistics
 */
export function getBookingStats(): {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;
} {
  const bookings = getAllBookings();

  return {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending' || b.status === 'pending_payment').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_amount, 0)
  };
}

// ============ WEBHOOK IDEMPOTENCY FUNCTIONS ============

/**
 * Check if a webhook event has already been processed
 */
export function isWebhookEventProcessed(eventId: string): boolean {
  const db = readDBFresh(); // Use fresh read to avoid cache issues for idempotency checks
  // Handle migration: old databases may not have this collection
  if (!db.processedWebhookEvents) {
    return false;
  }
  return db.processedWebhookEvents.some(e => e.id === eventId);
}

/**
 * Mark a webhook event as processed
 */
export function markWebhookEventProcessed(eventId: string, eventType: string): ProcessedWebhookEvent {
  const db = readDBFresh(); // Use fresh read for write operations

  // Handle migration: ensure the collection exists
  if (!db.processedWebhookEvents) {
    db.processedWebhookEvents = [];
  }

  const event: ProcessedWebhookEvent = {
    id: eventId,
    event_type: eventType,
    processed_at: now()
  };

  db.processedWebhookEvents.push(event);
  writeDB(db);
  return event;
}

/**
 * Mark a webhook event as processed with lock protection
 * Use this in API routes to prevent race conditions
 */
export async function markWebhookEventProcessedLocked(eventId: string, eventType: string): Promise<ProcessedWebhookEvent> {
  return withLock(() => markWebhookEventProcessed(eventId, eventType));
}

/**
 * Check and mark webhook event atomically (with lock)
 * Returns true if the event was already processed, false if it's new
 * If new, it marks the event as processed before returning
 */
export async function checkAndMarkWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
  return withLock(() => {
    if (isWebhookEventProcessed(eventId)) {
      return true; // Already processed
    }
    markWebhookEventProcessed(eventId, eventType);
    return false; // Newly marked as processed
  });
}

/**
 * Clean up old processed webhook events (older than specified days)
 * Call this periodically to prevent the collection from growing indefinitely
 */
export function cleanupOldWebhookEvents(daysToKeep: number = 30): number {
  const db = readDBFresh();

  if (!db.processedWebhookEvents) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffISO = cutoffDate.toISOString();

  const originalLength = db.processedWebhookEvents.length;
  db.processedWebhookEvents = db.processedWebhookEvents.filter(
    e => e.processed_at >= cutoffISO
  );

  const removedCount = originalLength - db.processedWebhookEvents.length;

  if (removedCount > 0) {
    writeDB(db);
  }

  return removedCount;
}

/**
 * Clean up old webhook events with lock protection
 */
export async function cleanupOldWebhookEventsLocked(daysToKeep: number = 30): Promise<number> {
  return withLock(() => cleanupOldWebhookEvents(daysToKeep));
}

// ============ ADMIN SETTINGS FUNCTIONS ============

/**
 * Default admin settings (all automations enabled for backwards compatibility)
 */
export const DEFAULT_ADMIN_SETTINGS: Omit<AdminSettings, 'id' | 'updated_at'> = {
  whatsapp_enabled: true,
  automation_contract_whatsapp: true,
  automation_contract_email: true,
  automation_checkin_7d: true,
  automation_checkin_3d: true,
  automation_checkin_same: true,
  automation_pre_arrival: true,
  automation_checkout_7d: true,
  automation_checkout_3d: true,
  automation_checkout_same: true,
  // Admin notifications - disabled by default until phone is configured
  admin_whatsapp_number: '',
  admin_notify_booking_created: false,
  admin_notify_payment_confirmed: false,
  admin_notify_bank_transfer: false,
};

/**
 * Get admin settings (creates default if doesn't exist)
 */
export function getAdminSettings(): AdminSettings {
  const db = readDB();

  if (!db.adminSettings) {
    // Create default settings
    const settings: AdminSettings = {
      id: generateId(),
      ...DEFAULT_ADMIN_SETTINGS,
      updated_at: now(),
    };
    db.adminSettings = settings;
    writeDB(db);
    return settings;
  }

  return db.adminSettings;
}

/**
 * Update admin settings
 */
export function updateAdminSettings(updates: Partial<Omit<AdminSettings, 'id'>>): AdminSettings {
  const db = readDB();
  const current = db.adminSettings || {
    id: generateId(),
    ...DEFAULT_ADMIN_SETTINGS,
    updated_at: now(),
  };

  const updated: AdminSettings = {
    ...current,
    ...updates,
    updated_at: now(),
  };

  db.adminSettings = updated;
  writeDB(db);
  return updated;
}

/**
 * Update admin settings with lock protection
 * Use this in API routes to prevent race conditions
 */
export async function updateAdminSettingsLocked(
  updates: Partial<Omit<AdminSettings, 'id'>>
): Promise<AdminSettings> {
  return withLock(() => updateAdminSettings(updates));
}

/**
 * Check if a specific automation is enabled
 * Returns true if the setting doesn't exist (backwards compatible)
 */
export function isAutomationEnabled(
  automation: keyof Omit<AdminSettings, 'id' | 'updated_at' | 'whatsapp_enabled' | 'admin_whatsapp_number'>
): boolean {
  const settings = getAdminSettings();
  return settings[automation] ?? true;
}

/**
 * Check if WhatsApp notifications are globally enabled
 */
export function isWhatsAppEnabled(): boolean {
  const settings = getAdminSettings();
  return settings.whatsapp_enabled ?? true;
}

// ============ CACHE UTILITIES ============
// Re-export cache utilities for external use

export { invalidateDbCache, cache, CACHE_KEYS, TTL } from './cache';
