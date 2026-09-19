/**
 * Velvet & Iron — Companion Quotes & Dialogue System
 * Push Notification Templates and Companion Reference
 */

export enum NotificationTriggerType {
  MORNING_REMINDER = 'MORNING_REMINDER',
  INACTIVE_REENGAGEMENT = 'INACTIVE_REENGAGEMENT',
  STREAK_MAINTENANCE = 'STREAK_MAINTENANCE',
}

export interface CompanionMetadata {
  slug: string;
  name: string;
  title: string;
  persona: string;
  defaultQuote: string;
  unlockXp: number;
}

export const OFFICIAL_COMPANIONS: Record<string, CompanionMetadata> = {
  riven: {
    slug: 'riven',
    name: 'Riven',
    title: 'High Lord of the Forsaken Court',
    persona: 'Seductive, sarcastic, clever, slightly dangerous, secretly supportive dark fae.',
    defaultQuote: 'Come now. We have things to accomplish.',
    unlockXp: 0, // Free starter companion
  },
  thyra: {
    slug: 'thyra',
    name: 'Thyra',
    title: 'Shield of the Realm',
    persona: 'Formidable paladin, protective, honorable, grounded, warm warrior.',
    defaultQuote: 'A shield is only as strong as the one who holds it. Take care of yourself.',
    unlockXp: 250,
  },
  general_leon: {
    slug: 'general_leon',
    name: 'General Leon',
    title: 'Commander of the Legions',
    persona: 'Disciplined, tactical, concise, dry military humor, strategic.',
    defaultQuote: 'Discipline is choosing what you want most over what you want now.',
    unlockXp: 250,
  },
  visepheron: {
    slug: 'visepheron',
    name: 'Visepheron',
    title: 'Ancient Dragon',
    persona: 'Ancient, immense wisdom, draconic pride, cosmic patience.',
    defaultQuote: 'Come, little flame. Burn steadily today.',
    unlockXp: 250,
  },
};

export const COMPANION_NOTIFICATION_TEMPLATES: Record<
  string,
  Record<NotificationTriggerType, string>
> = {
  riven: {
    [NotificationTriggerType.MORNING_REMINDER]:
      'Good morning, darling. Try not to declare war before breakfast.',
    [NotificationTriggerType.INACTIVE_REENGAGEMENT]:
      'Time passed. You returned. That is the whole story. Welcome back.',
    [NotificationTriggerType.STREAK_MAINTENANCE]:
      'Day upon day. This is how empires rise. Shall we keep the streak going?',
  },
  thyra: {
    [NotificationTriggerType.MORNING_REMINDER]:
      'Morning. Clear eyes, steady breath. The day begins.',
    [NotificationTriggerType.INACTIVE_REENGAGEMENT]:
      'The shield does not judge you for laying it down. Welcome back.',
    [NotificationTriggerType.STREAK_MAINTENANCE]:
      'Another day joins the chain. Your strength grows with every choice.',
  },
  leon: {
    [NotificationTriggerType.MORNING_REMINDER]:
      'Morning briefing: do what matters first.',
    [NotificationTriggerType.INACTIVE_REENGAGEMENT]:
      'Absence noted. Status reset. Report for duty when ready.',
    [NotificationTriggerType.STREAK_MAINTENANCE]:
      'Consistency is a strategic advantage. Log your progress for today.',
  },
  visepheron: {
    [NotificationTriggerType.MORNING_REMINDER]:
      'Morning is merely an invitation to begin again.',
    [NotificationTriggerType.INACTIVE_REENGAGEMENT]:
      'The road did not vanish while you were gone. You need not apologize to me for being human.',
    [NotificationTriggerType.STREAK_MAINTENANCE]:
      'Steady, little flame. Day upon day, this is how mountains change.',
  },
};

/**
 * Normalizes companion name/slug and returns the approved push notification copy.
 * Defaults to 'riven' (starter companion) if unrecognized or unset.
 */
export function getCompanionNotificationCopy(
  companionName?: string | null,
  trigger: NotificationTriggerType = NotificationTriggerType.MORNING_REMINDER,
): string {
  const normalized = (companionName || '').toLowerCase().trim();
  const key =
    normalized.includes('riven')
      ? 'riven'
      : normalized.includes('thyra')
        ? 'thyra'
        : normalized.includes('leon')
          ? 'leon'
          : normalized.includes('visepheron')
            ? 'visepheron'
            : 'riven';

  return COMPANION_NOTIFICATION_TEMPLATES[key][trigger];
}

