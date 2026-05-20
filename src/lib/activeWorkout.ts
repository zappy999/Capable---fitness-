import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workout } from '../store/types';
import { WORKOUTS as DEMO_WORKOUTS } from '../data/workouts';

/**
 * Lightweight module-level pub-sub tracking the currently-paused
 * workout, if any. start-workout.tsx writes here when entering /
 * leaving a session; the (tabs) layout reads it to decide whether
 * to render the "Resume active workout" bar above the tab bar.
 *
 * Module state is the source of truth while the JS runtime is
 * alive. After an app kill, `bootstrapActiveWorkout` scans
 * AsyncStorage for the draft keys start-workout writes and
 * repopulates so the bar reappears on relaunch.
 */
export type ActiveWorkoutKind = 'user' | 'demo' | 'fallback';

export type ActiveWorkout = {
  kind: ActiveWorkoutKind;
  workoutId?: string;
  name: string;
  startedAt: number;
};

const DRAFT_KEY_PREFIX = 'capable-draft-';

type Listener = (state: ActiveWorkout | null) => void;
let current: ActiveWorkout | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(current);
}

export function setActiveWorkout(next: ActiveWorkout | null) {
  current = next;
  emit();
}

export function getActiveWorkout(): ActiveWorkout | null {
  return current;
}

export function useActiveWorkout(): ActiveWorkout | null {
  const [state, setState] = useState<ActiveWorkout | null>(current);
  useEffect(() => {
    // Sync to whatever the latest module state is in case a write
    // happened between the initial useState read and this effect.
    setState(current);
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

/**
 * Scan AsyncStorage for a `capable-draft-<kind>-<workoutId>` entry
 * left behind by a previous app run and rehydrate the module state.
 * Idempotent and silent on failure. Called once from the (tabs)
 * layout on mount.
 */
export async function bootstrapActiveWorkout(
  userWorkouts: Workout[],
): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const draftKeys = allKeys.filter((k) => k.startsWith(DRAFT_KEY_PREFIX));
    if (draftKeys.length === 0) {
      setActiveWorkout(null);
      return;
    }

    // Pull each draft, sort by startedAt desc, keep the most recent.
    const entries = await AsyncStorage.multiGet(draftKeys);
    let best: { key: string; startedAt: number } | null = null;
    for (const [key, raw] of entries) {
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { startedAt?: number };
        const startedAt = typeof parsed?.startedAt === 'number'
          ? parsed.startedAt
          : 0;
        if (!best || startedAt > best.startedAt) {
          best = { key, startedAt };
        }
      } catch {
        // Corrupt entry — skip
      }
    }

    if (!best) {
      setActiveWorkout(null);
      return;
    }

    // Key format: capable-draft-<kind>-<workoutId-or-"fallback">
    const tail = best.key.slice(DRAFT_KEY_PREFIX.length);
    const dashIdx = tail.indexOf('-');
    if (dashIdx < 0) {
      setActiveWorkout(null);
      return;
    }
    const kind = tail.slice(0, dashIdx) as ActiveWorkoutKind;
    const idOrFallback = tail.slice(dashIdx + 1);
    const workoutId =
      idOrFallback === 'fallback' ? undefined : idOrFallback;

    // Resolve the human-readable name from whichever source matches.
    let name = 'Workout in progress';
    if (kind === 'user' && workoutId) {
      const match = userWorkouts.find((w) => w.id === workoutId);
      if (match) name = match.name;
    } else if (kind === 'demo' && workoutId) {
      const match = DEMO_WORKOUTS.find((w) => w.id === workoutId);
      if (match) name = match.name;
    }

    setActiveWorkout({ kind, workoutId, name, startedAt: best.startedAt });
  } catch {
    // AsyncStorage read failed — leave module state as-is.
  }
}

/**
 * Explicit clear — wipes BOTH the module state and any draft entries
 * in AsyncStorage. Called from a "Discard active workout" CTA in the
 * resume bar (optional).
 */
export async function discardActiveWorkout(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const draftKeys = allKeys.filter((k) => k.startsWith(DRAFT_KEY_PREFIX));
    if (draftKeys.length > 0) {
      await AsyncStorage.multiRemove(draftKeys);
    }
  } catch {}
  setActiveWorkout(null);
}
