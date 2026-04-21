import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { DEMO_SESSIONS } from '../data/demoSessions';
import { FOOD_LIBRARY } from '../data/foodLibrary';
import type {
  BodyweightEntry,
  CardioSession,
  DailyHealthMetric,
  Exercise,
  ExerciseCategory,
  Food,
  Habit,
  HabitLog,
  Meal,
  MealLog,
  MealPlan,
  Medication,
  PersonalRecord,
  Program,
  Supplement,
  UserSettings,
  WeeklyCheckin,
  Workout,
  WorkoutSession,
} from './types';
import { DEFAULT_SETTINGS } from './types';
import { buildImportPayload, type ImportPayload, type ImportReport } from '../lib/importBackup';

const STORAGE_KEY = 'capable.store.v2';

type State = {
  hydrated: boolean;
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  bodyweight: BodyweightEntry[];
  dailyMetrics: DailyHealthMetric[];
  cardio: CardioSession[];
  supplements: Supplement[];
  medications: Medication[];
  weeklyCheckins: WeeklyCheckin[];
  foods: Food[];
  mealPlans: MealPlan[];
  mealLogs: MealLog[];
  habits: Habit[];
  habitLogs: HabitLog[];
  settings: UserSettings;
};

const initialState: State = {
  hydrated: false,
  exercises: EXERCISE_LIBRARY,
  workouts: [],
  programs: [],
  sessions: [],
  personalRecords: [],
  bodyweight: [],
  dailyMetrics: [],
  cardio: [],
  supplements: [],
  medications: [],
  weeklyCheckins: [],
  foods: FOOD_LIBRARY,
  mealPlans: [],
  mealLogs: [],
  habits: [],
  habitLogs: [],
  settings: DEFAULT_SETTINGS,
};

