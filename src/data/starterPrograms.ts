import type { Program, Workout, WorkoutExercise } from '../store/types';

type SetSpec = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  note?: string;
};

let seedCounter = 0;
function workoutEx(workoutId: string, spec: SetSpec): WorkoutExercise {
  seedCounter += 1;
  return {
    id: `${workoutId}-we-${seedCounter}`,
    exerciseId: spec.exerciseId,
    sets: spec.sets,
    reps: spec.reps,
    restSeconds: spec.restSeconds,
    ...(spec.note ? { note: spec.note } : {}),
  };
}

function makeWorkout(
  id: string,
  name: string,
  createdAtOffset: number,
  specs: SetSpec[],
): Workout {
  return {
    id,
    name,
    createdAt: STARTER_BASE_TS + createdAtOffset,
    exercises: specs.map((s) => workoutEx(id, s)),
  };
}

// Deterministic base timestamp so seeded createdAt values are stable across
// installs. Jan 1 2024 UTC.
const STARTER_BASE_TS = 1_704_067_200_000;

// ── 1. Starting Strength (A / B) ──────────────────────────────────
const W_SS_A = makeWorkout('w-starter-ss-a', 'Starting Strength · A', 1, [
  { exerciseId: 'ex-back-squat', sets: 3, reps: '5', restSeconds: 180 },
  { exerciseId: 'ex-bench-press', sets: 3, reps: '5', restSeconds: 180 },
  { exerciseId: 'ex-deadlift', sets: 1, reps: '5', restSeconds: 180 },
]);
const W_SS_B = makeWorkout('w-starter-ss-b', 'Starting Strength · B', 2, [
  { exerciseId: 'ex-back-squat', sets: 3, reps: '5', restSeconds: 180 },
  { exerciseId: 'ex-overhead-press', sets: 3, reps: '5', restSeconds: 180 },
  { exerciseId: 'ex-barbell-row', sets: 3, reps: '5', restSeconds: 180 },
]);

