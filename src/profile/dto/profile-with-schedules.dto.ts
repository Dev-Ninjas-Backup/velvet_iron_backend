export class TodayScheduleItemDto {
    id: string;
    type: 'meal' | 'medication' | 'exercise';
    title: string;
    description?: string;
    scheduledAt: string; // Bangladesh timezone formatted string
    details?: any;
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

    todaySchedules: ScheduleCombinedDto;
    thisWeek: RangeScheduleSummaryDto;
    thisMonth: RangeScheduleSummaryDto;
}
