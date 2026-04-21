export const EXERCISE_CATEGORIES = [
  'Chest',
  'Back',
  'Shoulders',
  'Triceps',
  'Biceps',
  'Legs',
  'Glutes',
  'Calves',
  'Core',
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory | null;
  isCustom?: boolean;
};

export const GROUP_TYPES = ['superset', 'circuit', 'emom'] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  note?: string;
  isDropSet?: boolean;
  supersetGroup?: string;
  groupType?: GroupType;
  emomSeconds?: number;
  demoUrl?: string;
};

export type Workout = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: number;
};

export type Program = {
  id: string;
  name: string;
  workoutIds: string[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isCustom: boolean;
  createdAt: number;
  phase?: string;
  durationWeeks?: number;
  restDays?: number;
  intensityCycle?: number[];
};

export type SessionSet = {
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
};

export type SessionExercise = {
  id: string;
  exerciseId: string;
  sets: SessionSet[];
};

export type WorkoutSession = {
  id: string;
  workoutName: string;
  workoutId?: string;
  date: string;
  durationSeconds: number;
  exercises: SessionExercise[];
};

export type PersonalRecordKind = 'heaviest_weight' | 'best_volume';

export type PersonalRecord = {
  id: string;
  exerciseId: string;
  kind: PersonalRecordKind;
  value: number;
  weight: number;
  reps: number;
  sessionId: string;
  achievedAt: string;
};

export type BodyweightEntry = {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
};

export type DailyHealthMetric = {
  id: string;
  date: string;
  sleepHours?: number;
  steps?: number;
  waterLiters?: number;
  mood?: number;
  stress?: number;
  recovery?: number;
  soreness?: number;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
};

export type CardioSession = {
  id: string;
  date: string;
  activityType: string;
  durationMin: number;
  distanceKm?: number;
  avgHr?: number;
  calories?: number;
  notes?: string;
};

export type Supplement = {
  id: string;
  name: string;
  dose?: string;
  notes?: string;
  createdAt: number;
};

export type MedicationFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export type Medication = {
  id: string;
  name: string;
  dose?: string;
  unit?: string;
  frequency?: MedicationFrequency;
  startDate?: string;
  weekdays?: number[];
  notes?: string;
  createdAt: number;
};

export type WeeklyCheckin = {
  id: string;
  weekDate: string;
  measurements?: Record<string, number>;
  notes?: string;
  goals?: string;
  createdAt: number;
};

export type FoodMacro = 'protein' | 'carb' | 'fat' | 'mixed';

export type Food = {
  id: string;
  name: string;
  macro: FoodMacro;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  isCustom?: boolean;
};

export type MealFoodRow = {
  id: string;
  foodId: string;
  amountG: number;
};

export type Meal = {
  id: string;
  name: string;
  rows: MealFoodRow[];
};

export type MealPlan = {
  id: string;
  name: string;
  meals: Meal[];
  isActive: boolean;
  createdAt: number;
};

export type MealLog = {
  date: string;
  mealId: string;
};

export const MUSCLE_COLORS: Record<ExerciseCategory, string> = {
  Chest: '#F87171',
  Back: '#60A5FA',
  Shoulders: '#F97316',
  Triceps: '#A78BFA',
  Biceps: '#FBBF24',
  Legs: '#34D399',
  Glutes: '#EC4899',
  Calves: '#8B5CF6',
  Core: '#10B981',
};
