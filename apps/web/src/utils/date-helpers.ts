/**
 * Date and week manipulation utilities for the scheduler
 */

/**
 * Get the ISO date string for the start of the week (Sunday) containing the given date
 * @param date - The date to find the week start for
 * @returns ISO date string (YYYY-MM-DD) for the Sunday of that week
 */
export function getWeekStartISO(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  // Format as YYYY-MM-DD in local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add a specified number of days to an ISO date string
 * @param iso - ISO date string (YYYY-MM-DD)
 * @param days - Number of days to add (can be negative)
 * @returns New ISO date string
 */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00'); // Force local timezone interpretation
  d.setDate(d.getDate() + days);
  // Format as YYYY-MM-DD in local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the ISO date string for the next week (7 days later)
 * @param iso - ISO date string for current week start
 * @returns ISO date string for next week start
 */
export function nextWeekISO(iso: string): string {
  return addDaysISO(iso, 7);
}

/**
 * Get the ISO date string for the previous week (7 days earlier)
 * @param iso - ISO date string for current week start
 * @returns ISO date string for previous week start
 */
export function previousWeekISO(iso: string): string {
  return addDaysISO(iso, -7);
}

/**
 * Format a time string (HH:mm) to 12-hour format with AM/PM
 * @param time - Time string in 24-hour format (HH:mm)
 * @returns Formatted time string (h:mm AM/PM)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Day names for the week (Sunday-Saturday)
 */
export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Type for tRPC query key for a specific week
 */
export type WeekCacheKey = ["scheduler", "week", string];

/**
 * Generate a query key for a specific week
 * @param isoStart - ISO date string for week start
 * @returns Query key tuple
 */
export function weekKey(isoStart: string): WeekCacheKey {
  return ["scheduler", "week", isoStart];
}
