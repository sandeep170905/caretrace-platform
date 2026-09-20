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
export declare function parseDate(dateInput: string | number | Date | null | undefined): Date | null;
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
export declare function formatRelativeTime(dateInput: string | number | Date | null | undefined, options?: RelativeTimeOptions): string;
/**
 * Formats a timestamp with relative time + time details.
 * Perfect for ledger blocks, status updates, and audit trails.
 * Examples:
 * - "Just now (12:45 PM)"
 * - "2 hours ago (10:30 AM)"
 * - "Yesterday (4:15 PM)"
 * - "Feb 23, 2026 • 10:15 AM"
 */
export declare function formatSmartTimestamp(dateInput: string | number | Date | null | undefined): string;
//# sourceMappingURL=time.d.ts.map