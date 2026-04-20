import type { WorkoutSession } from '../store/types';

function offsetDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function id(n: number) {
  return `seed-se-${n}`;
}

export const DEMO_SESSIONS: WorkoutSession[] = [
  {
    id: 'seed-sess-1',
    workoutName: 'A Push',
    date: offsetDate(35),
    durationSeconds: 62 * 60,
    exercises: [
      {
        id: id(1),
        exerciseId: 'ex-dumbbell-press',
        sets: [
          { weight: 40, reps: 9 },
          { weight: 40, reps: 8 },
        ],
      },
      {
        id: id(2),
        exerciseId: 'ex-overhead-press',
        sets: [
          { weight: 35, reps: 8 },
          { weight: 35, reps: 7 },
          { weight: 35, reps: 7 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-2',
    workoutName: 'A Push',
    date: offsetDate(28),
    durationSeconds: 68 * 60,
    exercises: [
      {
        id: id(3),
        exerciseId: 'ex-dumbbell-press',
        sets: [
          { weight: 40, reps: 10 },
          { weight: 40, reps: 8 },
        ],
      },
      {
        id: id(4),
        exerciseId: 'ex-tricep-pushdown',
        sets: [
          { weight: 30, reps: 12 },
          { weight: 30, reps: 11 },
          { weight: 30, reps: 10 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-3',
    workoutName: 'A Push',
    date: offsetDate(21),
    durationSeconds: 64 * 60,
    exercises: [
      {
        id: id(5),
        exerciseId: 'ex-dumbbell-press',
        sets: [
          { weight: 42.5, reps: 10 },
          { weight: 42.5, reps: 8 },
        ],
      },
      {
        id: id(6),
        exerciseId: 'ex-incline-dumbbell-press',
        sets: [
          { weight: 35, reps: 10 },
          { weight: 35, reps: 9 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-4',
    workoutName: 'A Push',
    date: offsetDate(12),
    durationSeconds: 78 * 60,
    exercises: [
      {
        id: id(7),
        exerciseId: 'ex-dumbbell-press',
        sets: [
          { weight: 45, reps: 8 },
          { weight: 45, reps: 8 },
          { weight: 45, reps: 8 },
          { weight: 45, reps: 8 },
        ],
      },
      {
        id: id(8),
        exerciseId: 'ex-lateral-raises',
        sets: [
          { weight: 10, reps: 15 },
          { weight: 10, reps: 15 },
          { weight: 10, reps: 14 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-5',
    workoutName: 'A Push',
    date: offsetDate(5),
    durationSeconds: 60 * 60,
    exercises: [
      {
        id: id(9),
        exerciseId: 'ex-dumbbell-press',
        sets: [
          { weight: 45, reps: 10 },
          { weight: 45, reps: 7 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-6',
    workoutName: 'B Pull',
    date: offsetDate(30),
    durationSeconds: 58 * 60,
    exercises: [
      {
        id: id(10),
        exerciseId: 'ex-lat-pulldown',
        sets: [
          { weight: 55, reps: 12 },
          { weight: 55, reps: 11 },
          { weight: 55, reps: 10 },
        ],
      },
      {
        id: id(11),
        exerciseId: 'ex-barbell-row',
        sets: [
          { weight: 60, reps: 8 },
          { weight: 60, reps: 8 },
          { weight: 60, reps: 7 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-7',
    workoutName: 'B Pull',
    date: offsetDate(20),
    durationSeconds: 62 * 60,
    exercises: [
      {
        id: id(12),
        exerciseId: 'ex-lat-pulldown',
        sets: [
          { weight: 60, reps: 12 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 9 },
        ],
      },
      {
        id: id(13),
        exerciseId: 'ex-dumbbell-row',
        sets: [
          { weight: 30, reps: 10 },
          { weight: 30, reps: 10 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-8',
    workoutName: 'B Pull',
    date: offsetDate(8),
    durationSeconds: 72 * 60,
    exercises: [
      {
        id: id(14),
        exerciseId: 'ex-lat-pulldown',
        sets: [
          { weight: 65, reps: 10 },
          { weight: 65, reps: 10 },
          { weight: 65, reps: 8 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-9',
    workoutName: 'C Legs',
    date: offsetDate(26),
    durationSeconds: 66 * 60,
    exercises: [
      {
        id: id(15),
        exerciseId: 'ex-back-squat',
        sets: [
          { weight: 80, reps: 8 },
          { weight: 80, reps: 7 },
          { weight: 80, reps: 6 },
        ],
      },
      {
        id: id(16),
        exerciseId: 'ex-leg-press',
        sets: [
          { weight: 120, reps: 12 },
          { weight: 120, reps: 10 },
        ],
      },
    ],
  },
  {
    id: 'seed-sess-10',
    workoutName: 'C Legs',
    date: offsetDate(10),
    durationSeconds: 70 * 60,
    exercises: [
      {
        id: id(17),
        exerciseId: 'ex-back-squat',
        sets: [
          { weight: 85, reps: 8 },
          { weight: 85, reps: 7 },
          { weight: 85, reps: 6 },
        ],
      },
    ],
  },
];