type Action =
  | { type: 'HYDRATE'; payload: Omit<State, 'hydrated'> }
  | { type: 'ADD_EXERCISE'; exercise: Exercise }
  | { type: 'DELETE_EXERCISE'; id: string }
  | { type: 'UPDATE_EXERCISE_CATEGORY'; id: string; category: ExerciseCategory | null }
  | { type: 'MERGE_EXERCISE'; sourceId: string; targetId: string }
  | { type: 'UPSERT_WORKOUT'; workout: Workout }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'UPSERT_PROGRAM'; program: Program }
  | { type: 'DELETE_PROGRAM'; id: string }
  | { type: 'SET_ACTIVE_PROGRAM'; id: string | null }
  | { type: 'LOG_SESSION'; session: WorkoutSession; newPRs: PersonalRecord[] }
  | { type: 'DELETE_SESSION'; id: string }
  | { type: 'UPSERT_BODYWEIGHT'; entry: BodyweightEntry }
  | { type: 'DELETE_BODYWEIGHT'; id: string }
  | { type: 'UPSERT_DAILY_METRIC'; metric: DailyHealthMetric }
  | { type: 'DELETE_DAILY_METRIC'; id: string }
  | { type: 'UPSERT_CARDIO'; session: CardioSession }
  | { type: 'DELETE_CARDIO'; id: string }
  | { type: 'UPSERT_SUPPLEMENT'; supplement: Supplement }
  | { type: 'DELETE_SUPPLEMENT'; id: string }
  | { type: 'UPSERT_MEDICATION'; medication: Medication }
  | { type: 'DELETE_MEDICATION'; id: string }
  | { type: 'UPSERT_CHECKIN'; checkin: WeeklyCheckin }
  | { type: 'DELETE_CHECKIN'; id: string }
  | { type: 'ADD_FOOD'; food: Food }
  | { type: 'DELETE_FOOD'; id: string }
  | { type: 'UPSERT_MEAL_PLAN'; plan: MealPlan }
  | { type: 'DELETE_MEAL_PLAN'; id: string }
  | { type: 'SET_ACTIVE_MEAL_PLAN'; id: string | null }
  | { type: 'TOGGLE_MEAL_LOG'; date: string; mealId: string }
  | { type: 'UPSERT_HABIT'; habit: Habit }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'UPSERT_HABIT_LOG'; log: HabitLog }
  | { type: 'DELETE_HABIT_LOG'; id: string }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<UserSettings> }
  | { type: 'BULK_IMPORT'; payload: ImportPayload };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.payload, hydrated: true };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.exercise] };
    case 'DELETE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.id !== action.id),
        sessions: state.sessions
          .map((s) => ({
            ...s,
            exercises: s.exercises.filter((se) => se.exerciseId !== action.id),
          }))
          .filter((s) => s.exercises.length > 0),
      };
    case 'UPDATE_EXERCISE_CATEGORY':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.id ? { ...e, category: action.category } : e,
        ),
      };
    case 'MERGE_EXERCISE': {
      if (action.sourceId === action.targetId) return state;
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.id !== action.sourceId),
        workouts: state.workouts.map((w) => ({
          ...w,
          exercises: w.exercises.map((we) =>
            we.exerciseId === action.sourceId
              ? { ...we, exerciseId: action.targetId }
              : we,
          ),
        })),
        sessions: state.sessions.map((s) => ({
          ...s,
          exercises: s.exercises.map((se) =>
            se.exerciseId === action.sourceId
              ? { ...se, exerciseId: action.targetId }
              : se,
          ),
        })),
      };
    }
    case 'UPSERT_WORKOUT': {
      const exists = state.workouts.some((w) => w.id === action.workout.id);
      return {
        ...state,
        workouts: exists
          ? state.workouts.map((w) => (w.id === action.workout.id ? action.workout : w))
          : [...state.workouts, action.workout],
      };
    }
    case 'DELETE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.filter((w) => w.id !== action.id),
        programs: state.programs.map((p) => ({
          ...p,
          workoutIds: p.workoutIds.filter((id) => id !== action.id),
        })),
      };
    case 'UPSERT_PROGRAM': {
      const exists = state.programs.some((p) => p.id === action.program.id);
      return {
        ...state,
        programs: exists
          ? state.programs.map((p) => (p.id === action.program.id ? action.program : p))
          : [...state.programs, action.program],
      };
    }
    case 'DELETE_PROGRAM':
      return { ...state, programs: state.programs.filter((p) => p.id !== action.id) };
    case 'SET_ACTIVE_PROGRAM':
      return {
        ...state,
        programs: state.programs.map((p) => ({ ...p, isActive: p.id === action.id })),
      };
    case 'LOG_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.session],
        personalRecords: [...state.personalRecords, ...action.newPRs],
      };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.id),
        personalRecords: state.personalRecords.filter(
          (p) => p.sessionId !== action.id,
        ),
      };
    case 'UPSERT_BODYWEIGHT': {
      const others = state.bodyweight.filter(
        (b) => b.date !== action.entry.date && b.id !== action.entry.id,
      );
      return { ...state, bodyweight: [...others, action.entry] };
    }
    case 'DELETE_BODYWEIGHT':
      return {
        ...state,
        bodyweight: state.bodyweight.filter((b) => b.id !== action.id),
      };
    case 'UPSERT_DAILY_METRIC': {
      const others = state.dailyMetrics.filter(
        (m) => m.date !== action.metric.date && m.id !== action.metric.id,
      );
      return { ...state, dailyMetrics: [...others, action.metric] };
    }
    case 'DELETE_DAILY_METRIC':
      return {
        ...state,
        dailyMetrics: state.dailyMetrics.filter((m) => m.id !== action.id),
      };
    case 'UPSERT_CARDIO': {
      const exists = state.cardio.some((c) => c.id === action.session.id);
      return {
        ...state,
        cardio: exists
          ? state.cardio.map((c) => (c.id === action.session.id ? action.session : c))
          : [...state.cardio, action.session],
      };
    }
    case 'DELETE_CARDIO':
      return { ...state, cardio: state.cardio.filter((c) => c.id !== action.id) };
    case 'UPSERT_SUPPLEMENT': {
      const exists = state.supplements.some((s) => s.id === action.supplement.id);
      return {
        ...state,
        supplements: exists
          ? state.supplements.map((s) =>
              s.id === action.supplement.id ? action.supplement : s,
            )
          : [...state.supplements, action.supplement],
      };
    }
    case 'DELETE_SUPPLEMENT':
      return {
        ...state,
        supplements: state.supplements.filter((s) => s.id !== action.id),
      };
    case 'UPSERT_MEDICATION': {
      const exists = state.medications.some((m) => m.id === action.medication.id);
      return {
        ...state,
        medications: exists
          ? state.medications.map((m) =>
              m.id === action.medication.id ? action.medication : m,
            )
          : [...state.medications, action.medication],
      };
    }
    case 'DELETE_MEDICATION':
      return {
        ...state,
        medications: state.medications.filter((m) => m.id !== action.id),
      };
    case 'UPSERT_CHECKIN': {
      const others = state.weeklyCheckins.filter(
        (c) => c.weekDate !== action.checkin.weekDate && c.id !== action.checkin.id,
      );
      return { ...state, weeklyCheckins: [...others, action.checkin] };
    }
    case 'DELETE_CHECKIN':
      return {
        ...state,
        weeklyCheckins: state.weeklyCheckins.filter((c) => c.id !== action.id),
      };
    case 'ADD_FOOD':
      return { ...state, foods: [...state.foods, action.food] };
    case 'DELETE_FOOD':
      return { ...state, foods: state.foods.filter((f) => f.id !== action.id) };
    case 'UPSERT_MEAL_PLAN': {
      const exists = state.mealPlans.some((p) => p.id === action.plan.id);
      return {
        ...state,
        mealPlans: exists
          ? state.mealPlans.map((p) => (p.id === action.plan.id ? action.plan : p))
          : [...state.mealPlans, action.plan],
      };
    }
    case 'DELETE_MEAL_PLAN':
      return {
        ...state,
        mealPlans: state.mealPlans.filter((p) => p.id !== action.id),
        mealLogs: state.mealLogs.filter((l) => {
          const plan = state.mealPlans.find((p) => p.id === action.id);
          if (!plan) return true;
          const mealIds = new Set(plan.meals.map((m) => m.id));
          return !mealIds.has(l.mealId);
        }),
      };
    case 'SET_ACTIVE_MEAL_PLAN':
      return {
        ...state,
        mealPlans: state.mealPlans.map((p) => ({
          ...p,
          isActive: p.id === action.id,
        })),
      };
    case 'TOGGLE_MEAL_LOG': {
      const match = state.mealLogs.find(
        (l) => l.date === action.date && l.mealId === action.mealId,
      );
      if (match) {
        return {
          ...state,
          mealLogs: state.mealLogs.filter((l) => l !== match),
        };
      }
      return {
        ...state,
        mealLogs: [...state.mealLogs, { date: action.date, mealId: action.mealId }],
      };
    }
    case 'UPSERT_HABIT': {
      const exists = state.habits.some((h) => h.id === action.habit.id);
      return {
        ...state,
        habits: exists
          ? state.habits.map((h) => (h.id === action.habit.id ? action.habit : h))
          : [...state.habits, action.habit],
      };
    }
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
        habitLogs: state.habitLogs.filter((l) => l.habitId !== action.id),
      };
    case 'UPSERT_HABIT_LOG': {
      const others = state.habitLogs.filter(
        (l) =>
          !(l.habitId === action.log.habitId && l.date === action.log.date) &&
          l.id !== action.log.id,
      );
      return { ...state, habitLogs: [...others, action.log] };
    }
    case 'DELETE_HABIT_LOG':
      return {
        ...state,
        habitLogs: state.habitLogs.filter((l) => l.id !== action.id),
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.patch,
          goals: { ...state.settings.goals, ...(action.patch.goals ?? {}) },
          sync: { ...state.settings.sync, ...(action.patch.sync ?? {}) },
          featureFlags: {
            ...state.settings.featureFlags,
            ...(action.patch.featureFlags ?? {}),
          },
        },
      };
    case 'BULK_IMPORT': {
      const {
        customExercises,
        workouts: importedWorkouts,
        sessions: importedSessions,
        bodyweight: importedBW,
        dailyMetrics: importedDM,
        medications: importedMeds,
        settings: importedSettings,
      } = action.payload;

      const mergedExercises = [...state.exercises, ...customExercises];

      const wIds = new Set(importedWorkouts.map((w) => w.id));
      const mergedWorkouts = [
        ...state.workouts.filter((w) => !wIds.has(w.id)),
        ...importedWorkouts,
      ];

      const sIds = new Set(importedSessions.map((s) => s.id));
      const mergedSessions = [
        ...state.sessions.filter((s) => !sIds.has(s.id)),
        ...importedSessions,
      ];

      const chronological = [...mergedSessions].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const recomputedPRs: PersonalRecord[] = [];
      const prior: WorkoutSession[] = [];
      for (const s of chronological) {
        recomputedPRs.push(...detectPRs(s, prior));
        prior.push(s);
      }

      const bwDates = new Set(importedBW.map((b) => b.date));
      const mergedBW = [
        ...state.bodyweight.filter((b) => !bwDates.has(b.date)),
        ...importedBW,
      ];

      const dmDates = new Set(importedDM.map((m) => m.date));
      const mergedDM = [
        ...state.dailyMetrics.filter((m) => !dmDates.has(m.date)),
        ...importedDM,
      ];

      const medIds = new Set(importedMeds.map((m) => m.id));
      const mergedMeds = [
        ...state.medications.filter((m) => !medIds.has(m.id)),
        ...importedMeds,
      ];

      return {
        ...state,
        exercises: mergedExercises,
        workouts: mergedWorkouts,
        sessions: mergedSessions,
        personalRecords: recomputedPRs,
        bodyweight: mergedBW,
        dailyMetrics: mergedDM,
        medications: mergedMeds,
        settings: {
          ...state.settings,
          ...importedSettings,
        },
      };
    }
  }
}

