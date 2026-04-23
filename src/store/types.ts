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
  note?: string;
};

export type WorkoutSession = {
  id: string;
  workoutName: string;
  workoutId?: string;
  date: string;
  durationSeconds: number;
  exercises: SessionExercise[];
  notes?: string;
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

export type UserSettings = {
  weightIncrementKg: number;
  defaultRestSeconds: number;
  weekStartDay: 'monday' | 'sunday';
  accentColor: string;
  timezone?: string;
  starterProgramsSeeded?: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  weightIncrementKg: 2.5,
  defaultRestSeconds: 90,
  weekStartDay: 'monday',
  accentColor: '#22C55E',
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
