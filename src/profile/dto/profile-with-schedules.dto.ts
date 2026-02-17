export class TodayScheduleItemDto {
    id: string;
    type: 'meal' | 'medication' | 'exercise';
    title: string;
    description?: string;
    scheduledAt: string; // Bangladesh timezone formatted string
    details?: any;
}

export class TodaySchedulesDto {
    meals: any[];
    medications: any[];
    exercises: ExerciseScheduleDto[];
    combined: TodayScheduleItemDto[]; // All combined and sorted by time
}

export class MealScheduleDto {
    id: string;
    mealType: string;
    scheduledAt: Date;
    calories?: number | null;
    carbs?: number | null;
    protein?: number | null;
    fats?: number | null;
}

export class MedicationScheduleDto {
    id: string;
    name: string;
    type?: string | null;
    doseMg?: number | null;
    scheduleTime: Date;
    dosageDescription?: string; // e.g., "1 injection", "1 tablet", "400mg"
}

export class ExerciseScheduleDto {
    id: string;
    type: string;
    name: string;
    intensity?: string | null;
    duration?: number | null; // in minutes
    note?: string | null;
    loggedAt: Date;
}

export class ProfileWithSchedulesDto {
    // Existing profile data
    id: string;
    userId: string;
    totalEarnXp: number;
    balanceXp?: number;
    fitnessGoal?: string;
    userName?: string;
    level: number;
    levelStatus?: string;
    nextLevel?: {
        level: number;
        xpRequired: number;
    };
    activeTheme?: any;
    activecomponion?: any;

    // Today's schedules
    todaySchedules: TodaySchedulesDto;
}
