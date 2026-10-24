/**
 * Maps weekday names, abbreviations, and day numbers to ISO-8601 integers (1=Monday ... 7=Sunday).
 */
export const WEEKDAY_MAP: Record<string, number> = {
  monday: 1,
  mon: 1,
  m: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  tu: 2,
  wednesday: 3,
  wed: 3,
  w: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  th: 4,
  friday: 5,
  fri: 5,
  f: 5,
  saturday: 6,
  sat: 6,
  sa: 6,
  sunday: 7,
  sun: 7,
  su: 7,
};

/**
 * Normalizes daysOfWeek input from integers, numeric strings, comma-separated lists, JSON arrays,
 * or weekday names (e.g. "MONDAY", "WEDNESDAY") and aliases (repeatDays, days, weekdays, selectedDays)
 * into a sorted unique array of integers [1..7] (1=Monday ... 7=Sunday).
 * Crucially maps 0 (JavaScript Date Sunday) to 7.
 */
export function normalizeDaysOfWeek(value: unknown, obj?: any): number[] | undefined {
  let input =
    value !== undefined && value !== null && value !== ''
      ? value
      : obj?.repeatDays !== undefined && obj?.repeatDays !== null && obj?.repeatDays !== ''
      ? obj?.repeatDays
      : obj?.days !== undefined && obj?.days !== null && obj?.days !== ''
      ? obj?.days
      : obj?.weekdays !== undefined && obj?.weekdays !== null && obj?.weekdays !== ''
      ? obj?.weekdays
      : obj?.selectedDays !== undefined && obj?.selectedDays !== null && obj?.selectedDays !== ''
      ? obj?.selectedDays
      : undefined;

  if (input === undefined) return undefined;

  // If input is a stringified JSON array, parse it
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        input = JSON.parse(trimmed);
      } catch {
        // Fall back to delimited string processing below
      }
    }
  }

  // If input is a string containing commas, split it
  let rawItems: unknown[] = [];
  if (Array.isArray(input)) {
    rawItems = input;
  } else if (typeof input === 'string') {
    rawItems = input.includes(',') ? input.split(',') : [input];
  } else {
    rawItems = [input];
  }

  const result: number[] = [];

  for (const raw of rawItems) {
    if (typeof raw === 'number' && Number.isInteger(raw)) {
      if (raw >= 1 && raw <= 7) {
        result.push(raw);
      } else if (raw === 0) {
        // Sunday in JS Date is 0 -> map to ISO 7
        result.push(7);
      }
    } else if (typeof raw === 'string') {
      const trimmed = raw.trim().toLowerCase();
      if (trimmed === '') continue;

      if (WEEKDAY_MAP[trimmed] !== undefined) {
        result.push(WEEKDAY_MAP[trimmed]);
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          if (num >= 1 && num <= 7) {
            result.push(num);
          } else if (num === 0) {
            result.push(7);
          }
        }
      }
    }
  }

  return result.length > 0 ? Array.from(new Set(result)).sort((a, b) => a - b) : [];
}

/**
 * Returns the ISO-8601 day of week (1=Monday ... 7=Sunday) for a given date in the user's timezone.
 */
export function getIsoWeekday(timezone: string = 'UTC', targetDate?: string | Date): number {
  if (typeof targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
    const [y, m, d] = targetDate.trim().split('-').map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return day === 0 ? 7 : day;
  }

  let tz = (timezone || 'UTC').trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  const d = targetDate instanceof Date ? targetDate : new Date();
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
  })
    .format(d)
    .toLowerCase();

  return WEEKDAY_MAP[dayName] || 7;
}

/**
 * Returns the local date string 'YYYY-MM-DD' for a given date in the user's timezone.
 */
export function getUserDateString(timezone: string = 'UTC', targetDate?: string | Date): string {
  if (typeof targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
    return targetDate.trim();
  }

  let tz = (timezone || 'UTC').trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  const d = targetDate instanceof Date ? targetDate : new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';

  return `${year}-${month}-${day}`;
}
