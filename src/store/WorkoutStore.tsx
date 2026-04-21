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
import type {
  Exercise,
  ExerciseCategory,
  PersonalRecord,
  Program,
  Workout,
  WorkoutSession,
} from './types';

const STORAGE_KEY = 'capable.store.v2';

type State = {
  hydrated: boolean;
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
};

const initialState: State = {
  hydrated: false,
  exercises: EXERCISE_LIBRARY,
  workouts: [],
  programs: [],
  sessions: [],
  personalRecords: [],
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
  | { type: 'DELETE_SESSION'; id: string };

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
