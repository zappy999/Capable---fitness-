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

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  note?: string;
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
};

export type SessionSet = {
  weight: number;
  reps: number;
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
