const LIMA_TZ = 'America/Lima';
const LOCALE = 'es-PE';

/**
 * Format a date-only string (YYYY-MM-DD) for display without UTC off-by-one.
 * Parses as local date to avoid timezone shift.
 */
export function formatFecha(
  dateStr: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, opts);
}

/**
 * Format a datetime string (ISO 8601) for display in Lima timezone.
 */
export function formatFechaHora(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(LOCALE, {
    timeZone: LIMA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns today's date as YYYY-MM-DD in Lima timezone.
 * Use instead of new Date().toISOString().split('T')[0] which gives UTC date.
 */
export function hoyLima(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: LIMA_TZ });
}

/**
 * Returns current month number (1-12) in Lima timezone.
 */
export function mesActualLima(): number {
  return parseInt(new Date().toLocaleDateString('en-CA', { timeZone: LIMA_TZ }).split('-')[1], 10);
}