// ── 2. Push · Pull · Legs ─────────────────────────────────────────
const W_PPL_PUSH = makeWorkout('w-starter-ppl-push', 'PPL · Push', 10, [
  { exerciseId: 'ex-bench-press', sets: 4, reps: '6-8', restSeconds: 150 },
  { exerciseId: 'ex-incline-dumbbell-press', sets: 3, reps: '8-10', restSeconds: 120 },
  { exerciseId: 'ex-dumbbell-shoulder-press', sets: 3, reps: '8-10', restSeconds: 120 },
  { exerciseId: 'ex-lateral-raises', sets: 4, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-tricep-pushdown', sets: 3, reps: '10-12', restSeconds: 60 },
  { exerciseId: 'ex-overhead-tricep-ext', sets: 3, reps: '10-12', restSeconds: 60 },
]);
const W_PPL_PULL = makeWorkout('w-starter-ppl-pull', 'PPL · Pull', 11, [
  { exerciseId: 'ex-deadlift', sets: 3, reps: '5', restSeconds: 180 },
  { exerciseId: 'ex-pull-ups', sets: 4, reps: '6-10', restSeconds: 120 },
  { exerciseId: 'ex-barbell-row', sets: 3, reps: '8-10', restSeconds: 120 },
  { exerciseId: 'ex-lat-pulldown', sets: 3, reps: '10-12', restSeconds: 90 },
  { exerciseId: 'ex-face-pulls', sets: 3, reps: '15', restSeconds: 60 },
  { exerciseId: 'ex-barbell-curl', sets: 3, reps: '10', restSeconds: 60 },
  { exerciseId: 'ex-hammer-curl', sets: 3, reps: '10', restSeconds: 60 },
]);
const W_PPL_LEGS = makeWorkout('w-starter-ppl-legs', 'PPL · Legs', 12, [
  { exerciseId: 'ex-back-squat', sets: 4, reps: '6-8', restSeconds: 180 },
  { exerciseId: 'ex-romanian-deadlift', sets: 3, reps: '8-10', restSeconds: 150 },
  { exerciseId: 'ex-leg-press', sets: 3, reps: '10-12', restSeconds: 120 },
  { exerciseId: 'ex-leg-curl', sets: 3, reps: '12', restSeconds: 90 },
  { exerciseId: 'ex-leg-extension', sets: 3, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-standing-calf-raises', sets: 4, reps: '12-15', restSeconds: 60 },
]);

// ── 3. Upper / Lower (4-day) ──────────────────────────────────────
const W_UL_UPPER_A = makeWorkout('w-starter-ul-upper-a', 'Upper · Strength', 20, [
  { exerciseId: 'ex-bench-press', sets: 4, reps: '6', restSeconds: 180 },
  { exerciseId: 'ex-barbell-row', sets: 4, reps: '6', restSeconds: 150 },
  { exerciseId: 'ex-overhead-press', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-pull-ups', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-barbell-curl', sets: 3, reps: '10', restSeconds: 60 },
  { exerciseId: 'ex-tricep-pushdown', sets: 3, reps: '10', restSeconds: 60 },
]);
const W_UL_LOWER_A = makeWorkout('w-starter-ul-lower-a', 'Lower · Strength', 21, [
  { exerciseId: 'ex-back-squat', sets: 4, reps: '6', restSeconds: 180 },
  { exerciseId: 'ex-romanian-deadlift', sets: 3, reps: '8', restSeconds: 150 },
  { exerciseId: 'ex-leg-press', sets: 3, reps: '10', restSeconds: 120 },
  { exerciseId: 'ex-leg-curl', sets: 3, reps: '12', restSeconds: 90 },
  { exerciseId: 'ex-standing-calf-raises', sets: 4, reps: '12', restSeconds: 60 },
]);
const W_UL_UPPER_B = makeWorkout('w-starter-ul-upper-b', 'Upper · Hypertrophy', 22, [
  { exerciseId: 'ex-incline-dumbbell-press', sets: 4, reps: '8-10', restSeconds: 120 },
  { exerciseId: 'ex-lat-pulldown', sets: 4, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-dumbbell-shoulder-press', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-seated-cable-row', sets: 3, reps: '10-12', restSeconds: 90 },
  { exerciseId: 'ex-lateral-raises', sets: 4, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-hammer-curl', sets: 3, reps: '10', restSeconds: 60 },
  { exerciseId: 'ex-overhead-tricep-ext', sets: 3, reps: '10', restSeconds: 60 },
]);
const W_UL_LOWER_B = makeWorkout('w-starter-ul-lower-b', 'Lower · Hypertrophy', 23, [
  { exerciseId: 'ex-front-squat', sets: 4, reps: '8', restSeconds: 150 },
  { exerciseId: 'ex-hip-thrust', sets: 3, reps: '10', restSeconds: 120 },
  { exerciseId: 'ex-bulgarian-split-squat', sets: 3, reps: '10 each', restSeconds: 90 },
  { exerciseId: 'ex-leg-extension', sets: 3, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-seated-calf-raises', sets: 4, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-hanging-leg-raises', sets: 3, reps: '12', restSeconds: 60 },
]);

// ── 4. Full Body Beginner (A / B / C) ─────────────────────────────
const W_FB_A = makeWorkout('w-starter-fb-a', 'Full Body · A', 30, [
  { exerciseId: 'ex-back-squat', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-bench-press', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-barbell-row', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-plank', sets: 3, reps: '30s', restSeconds: 60 },
]);
const W_FB_B = makeWorkout('w-starter-fb-b', 'Full Body · B', 31, [
  { exerciseId: 'ex-romanian-deadlift', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-overhead-press', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-lat-pulldown', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-hanging-knee-raises', sets: 3, reps: '10', restSeconds: 60 },
]);
const W_FB_C = makeWorkout('w-starter-fb-c', 'Full Body · C', 32, [
  { exerciseId: 'ex-leg-press', sets: 3, reps: '10', restSeconds: 120 },
  { exerciseId: 'ex-incline-dumbbell-press', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-seated-cable-row', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-cable-crunch', sets: 3, reps: '12', restSeconds: 60 },
]);

// ── 5. Bro Split (5-day) ──────────────────────────────────────────
const W_BRO_CHEST = makeWorkout('w-starter-bro-chest', 'Chest Day', 40, [
  { exerciseId: 'ex-bench-press', sets: 4, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-incline-dumbbell-press', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-cable-fly', sets: 3, reps: '12', restSeconds: 60 },
  { exerciseId: 'ex-pec-deck', sets: 3, reps: '12', restSeconds: 60 },
  { exerciseId: 'ex-dips', sets: 3, reps: '8-12', restSeconds: 90 },
]);
const W_BRO_BACK = makeWorkout('w-starter-bro-back', 'Back Day', 41, [
  { exerciseId: 'ex-deadlift', sets: 3, reps: '5', restSeconds: 180 },
  { exerciseId: 'ex-pull-ups', sets: 4, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-barbell-row', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-lat-pulldown', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-seated-cable-row', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-face-pulls', sets: 3, reps: '15', restSeconds: 60 },
]);
const W_BRO_SHOULDERS = makeWorkout('w-starter-bro-shoulders', 'Shoulder Day', 42, [
  { exerciseId: 'ex-overhead-press', sets: 4, reps: '6-8', restSeconds: 120 },
  { exerciseId: 'ex-arnold-press', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-lateral-raises', sets: 4, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-rear-delt-fly', sets: 3, reps: '12-15', restSeconds: 60 },
  { exerciseId: 'ex-upright-row', sets: 3, reps: '10', restSeconds: 60 },
]);
const W_BRO_ARMS = makeWorkout('w-starter-bro-arms', 'Arm Day', 43, [
  { exerciseId: 'ex-close-grip-bench', sets: 3, reps: '8', restSeconds: 90 },
  { exerciseId: 'ex-ez-bar-curl', sets: 3, reps: '10', restSeconds: 90 },
  { exerciseId: 'ex-skull-crushers', sets: 3, reps: '10', restSeconds: 60 },
  { exerciseId: 'ex-preacher-curl', sets: 3, reps: '10', restSeconds: 60 },
  { exerciseId: 'ex-tricep-pushdown', sets: 3, reps: '12', restSeconds: 60 },
  { exerciseId: 'ex-hammer-curl', sets: 3, reps: '12', restSeconds: 60 },
]);
const W_BRO_LEGS = makeWorkout('w-starter-bro-legs', 'Leg Day', 44, [
  { exerciseId: 'ex-back-squat', sets: 4, reps: '8', restSeconds: 180 },
  { exerciseId: 'ex-leg-press', sets: 3, reps: '10', restSeconds: 120 },
  { exerciseId: 'ex-romanian-deadlift', sets: 3, reps: '8', restSeconds: 120 },
  { exerciseId: 'ex-leg-curl', sets: 3, reps: '12', restSeconds: 90 },
  { exerciseId: 'ex-leg-extension', sets: 3, reps: '12', restSeconds: 60 },
  { exerciseId: 'ex-standing-calf-raises', sets: 4, reps: '15', restSeconds: 60 },
]);

export const STARTER_WORKOUTS: Workout[] = [
  W_SS_A,
  W_SS_B,
  W_PPL_PUSH,
  W_PPL_PULL,
  W_PPL_LEGS,
  W_UL_UPPER_A,
  W_UL_LOWER_A,
  W_UL_UPPER_B,
  W_UL_LOWER_B,
  W_FB_A,
  W_FB_B,
  W_FB_C,
  W_BRO_CHEST,
  W_BRO_BACK,
  W_BRO_SHOULDERS,
  W_BRO_ARMS,
  W_BRO_LEGS,
];

export const STARTER_PROGRAMS: Program[] = [
  {
    id: 'p-starter-ss',
    name: 'Starting Strength',
    workoutIds: [W_SS_A.id, W_SS_B.id],
    isActive: false,
    isCustom: false,
    createdAt: STARTER_BASE_TS + 100,
    phase: 'Strength',
    durationWeeks: 12,
    restDays: 4,
  },
  {
    id: 'p-starter-ppl',
    name: 'Push · Pull · Legs',
    workoutIds: [W_PPL_PUSH.id, W_PPL_PULL.id, W_PPL_LEGS.id],
    isActive: false,
    isCustom: false,
    createdAt: STARTER_BASE_TS + 101,
    phase: 'Hypertrophy',
    durationWeeks: 8,
    restDays: 1,
  },
  {
    id: 'p-starter-upper-lower',
    name: 'Upper / Lower Split',
    workoutIds: [
      W_UL_UPPER_A.id,
      W_UL_LOWER_A.id,
      W_UL_UPPER_B.id,
      W_UL_LOWER_B.id,
    ],
    isActive: false,
    isCustom: false,
    createdAt: STARTER_BASE_TS + 102,
    phase: 'Strength + Hypertrophy',
    durationWeeks: 8,
    restDays: 3,
  },
  {
    id: 'p-starter-full-body',
    name: 'Full Body Beginner',
    workoutIds: [W_FB_A.id, W_FB_B.id, W_FB_C.id],
    isActive: false,
    isCustom: false,
    createdAt: STARTER_BASE_TS + 103,
    phase: 'General',
    durationWeeks: 8,
    restDays: 4,
  },
  {
    id: 'p-starter-bro-split',
    name: 'Bro Split',
    workoutIds: [
      W_BRO_CHEST.id,
      W_BRO_BACK.id,
      W_BRO_SHOULDERS.id,
      W_BRO_ARMS.id,
      W_BRO_LEGS.id,
    ],
    isActive: false,
    isCustom: false,
    createdAt: STARTER_BASE_TS + 104,
    phase: 'Hypertrophy',
    durationWeeks: 8,
    restDays: 2,
  },
];
