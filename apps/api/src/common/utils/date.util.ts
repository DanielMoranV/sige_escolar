/**
 * Returns today's date as YYYY-MM-DD in Lima/Peru timezone (America/Lima, UTC-5).
 * Use instead of new Date().toISOString().split('T')[0] which gives UTC date.
 */
export function getLimaDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}
