/**
 * Time and date formatting utilities for CareTrace.
 * Converts ISO timestamps and date objects into human-readable relative time strings
 * ("Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago")
 * or clean formatted dates for older records.
 */

export interface RelativeTimeOptions {
  /** If true, returns detailed time even for older dates e.g. "Feb 23, 2026, 10:30 AM" */
  includeTime?: boolean;
  /** Fallback string if date is missing or invalid */
  fallback?: string;
}

/**
 * Parses any date input safely into a Date object or null if invalid.
 */
export function parseDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns a human-friendly relative time string.
 * Examples:
 * - "Just now" (under 45s)
 * - "2 minutes ago"
 * - "1 hour ago" / "4 hours ago"
 * - "Yesterday"
 * - "3 days ago"
 * - "2 weeks ago"
 * - "Feb 14, 2026" (for dates older than a month)
 */
export function formatRelativeTime(
  dateInput: string | number | Date | null | undefined,
  options?: RelativeTimeOptions
): string {
  const date = parseDate(dateInput);
  if (!date) return options?.fallback || 'Recently';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  // Future dates (slight clock skew or scheduled items)
  if (diffSec < 0) {
    if (Math.abs(diffSec) < 60) return 'Just now';
    if (Math.abs(diffMin) < 60) return `In ${Math.abs(diffMin)}m`;
    if (Math.abs(diffHour) < 24) return `In ${Math.abs(diffHour)}h`;
    return `In ${Math.abs(diffDays)}d`;
  }

  if (diffSec < 45) {
    return 'Just now';
  }
  if (diffMin < 60) {
    return diffMin <= 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }
  if (diffHour < 24) {
    return diffHour <= 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks <= 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  // Older dates: format clearly with month and day
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const currentYear = now.getFullYear();

  const formattedDate = year === currentYear ? `${month} ${day}` : `${month} ${day}, ${year}`;

  if (options?.includeTime) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedDate} • ${formattedHours}:${minutes} ${ampm}`;
  }

  return formattedDate;
}

/**
 * Formats a timestamp with relative time + time details.
 * Perfect for ledger blocks, status updates, and audit trails.
 * Examples:
 * - "Just now (12:45 PM)"
 * - "2 hours ago (10:30 AM)"
 * - "Yesterday (4:15 PM)"
 * - "Feb 23, 2026 • 10:15 AM"
 */
export function formatSmartTimestamp(
  dateInput: string | number | Date | null | undefined
): string {
  const date = parseDate(dateInput);
  if (!date) return 'Recently';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffHour = Math.floor(diffSec / 3600);
  const diffDays = Math.floor(diffHour / 24);

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const timeStr = `${formattedHours}:${minutes} ${ampm}`;

  if (diffSec >= 0 && diffSec < 45) {
    return `Just now (${timeStr})`;
  }
  if (diffSec >= 0 && diffHour < 1) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `${mins}m ago (${timeStr})`;
  }
  if (diffSec >= 0 && diffHour < 24) {
    return `${diffHour}h ago (${timeStr})`;
  }
  if (diffDays === 1) {
    return `Yesterday (${timeStr})`;
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago (${timeStr})`;
  }

  // Older: standard readable format
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year} • ${timeStr}`;
}

