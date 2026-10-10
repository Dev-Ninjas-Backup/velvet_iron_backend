/**
 * Utility to calculate user-local day boundaries and normalize dates
 * based on IANA timezone (e.g., 'America/New_York') and/or target date ('YYYY-MM-DD').
 */
export function getUserDayBoundaries(
  timezone?: string,
  targetDate?: string,
): { startOfDay: Date; endOfDay: Date; dateStr: string } {
  let tz = (timezone || 'UTC').trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  let year: number;
  let month: number;
  let day: number;

  if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
    const [y, m, d] = targetDate.trim().split('-').map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getVal = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value || '0');
    year = getVal('year');
    month = getVal('month');
    day = getVal('day');
  }

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateStr = `${year}-${mm}-${dd}`;

  // Find UTC timestamp corresponding to local midnight
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  function getOffset(date: Date) {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const p = f.formatToParts(date);
    const v = (type: Intl.DateTimeFormatPartTypes) =>
      Number(p.find((x) => x.type === type)?.value || '0');
    let h = v('hour');
    if (h === 24) h = 0;
    const localUtc = Date.UTC(
      v('year'),
      v('month') - 1,
      v('day'),
      h,
      v('minute'),
      v('second'),
    );
    return localUtc - date.getTime();
  }

  const offset = getOffset(new Date(utcGuess));
  const startOfDay = new Date(utcGuess - offset);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startOfDay, endOfDay, dateStr };
}

/**
 * Extracts the user timezone from HTTP request headers or query params
 */
export function extractTimezone(req?: any): string {
  if (!req) return 'UTC';
  const tzHeader =
    req.headers?.['x-timezone'] ||
    req.headers?.['x-time-zone'] ||
    req.query?.timezone;
  if (tzHeader && typeof tzHeader === 'string' && tzHeader.trim()) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tzHeader.trim() });
      return tzHeader.trim();
    } catch {
      // Fallback to UTC if invalid
    }
  }
  return 'UTC';
}
