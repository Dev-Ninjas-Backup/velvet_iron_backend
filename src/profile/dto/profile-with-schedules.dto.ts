export class TodayScheduleItemDto {
    id: string;
    type: 'meal' | 'medication' | 'exercise';
    title: string;
    description?: string;
    scheduledAt: string; // Bangladesh timezone formatted string
    details?: any;
    earnedXp?: number;
}

export class ScheduleCombinedDto {
    combined: TodayScheduleItemDto[];
}

export class RangeScheduleSummaryDto extends ScheduleCombinedDto {
    totalMeals: number;
    totalMedications: number;
    totalExercises: number;
}

export class ProfileWithSchedulesDto {
    // Existing profile data
    id: string;
    userId: string;
    totalEarnXp: number;
    balanceXp?: number;
    fitnessGoal?: string | null;
    userName?: string | null;
    level: number;
    levelStatus?: string;
    nextLevel?: {
        level: number;
        xpRequired: number;
    };
    activeTheme?: any;
    activecomponion?: any;
    charts?: {
        currentWeek: any;
        lastWeek: any;
    };

    todaySchedules: ScheduleCombinedDto;
    thisWeek: RangeScheduleSummaryDto;
    thisMonth: RangeScheduleSummaryDto;
    todayMood: {
        id: string;
        mood: string;
        energyLevel?: string | null;
        hungerLevel?: string | null;
        note?: string | null;
        loggedAt: Date;
    } | null;
    upcoming?: TodayScheduleItemDto | null;
}
