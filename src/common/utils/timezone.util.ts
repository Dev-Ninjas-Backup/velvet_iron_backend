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
 * Extracts the user timezone from HTTP request headers, query params, body, or user object,
 * falling back to fallbackTimezone (defaults to 'America/Chicago').
 */
export function extractTimezone(
  req?: any,
  fallbackTimezone: string = 'America/Chicago',
): string {
  if (!req) return fallbackTimezone;
  const candidate =
    req.headers?.['x-timezone'] ||
    req.headers?.['x-time-zone'] ||
    req.headers?.['timezone'] ||
    req.query?.timezone ||
    req.query?.timeZone ||
    req.body?.timezone ||
    req.body?.timeZone ||
    req.user?.userProfile?.timezone ||
    req.user?.timezone;

  if (candidate && typeof candidate === 'string' && candidate.trim()) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: candidate.trim() });
      return candidate.trim();
    } catch {
      // Fallback if invalid
    }
  }
  return fallbackTimezone;
}

/**
 * Formats a Date object in a specified IANA timezone according to a human-readable format.
 * e.g. "Tuesday, October 13, 2026 at 6:45 PM"
 */
export function formatDateInTimezone(
  date: Date,
  timezone: string = 'UTC',
): string {
  let tz = timezone.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  // Example output: "Tuesday, October 13, 2026, 6:45 PM" -> change ", 6:45 PM" to " at 6:45 PM"
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '';
  const minute = parts.find((p) => p.type === 'minute')?.value || '';
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';

  return `${weekday}, ${month} ${day}, ${year} at ${hour}:${minute} ${dayPeriod}`;
}

export interface UserDateMeta {
  formatted: string;
  dayName: string;
  dateKey: string; // YYYY-MM-DD
}

/**
 * Returns localized date meta (formatted string, day of week name, and YYYY-MM-DD key)
 * for any Date in the requested IANA timezone.
 */
export function getUserDateMeta(date: Date, timezone: string = 'UTC'): UserDateMeta {
  let tz = timezone.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  const fullFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
  });

  const dateKeyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const formatted = fullFormatter.format(date);
  const dayName = dayFormatter.format(date);
  const parts = dateKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return {
    formatted,
    dayName,
    dateKey: `${year}-${month}-${day}`,
  };
}

/**
 * Calculates start and end of week (Sunday 00:00:00 to Saturday 23:59:59)
 * for a user in their local timezone.
 */
export function getUserWeekBoundaries(
  timezone: string = 'UTC',
  targetDate?: string,
  weekOffset: number = 0, // 0 = current week, -1 = last week
): {
  startOfWeek: Date;
  endOfWeek: Date;
  days: { dateKey: string; dayName: string; displayDate: string; startOfDay: Date; endOfDay: Date }[];
} {
  const { dateStr } = getUserDayBoundaries(timezone, targetDate);
  // Parse year, month, day of local day
  const [y, m, d] = dateStr.split('-').map(Number);
  
  // Find what day of the week this date is in the user's timezone
  // Sunday = 0 ... Saturday = 6
  const tempDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekdayShort = dayFormatter.format(tempDate);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const currentDayOfWeek = weekdayMap[weekdayShort] ?? 0;

  // Calculate Sunday of target week
  const sundayOffsetDays = -currentDayOfWeek + weekOffset * 7;
  
  const days: { dateKey: string; dayName: string; displayDate: string; startOfDay: Date; endOfDay: Date }[] = [];

  for (let i = 0; i < 7; i++) {
    const dayNumber = d + sundayOffsetDays + i;
    // Construct local date string via UTC calendar arithmetic
    const utcRef = new Date(Date.UTC(y, m - 1, dayNumber, 12, 0, 0));
    const meta = getUserDateMeta(utcRef, timezone);
    const dayBounds = getUserDayBoundaries(timezone, meta.dateKey);
    days.push({
      dateKey: meta.dateKey,
      dayName: meta.dayName,
      displayDate: meta.formatted,
      startOfDay: dayBounds.startOfDay,
      endOfDay: dayBounds.endOfDay,
    });
  }

  return {
    startOfWeek: days[0].startOfDay,
    endOfWeek: days[6].endOfDay,
    days,
  };
}

