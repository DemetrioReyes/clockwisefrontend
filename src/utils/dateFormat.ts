/**
 * Utility functions for date formatting
 * All dates are formatted in US format (MM/DD/YYYY) as the system is for United States
 */

/**
 * Formats a date string to US format (MM/DD/YYYY)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in MM/DD/YYYY format
 */
export const formatDateUS = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Formats a date string to US format with time (MM/DD/YYYY, HH:MM AM/PM)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTimeUS = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a date string to US format with short month name (MMM DD, YYYY)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string like "Jan 15, 2025"
 */
export const formatDateShortUS = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a date string to US format with long month name (MMMM DD, YYYY)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string like "January 15, 2025"
 */
export const formatDateLongUS = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