type WorkoutInput = {
  id?: string;
  name: string;
  exercises: Workout['exercises'];
};

type ProgramInput = {
  id?: string;
  name: string;
  workoutIds: string[];
  startDate?: string;
  endDate?: string;
  phase?: string;
  durationWeeks?: number;
  restDays?: number;
  intensityCycle?: number[];
};

type SessionInput = {
  workoutName: string;
  workoutId?: string;
  durationSeconds: number;
  exercises: WorkoutSession['exercises'];
};

type StoreValue = State & {
  addCustomExercise: (name: string, category: Exercise['category']) => Exercise;
  deleteExercise: (id: string) => void;
  updateExerciseCategory: (id: string, category: ExerciseCategory | null) => void;
  mergeExercise: (sourceId: string, targetId: string) => void;
  saveWorkout: (input: WorkoutInput) => Workout;
  deleteWorkout: (id: string) => void;
  saveProgram: (input: ProgramInput) => Program;
  deleteProgram: (id: string) => void;
  setActiveProgram: (id: string | null) => void;
  logSession: (input: SessionInput) => { session: WorkoutSession; newPRs: PersonalRecord[] };
  deleteSession: (id: string) => void;
  upsertBodyweight: (input: { id?: string; date: string; weightKg: number; note?: string }) => BodyweightEntry;
  deleteBodyweight: (id: string) => void;
  upsertDailyMetric: (date: string, patch: Partial<DailyHealthMetric>) => DailyHealthMetric;
  deleteDailyMetric: (id: string) => void;
  upsertCardio: (input: Omit<CardioSession, 'id'> & { id?: string }) => CardioSession;
  deleteCardio: (id: string) => void;
  upsertSupplement: (input: Omit<Supplement, 'id' | 'createdAt'> & { id?: string }) => Supplement;
  deleteSupplement: (id: string) => void;
  upsertMedication: (input: Omit<Medication, 'id' | 'createdAt'> & { id?: string }) => Medication;
  deleteMedication: (id: string) => void;
  upsertCheckin: (weekDate: string, patch: Partial<WeeklyCheckin>) => WeeklyCheckin;
  deleteCheckin: (id: string) => void;
  addCustomFood: (food: Omit<Food, 'id' | 'isCustom'>) => Food;
  deleteFood: (id: string) => void;
  saveMealPlan: (input: { id?: string; name: string; meals: Meal[] }) => MealPlan;
  deleteMealPlan: (id: string) => void;
  setActiveMealPlan: (id: string | null) => void;
  toggleMealLog: (date: string, mealId: string) => void;
  saveHabit: (input: Omit<Habit, 'id' | 'createdAt' | 'sortOrder'> & { id?: string; sortOrder?: number }) => Habit;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string, archived: boolean) => void;
  upsertHabitLog: (habitId: string, date: string, patch: { value?: number; notes?: string }) => HabitLog;
  deleteHabitLog: (id: string) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  previewImport: (raw: unknown) => ImportPayload;
  commitImport: (payload: ImportPayload) => ImportReport;
};

