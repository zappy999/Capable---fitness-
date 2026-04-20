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
import type { Exercise, Program, Workout } from './types';

const STORAGE_KEY = 'capable.store.v1';

type State = {
  hydrated: boolean;
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
};

const initialState: State = {
  hydrated: false,
  exercises: EXERCISE_LIBRARY,
  workouts: [],
  programs: [],
};

type Action =
  | { type: 'HYDRATE'; payload: Omit<State, 'hydrated'> }
  | { type: 'ADD_EXERCISE'; exercise: Exercise }
  | { type: 'DELETE_EXERCISE'; id: string }
  | { type: 'UPSERT_WORKOUT'; workout: Workout }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'UPSERT_PROGRAM'; program: Program }
  | { type: 'DELETE_PROGRAM'; id: string }
  | { type: 'SET_ACTIVE_PROGRAM'; id: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.payload, hydrated: true };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.exercise] };
    case 'DELETE_EXERCISE':
      return { ...state, exercises: state.exercises.filter((e) => e.id !== action.id) };
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
};

type StoreValue = State & {
  addCustomExercise: (name: string, category: Exercise['category']) => Exercise;
  deleteExercise: (id: string) => void;
  saveWorkout: (input: WorkoutInput) => Workout;
  deleteWorkout: (id: string) => void;
  saveProgram: (input: ProgramInput) => Program;
  deleteProgram: (id: string) => void;
  setActiveProgram: (id: string | null) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
            },
          });
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Partial<State>;
          const libIds = new Set(EXERCISE_LIBRARY.map((e) => e.id));
          const storedCustom = (parsed.exercises ?? []).filter((e) => !libIds.has(e.id));
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: [...EXERCISE_LIBRARY, ...storedCustom],
              workouts: parsed.workouts ?? [],
              programs: parsed.programs ?? [],
            },
          });
        } catch {
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: EXERCISE_LIBRARY,
              workouts: [],
              programs: [],
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
    const persistable = {
      exercises: state.exercises.filter((e) => e.isCustom),
      workouts: state.workouts,
      programs: state.programs,
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
          isActive: existing?.isActive ?? false,
          isCustom: existing?.isCustom ?? true,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        dispatch({ type: 'UPSERT_PROGRAM', program });
        return program;
      },
      deleteProgram: (id) => dispatch({ type: 'DELETE_PROGRAM', id }),
      setActiveProgram: (id) => dispatch({ type: 'SET_ACTIVE_PROGRAM', id }),
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
