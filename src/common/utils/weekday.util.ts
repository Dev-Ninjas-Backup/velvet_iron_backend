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
 * Normalizes daysOfWeek input from integers, numeric strings, or weekday names (e.g. "MONDAY", "WEDNESDAY")
 * and aliases like repeatDays into a sorted unique array of integers [1..7].
 */
export function normalizeDaysOfWeek(value: unknown, obj?: any): number[] | undefined {
  const input =
    value !== undefined && value !== null && value !== ''
      ? value
      : obj?.repeatDays !== undefined && obj?.repeatDays !== null && obj?.repeatDays !== ''
      ? obj?.repeatDays
      : undefined;

  if (input === undefined) return undefined;
  const arr = Array.isArray(input) ? input : [input];
  const result: number[] = [];

  for (const item of arr) {
    if (typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= 7) {
      result.push(item);
    } else if (typeof item === 'string') {
      const trimmed = item.trim().toLowerCase();
      if (WEEKDAY_MAP[trimmed] !== undefined) {
        result.push(WEEKDAY_MAP[trimmed]);
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= 7) {
          result.push(num);
        }
      }
    }
  }

  return result.length > 0 ? Array.from(new Set(result)).sort((a, b) => a - b) : [];
}

