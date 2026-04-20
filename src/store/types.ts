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