const StoreContext = createContext<StoreValue | null>(null);

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function detectPRs(
  session: WorkoutSession,
  priorSessions: WorkoutSession[],
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  for (const se of session.exercises) {
    const priorSets: { weight: number; reps: number }[] = [];
    for (const ps of priorSessions) {
      for (const pse of ps.exercises) {
        if (pse.exerciseId !== se.exerciseId) continue;
        for (const st of pse.sets) priorSets.push(st);
      }
    }
    const priorMaxWeight = priorSets.reduce(
      (m, s) => (s.weight > m ? s.weight : m),
      0,
    );
    const priorMaxVolume = priorSets.reduce(
      (m, s) => (s.weight * s.reps > m ? s.weight * s.reps : m),
      0,
    );

    let bestWeightSet = se.sets[0];
    let bestVolumeSet = se.sets[0];
    for (const s of se.sets) {
      if (!bestWeightSet || s.weight > bestWeightSet.weight) bestWeightSet = s;
      if (!bestVolumeSet || s.weight * s.reps > bestVolumeSet.weight * bestVolumeSet.reps)
        bestVolumeSet = s;
    }

    if (bestWeightSet && bestWeightSet.weight > priorMaxWeight && bestWeightSet.weight > 0) {
      records.push({
        id: genId('pr'),
        exerciseId: se.exerciseId,
        kind: 'heaviest_weight',
        value: bestWeightSet.weight,
        weight: bestWeightSet.weight,
        reps: bestWeightSet.reps,
        sessionId: session.id,
        achievedAt: session.date,
      });
    }
    if (
      bestVolumeSet &&
      bestVolumeSet.weight * bestVolumeSet.reps > priorMaxVolume &&
      bestVolumeSet.weight * bestVolumeSet.reps > 0
    ) {
      records.push({
        id: genId('pr'),
        exerciseId: se.exerciseId,
        kind: 'best_volume',
        value: bestVolumeSet.weight * bestVolumeSet.reps,
        weight: bestVolumeSet.weight,
        reps: bestVolumeSet.reps,
        sessionId: session.id,
        achievedAt: session.date,
      });
    }
  }
  return records;
}

