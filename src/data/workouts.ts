import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

// Local demo-data shapes, intentionally distinct from the canonical
// Exercise/Workout in `src/store/types.ts`. Kept unexported so no caller
// can pick up the wrong shape.
type IoniconName = ComponentProps<typeof Ionicons>['name'];

type DemoExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscle: string;
  equipment: string;
  rest: string;
};

type DemoWorkout = {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  calories: number;
  exerciseCount: number;
  color: string;
  icon: IoniconName;
  exercises: DemoExercise[];
};

export const WORKOUTS: DemoWorkout[] = [
  {
    id: 'w1',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps focused workout',
    duration: 55,
    difficulty: 'Intermediate',
    category: 'Strength',
    calories: 420,
    exerciseCount: 6,
    color: '#F97316',
    icon: 'flame',
    exercises: [
      { id: 'e1', name: 'Bench Press', sets: 4, reps: '8-10', muscle: 'Chest', equipment: 'Barbell', rest: '90s' },
      { id: 'e2', name: 'Overhead Press', sets: 4, reps: '8-10', muscle: 'Shoulders', equipment: 'Barbell', rest: '90s' },
      { id: 'e3', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', muscle: 'Chest', equipment: 'Dumbbells', rest: '60s' },
      { id: 'e4', name: 'Lateral Raises', sets: 3, reps: '12-15', muscle: 'Shoulders', equipment: 'Dumbbells', rest: '45s' },
      { id: 'e5', name: 'Tricep Pushdown', sets: 3, reps: '12-15', muscle: 'Triceps', equipment: 'Cable', rest: '45s' },
      { id: 'e6', name: 'Overhead Tricep Ext.', sets: 3, reps: '10-12', muscle: 'Triceps', equipment: 'Dumbbell', rest: '45s' },
    ],
  },
  {
    id: 'w2',
    name: 'Pull Day',
    description: 'Back and biceps builder',
    duration: 50,
    difficulty: 'Intermediate',
    category: 'Strength',
    calories: 380,
    exerciseCount: 5,
    color: '#3B82F6',
    icon: 'barbell',
    exercises: [
      { id: 'e7', name: 'Deadlift', sets: 4, reps: '5-6', muscle: 'Back', equipment: 'Barbell', rest: '2min' },
      { id: 'e8', name: 'Pull-Ups', sets: 4, reps: '6-10', muscle: 'Back', equipment: 'Bodyweight', rest: '90s' },
      { id: 'e9', name: 'Barbell Row', sets: 4, reps: '8-10', muscle: 'Back', equipment: 'Barbell', rest: '90s' },
      { id: 'e10', name: 'Face Pulls', sets: 3, reps: '12-15', muscle: 'Rear Delts', equipment: 'Cable', rest: '45s' },
      { id: 'e11', name: 'Barbell Curl', sets: 3, reps: '10-12', muscle: 'Biceps', equipment: 'Barbell', rest: '60s' },
    ],
  },
  {
    id: 'w3',
    name: 'Leg Day',
    description: 'Complete lower body workout',
    duration: 60,
    difficulty: 'Advanced',
    category: 'Strength',
    calories: 520,
    exerciseCount: 6,
    color: '#8B5CF6',
    icon: 'walk',
    exercises: [
      { id: 'e12', name: 'Back Squat', sets: 5, reps: '5-6', muscle: 'Quads', equipment: 'Barbell', rest: '2min' },
      { id: 'e13', name: 'Romanian Deadlift', sets: 4, reps: '8-10', muscle: 'Hamstrings', equipment: 'Barbell', rest: '90s' },
      { id: 'e14', name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', muscle: 'Quads', equipment: 'Dumbbells', rest: '75s' },
      { id: 'e15', name: 'Leg Curl', sets: 3, reps: '12-15', muscle: 'Hamstrings', equipment: 'Machine', rest: '45s' },
      { id: 'e16', name: 'Calf Raises', sets: 4, reps: '15-20', muscle: 'Calves', equipment: 'Machine', rest: '45s' },
      { id: 'e17', name: 'Leg Extension', sets: 3, reps: '12-15', muscle: 'Quads', equipment: 'Machine', rest: '45s' },
    ],
  },
  {
    id: 'w4',
    name: 'HIIT Cardio',
    description: 'High intensity interval training',
    duration: 25,
    difficulty: 'Intermediate',
    category: 'Cardio',
    calories: 340,
    exerciseCount: 5,
    color: '#EF4444',
    icon: 'heart',
    exercises: [
      { id: 'e18', name: 'Burpees', sets: 4, reps: '45s on', muscle: 'Full Body', equipment: 'Bodyweight', rest: '15s' },
      { id: 'e19', name: 'Mountain Climbers', sets: 4, reps: '45s on', muscle: 'Core', equipment: 'Bodyweight', rest: '15s' },
      { id: 'e20', name: 'Jump Squats', sets: 4, reps: '45s on', muscle: 'Legs', equipment: 'Bodyweight', rest: '15s' },
      { id: 'e21', name: 'High Knees', sets: 4, reps: '45s on', muscle: 'Legs', equipment: 'Bodyweight', rest: '15s' },
      { id: 'e22', name: 'Plank Jacks', sets: 4, reps: '45s on', muscle: 'Core', equipment: 'Bodyweight', rest: '15s' },
    ],
  },
  {
    id: 'w5',
    name: 'Core Crusher',
    description: 'Ab and core strengthening',
    duration: 20,
    difficulty: 'Beginner',
    category: 'Core',
    calories: 180,
    exerciseCount: 5,
    color: '#10B981',
    icon: 'fitness',
    exercises: [
      { id: 'e23', name: 'Plank', sets: 3, reps: '60s hold', muscle: 'Core', equipment: 'Bodyweight', rest: '30s' },
      { id: 'e24', name: 'Russian Twists', sets: 3, reps: '20 reps', muscle: 'Obliques', equipment: 'Weight', rest: '30s' },
      { id: 'e25', name: 'Leg Raises', sets: 3, reps: '15 reps', muscle: 'Lower Abs', equipment: 'Bodyweight', rest: '30s' },
      { id: 'e26', name: 'Bicycle Crunches', sets: 3, reps: '20/side', muscle: 'Core', equipment: 'Bodyweight', rest: '30s' },
      { id: 'e27', name: 'Dead Bug', sets: 3, reps: '10/side', muscle: 'Core', equipment: 'Bodyweight', rest: '30s' },
    ],
  },
  {
    id: 'w6',
    name: 'Full Body Blast',
    description: 'Total body conditioning',
    duration: 45,
    difficulty: 'Intermediate',
    category: 'Strength',
    calories: 400,
    exerciseCount: 6,
    color: '#EC4899',
    icon: 'flash',
    exercises: [
      { id: 'e28', name: 'Goblet Squat', sets: 3, reps: '12-15', muscle: 'Legs', equipment: 'Dumbbell', rest: '60s' },
      { id: 'e29', name: 'Dumbbell Press', sets: 3, reps: '10-12', muscle: 'Chest', equipment: 'Dumbbells', rest: '60s' },
      { id: 'e30', name: 'Dumbbell Row', sets: 3, reps: '10-12', muscle: 'Back', equipment: 'Dumbbell', rest: '60s' },
      { id: 'e31', name: 'Walking Lunges', sets: 3, reps: '10/leg', muscle: 'Legs', equipment: 'Dumbbells', rest: '60s' },
      { id: 'e32', name: 'Push-Ups', sets: 3, reps: '12-15', muscle: 'Chest', equipment: 'Bodyweight', rest: '45s' },
      { id: 'e33', name: 'Plank', sets: 3, reps: '45s hold', muscle: 'Core', equipment: 'Bodyweight', rest: '30s' },
    ],
  },
];

export const WEEKLY_ACTIVITY = [
  { day: 'Mon', minutes: 55, active: true },
  { day: 'Tue', minutes: 25, active: true },
  { day: 'Wed', minutes: 0, active: false },
  { day: 'Thu', minutes: 52, active: true },
  { day: 'Fri', minutes: 0, active: false },
  { day: 'Sat', minutes: 65, active: true },
  { day: 'Sun', minutes: 58, active: true },
];