export function WorkoutStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: EXERCISE_LIBRARY,
              workouts: [],
              programs: [],
              sessions: DEMO_SESSIONS,
              personalRecords: [],
              bodyweight: [],
              dailyMetrics: [],
              cardio: [],
              supplements: [],
              medications: [],
              weeklyCheckins: [],
              foods: FOOD_LIBRARY,
              mealPlans: [],
              mealLogs: [],
              habits: [],
              habitLogs: [],
              settings: DEFAULT_SETTINGS,
            },
          });
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Partial<State>;
          const libIds = new Set(EXERCISE_LIBRARY.map((e) => e.id));
          const storedCustom = (parsed.exercises ?? []).filter((e) => !libIds.has(e.id));
          const storedCategoryOverrides = new Map(
            (parsed.exercises ?? [])
              .filter((e) => libIds.has(e.id))
              .map((e) => [e.id, e.category] as const),
          );
          const mergedLibrary = EXERCISE_LIBRARY.map((e) =>
            storedCategoryOverrides.has(e.id)
              ? { ...e, category: storedCategoryOverrides.get(e.id)! }
              : e,
          );
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: [...mergedLibrary, ...storedCustom],
              workouts: parsed.workouts ?? [],
              programs: parsed.programs ?? [],
              sessions: parsed.sessions ?? [],
              personalRecords: parsed.personalRecords ?? [],
              bodyweight: parsed.bodyweight ?? [],
              dailyMetrics: parsed.dailyMetrics ?? [],
              cardio: parsed.cardio ?? [],
              supplements: parsed.supplements ?? [],
              medications: parsed.medications ?? [],
              weeklyCheckins: parsed.weeklyCheckins ?? [],
              foods: (() => {
                const libIds = new Set(FOOD_LIBRARY.map((f) => f.id));
                const storedCustomFoods = (parsed.foods ?? []).filter(
                  (f) => !libIds.has(f.id),
                );
                return [...FOOD_LIBRARY, ...storedCustomFoods];
              })(),
              mealPlans: parsed.mealPlans ?? [],
              mealLogs: parsed.mealLogs ?? [],
              habits: parsed.habits ?? [],
              habitLogs: parsed.habitLogs ?? [],
              settings: {
                ...DEFAULT_SETTINGS,
                ...(parsed.settings ?? {}),
                goals: {
                  ...DEFAULT_SETTINGS.goals,
                  ...(parsed.settings?.goals ?? {}),
                },
                sync: {
                  ...DEFAULT_SETTINGS.sync,
                  ...(parsed.settings?.sync ?? {}),
                },
                featureFlags: {
                  ...DEFAULT_SETTINGS.featureFlags,
                  ...(parsed.settings?.featureFlags ?? {}),
                },
              },
            },
          });
        } catch {
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: EXERCISE_LIBRARY,
              workouts: [],
              programs: [],
              sessions: DEMO_SESSIONS,
              personalRecords: [],
              bodyweight: [],
              dailyMetrics: [],
              cardio: [],
              supplements: [],
              medications: [],
              weeklyCheckins: [],
              foods: FOOD_LIBRARY,
              mealPlans: [],
              mealLogs: [],
              habits: [],
              habitLogs: [],
              settings: DEFAULT_SETTINGS,
            },
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: EXERCISE_LIBRARY,
              workouts: [],
              programs: [],
              sessions: DEMO_SESSIONS,
              personalRecords: [],
              bodyweight: [],
              dailyMetrics: [],
              cardio: [],
              supplements: [],
              medications: [],
              weeklyCheckins: [],
              foods: FOOD_LIBRARY,
              mealPlans: [],
              mealLogs: [],
              habits: [],
              habitLogs: [],
              settings: DEFAULT_SETTINGS,
            },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const libIds = new Set(EXERCISE_LIBRARY.map((e) => e.id));
    const persistable = {
      exercises: state.exercises.filter(
        (e) =>
          e.isCustom ||
          (libIds.has(e.id) &&
            e.category !==
              EXERCISE_LIBRARY.find((lib) => lib.id === e.id)?.category),
      ),
      workouts: state.workouts,
      programs: state.programs,
      sessions: state.sessions,
      personalRecords: state.personalRecords,
      bodyweight: state.bodyweight,
      dailyMetrics: state.dailyMetrics,
      cardio: state.cardio,
      supplements: state.supplements,
      medications: state.medications,
      weeklyCheckins: state.weeklyCheckins,
      foods: state.foods.filter((f) => f.isCustom),
      mealPlans: state.mealPlans,
      mealLogs: state.mealLogs,
      habits: state.habits,
      habitLogs: state.habitLogs,
      settings: state.settings,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistable)).catch(() => {});
  }, [state]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      addCustomExercise: (name, category) => {
        const exercise: Exercise = {
          id: genId('ex'),
          name: name.trim(),
          category,
          isCustom: true,
        };
        dispatch({ type: 'ADD_EXERCISE', exercise });
        return exercise;
      },
      deleteExercise: (id) => dispatch({ type: 'DELETE_EXERCISE', id }),
      updateExerciseCategory: (id, category) =>
        dispatch({ type: 'UPDATE_EXERCISE_CATEGORY', id, category }),
      mergeExercise: (sourceId, targetId) =>
        dispatch({ type: 'MERGE_EXERCISE', sourceId, targetId }),
      saveWorkout: (input) => {
        const existing = input.id
          ? stateRef.current.workouts.find((w) => w.id === input.id)
          : undefined;
        const workout: Workout = {
          id: input.id ?? genId('wk'),
          name: input.name.trim(),
          exercises: input.exercises,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_WORKOUT', workout });
        return workout;
      },
      deleteWorkout: (id) => dispatch({ type: 'DELETE_WORKOUT', id }),
      saveProgram: (input) => {
        const existing = input.id
          ? stateRef.current.programs.find((p) => p.id === input.id)
          : undefined;
        const program: Program = {
          id: input.id ?? genId('pg'),
          name: input.name.trim(),
          workoutIds: input.workoutIds,
          startDate: input.startDate,
          endDate: input.endDate,
          phase: input.phase,
          durationWeeks: input.durationWeeks,
          restDays: input.restDays,
          intensityCycle: input.intensityCycle,
          isActive: existing?.isActive ?? false,
          isCustom: existing?.isCustom ?? true,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_PROGRAM', program });
        return program;
      },
      deleteProgram: (id) => dispatch({ type: 'DELETE_PROGRAM', id }),
      setActiveProgram: (id) => dispatch({ type: 'SET_ACTIVE_PROGRAM', id }),
      logSession: (input) => {
        const session: WorkoutSession = {
          id: genId('sess'),
          workoutName: input.workoutName,
          workoutId: input.workoutId,
          date: todayISO(),
          durationSeconds: input.durationSeconds,
          exercises: input.exercises,
        };
        const newPRs = detectPRs(session, stateRef.current.sessions);
        dispatch({ type: 'LOG_SESSION', session, newPRs });
        return { session, newPRs };
      },
      deleteSession: (id) => dispatch({ type: 'DELETE_SESSION', id }),
      upsertBodyweight: (input) => {
        const existing = input.id
          ? stateRef.current.bodyweight.find((b) => b.id === input.id)
          : stateRef.current.bodyweight.find((b) => b.date === input.date);
        const entry: BodyweightEntry = {
          id: existing?.id ?? genId('bw'),
          date: input.date,
          weightKg: input.weightKg,
          note: input.note,
        };
        dispatch({ type: 'UPSERT_BODYWEIGHT', entry });
        return entry;
      },
      deleteBodyweight: (id) => dispatch({ type: 'DELETE_BODYWEIGHT', id }),
      upsertDailyMetric: (date, patch) => {
        const existing = stateRef.current.dailyMetrics.find((m) => m.date === date);
        const metric: DailyHealthMetric = {
          id: existing?.id ?? genId('dm'),
          date,
          ...existing,
          ...patch,
        };
        dispatch({ type: 'UPSERT_DAILY_METRIC', metric });
        return metric;
      },
      deleteDailyMetric: (id) => dispatch({ type: 'DELETE_DAILY_METRIC', id }),
      upsertCardio: (input) => {
        const session: CardioSession = {
          id: input.id ?? genId('cardio'),
          date: input.date,
          activityType: input.activityType,
          durationMin: input.durationMin,
          distanceKm: input.distanceKm,
          avgHr: input.avgHr,
          calories: input.calories,
          notes: input.notes,
        };
        dispatch({ type: 'UPSERT_CARDIO', session });
        return session;
      },
      deleteCardio: (id) => dispatch({ type: 'DELETE_CARDIO', id }),
      upsertSupplement: (input) => {
        const existing = input.id
          ? stateRef.current.supplements.find((s) => s.id === input.id)
          : undefined;
        const supplement: Supplement = {
          id: input.id ?? genId('sup'),
          name: input.name,
          dose: input.dose,
          notes: input.notes,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_SUPPLEMENT', supplement });
        return supplement;
      },
      deleteSupplement: (id) => dispatch({ type: 'DELETE_SUPPLEMENT', id }),
      upsertMedication: (input) => {
        const existing = input.id
          ? stateRef.current.medications.find((m) => m.id === input.id)
          : undefined;
        const medication: Medication = {
          id: input.id ?? genId('med'),
          name: input.name,
          dose: input.dose,
          unit: input.unit,
          frequency: input.frequency,
          startDate: input.startDate,
          weekdays: input.weekdays,
          notes: input.notes,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_MEDICATION', medication });
        return medication;
      },
      deleteMedication: (id) => dispatch({ type: 'DELETE_MEDICATION', id }),
      upsertCheckin: (weekDate, patch) => {
        const existing = stateRef.current.weeklyCheckins.find(
          (c) => c.weekDate === weekDate,
        );
        const checkin: WeeklyCheckin = {
          id: existing?.id ?? genId('ck'),
          weekDate,
          ...existing,
          ...patch,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_CHECKIN', checkin });
        return checkin;
      },
      deleteCheckin: (id) => dispatch({ type: 'DELETE_CHECKIN', id }),
      addCustomFood: (food) => {
        const f: Food = { ...food, id: genId('fd'), isCustom: true };
        dispatch({ type: 'ADD_FOOD', food: f });
        return f;
      },
      deleteFood: (id) => dispatch({ type: 'DELETE_FOOD', id }),
      saveMealPlan: (input) => {
        const existing = input.id
          ? stateRef.current.mealPlans.find((p) => p.id === input.id)
          : undefined;
        const plan: MealPlan = {
          id: input.id ?? genId('mp'),
          name: input.name.trim(),
          meals: input.meals,
          isActive: existing?.isActive ?? false,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_MEAL_PLAN', plan });
        return plan;
      },
      deleteMealPlan: (id) => dispatch({ type: 'DELETE_MEAL_PLAN', id }),
      setActiveMealPlan: (id) =>
        dispatch({ type: 'SET_ACTIVE_MEAL_PLAN', id }),
      toggleMealLog: (date, mealId) =>
        dispatch({ type: 'TOGGLE_MEAL_LOG', date, mealId }),
      saveHabit: (input) => {
        const existing = input.id
          ? stateRef.current.habits.find((h) => h.id === input.id)
          : undefined;
        const habit: Habit = {
          id: input.id ?? genId('hb'),
          name: input.name.trim(),
          icon: input.icon,
          color: input.color,
          frequency: input.frequency,
          customDays: input.customDays,
          targetValue: input.targetValue,
          unit: input.unit,
          sortOrder:
            input.sortOrder ?? existing?.sortOrder ?? stateRef.current.habits.length,
          archived: input.archived ?? existing?.archived ?? false,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_HABIT', habit });
        return habit;
      },
      deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', id }),
      archiveHabit: (id, archived) => {
        const habit = stateRef.current.habits.find((h) => h.id === id);
        if (!habit) return;
        dispatch({ type: 'UPSERT_HABIT', habit: { ...habit, archived } });
      },
      upsertHabitLog: (habitId, date, patch) => {
        const existing = stateRef.current.habitLogs.find(
          (l) => l.habitId === habitId && l.date === date,
        );
        const log: HabitLog = {
          id: existing?.id ?? genId('hl'),
          habitId,
          date,
          value: patch.value ?? existing?.value,
          notes: patch.notes ?? existing?.notes,
        };
        dispatch({ type: 'UPSERT_HABIT_LOG', log });
        return log;
      },
      deleteHabitLog: (id) => dispatch({ type: 'DELETE_HABIT_LOG', id }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      previewImport: (raw) =>
        buildImportPayload(
          raw,
          stateRef.current.exercises.filter((e) => e.isCustom),
          stateRef.current.settings.defaultRestSeconds,
        ),
      commitImport: (payload) => {
        dispatch({ type: 'BULK_IMPORT', payload });
        return payload.report;
      },
    }),
    [state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within WorkoutStoreProvider');
  return ctx;
}
