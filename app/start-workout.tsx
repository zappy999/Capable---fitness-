import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccent, useStore } from '../src/store/WorkoutStore';
import type { PersonalRecord, Workout } from '../src/store/types';
import type { AchievementDef } from '../src/lib/achievements';
import { WORKOUTS as DEMO_WORKOUTS } from '../src/data/workouts';
import {
  cancelNotification,
  haptic,
  scheduleRestNotification,
  shareContent,
} from '../src/lib/platform';

type DraftSnapshot = {
  startedAt: number;
  activeIdx: number;
  exercises: ExerciseLog[];
};

function draftKey(kind: SourceKind, workoutId?: string) {
  return `capable-draft-${kind}-${workoutId ?? 'fallback'}`;
}

function parseRestSeconds(rest: string, fallback = 90): number {
  const s = rest.match(/(\d+)\s*s/i);
  if (s) return Number(s[1]);
  const m = rest.match(/(\d+)\s*min/i);
  if (m) return Number(m[1]) * 60;
  const n = Number(rest);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 110;

type SetLog = {
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  completed: boolean;
};

type ExerciseLog = {
  id: string;
  exerciseId?: string;
  name: string;
  target: string;
  rest: string;
  tempo: string;
  note?: string;
  pr?: number;
  sets: SetLog[];
  isDropSet?: boolean;
  supersetGroup?: string;
  groupType?: 'superset' | 'circuit' | 'emom';
  emomSeconds?: number;
};

type SummarySetCompare = {
  prev?: { weight: number; reps: number };
  curr: { weight: number; reps: number };
};

type SummaryRow = {
  name: string;
  sets: SummarySetCompare[];
};

type WorkoutSummary = {
  workoutName: string;
  date: string;
  durationSeconds: number;
  exerciseCount: number;
  setCount: number;
  rows: SummaryRow[];
  newPRs: PersonalRecord[];
  newlyUnlocked: AchievementDef[];
  sessionId: string | null;
};

type SwipeableSetCardProps = {
  set: SetLog;
  setIdx: number;
  isNext: boolean;
  isDone: boolean;
  onDecWeight: () => void;
  onIncWeight: () => void;
  onDecReps: () => void;
  onIncReps: () => void;
  onChangeWeight: (v: number) => void;
  onChangeReps: (v: number) => void;
  onComplete: () => void;
};

function SwipeableSetCard({
  set,
  setIdx,
  isNext,
  isDone,
  onDecWeight,
  onIncWeight,
  onDecReps,
  onIncReps,
  onChangeWeight,
  onChangeReps,
  onComplete,
}: SwipeableSetCardProps) {
  const NEON = useAccent();
  const translateX = useSharedValue(0);
  const [weightText, setWeightText] = useState(
    set.weight > 0 ? String(set.weight) : '',
  );
  const [repsText, setRepsText] = useState(
    set.reps > 0 ? String(set.reps) : '',
  );

  useEffect(() => {
    const parsed = parseFloat(weightText.replace(',', '.')) || 0;
    if (parsed !== set.weight) {
      setWeightText(set.weight > 0 ? String(set.weight) : '');
    }
  }, [set.weight]);

  useEffect(() => {
    const parsed = parseInt(repsText, 10) || 0;
    if (parsed !== set.reps) {
      setRepsText(set.reps > 0 ? String(set.reps) : '');
    }
  }, [set.reps]);

  const pan = Gesture.Pan()
    .enabled(!isDone)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(onComplete)();
        translateX.value = withTiming(0, { duration: 220 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: progress };
  });

  const iconStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.6, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale: progress }] };
  });

  const hintStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const borderColor = isNext
    ? NEON
    : isDone
      ? 'rgba(34,197,94,0.3)'
      : 'rgba(255,255,255,0.08)';
  const cardBg = isDone ? 'rgba(34,197,94,0.05)' : '#101010';

  return (
    <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(34,197,94,0.18)',
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 24,
          },
          fillStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <Ionicons name="checkmark-circle" size={32} color={NEON} />
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              borderRadius: 16,
              padding: 16,
              borderWidth: isNext ? 2 : 1,
              borderColor,
              backgroundColor: cardBg,
            },
            cardStyle,
          ]}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              Set {setIdx + 1}
            </Text>
            {isNext ? (
              <View style={{ backgroundColor: NEON }} className="px-2.5 py-1 rounded-full">
                <Text className="text-black font-bold" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                  NEXT
                </Text>
              </View>
            ) : null}
            {isDone ? (
              <View
                style={{ backgroundColor: 'rgba(34,197,94,0.2)' }}
                className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
              >
                <Ionicons name="checkmark" size={12} color={NEON} />
                <Text style={{ color: NEON, fontSize: 11 }} className="font-bold">
                  DONE
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-gray-500 font-bold mb-2" style={{ fontSize: 12 }}>
                Weight
              </Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={onDecWeight}
                  disabled={isDone}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                >
                  <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                    −
                  </Text>
                </Pressable>
                <TextInput
                  value={weightText}
                  onChangeText={(v) => {
                    setWeightText(v);
                    const parsed = parseFloat(v.replace(',', '.'));
                    onChangeWeight(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  editable={!isDone}
                  keyboardType="decimal-pad"
                  placeholder="kg"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-center"
                  style={{ fontSize: 14 }}
                />
                <Pressable
                  onPress={onIncWeight}
                  disabled={isDone}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                >
                  <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 font-bold mb-2" style={{ fontSize: 12 }}>
                Reps
              </Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={onDecReps}
                  disabled={isDone}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                >
                  <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                    −
                  </Text>
                </Pressable>
                <TextInput
                  value={repsText}
                  onChangeText={(v) => {
                    setRepsText(v);
                    const parsed = parseInt(v, 10);
                    onChangeReps(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  editable={!isDone}
                  keyboardType="number-pad"
                  placeholder="reps"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-center"
                  style={{ fontSize: 14 }}
                />
                <Pressable
                  onPress={onIncReps}
                  disabled={isDone}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                >
                  <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-3">
            {isDone ? (
              <Text style={{ color: NEON, fontSize: 13 }} className="italic">
                ✓ Completed
              </Text>
            ) : (
              <Animated.Text
                style={[{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }, hintStyle]}
              >
                Swipe right to complete →
              </Animated.Text>
            )}
            <Pressable className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 active:opacity-70">
              <Text className="text-white font-bold" style={{ fontSize: 13 }}>
                More
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const INITIAL_EXERCISES: ExerciseLog[] = [
  {
    id: 'ex1',
    name: 'T Bar Row',
    target: '2x12-15',
    rest: '120s',
    tempo: '3011',
    note: 'Pronated grip',
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
  {
    id: 'ex2',
    name: 'Lat Pulldown',
    target: '2x12-15',
    rest: '120s',
    tempo: '3011',
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
  {
    id: 'ex3',
    name: 'Incline Cable Chest Press',
    target: '2x12-15',
    rest: '120s',
    tempo: '3010',
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
  {
    id: 'ex4',
    name: 'Pec Deck',
    target: '2x12-15',
    rest: '120s',
    tempo: '3011',
    pr: 82,
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
  {
    id: 'ex5',
    name: 'BB Shrugs',
    target: '2x12-15',
    rest: '120s',
    tempo: '3011',
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
  {
    id: 'ex6',
    name: 'Standing Calf Raises',
    target: '3x12-15',
    rest: '120s',
    tempo: '3011',
    pr: 75,
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
  {
    id: 'ex7',
    name: 'Decline Weighted Sit-ups',
    target: '3x1',
    rest: '120s',
    tempo: '3010',
    sets: [
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
      { weight: 0, reps: 0, completed: false },
    ],
  },
];

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatRest(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type SourceKind = 'user' | 'demo' | 'fallback';

function resolveSource(
  id: string | undefined,
  userWorkouts: Workout[],
  library: { id: string; name: string }[],
): { kind: SourceKind; name: string; workoutId?: string; exercises: ExerciseLog[] } {
  if (id) {
    const user = userWorkouts.find((w) => w.id === id);
    if (user) {
      return {
        kind: 'user',
        name: user.name,
        workoutId: user.id,
        exercises: user.exercises.map((we) => {
          const ex = library.find((e) => e.id === we.exerciseId);
          return {
            id: we.id,
            exerciseId: we.exerciseId,
            name: ex?.name ?? 'Exercise',
            target: `${we.sets}x${we.reps}`,
            rest: `${we.restSeconds}s`,
            tempo: we.tempo ?? '',
            note: we.note,
            isDropSet: we.isDropSet,
            supersetGroup: we.supersetGroup,
            groupType: we.groupType,
            emomSeconds: we.emomSeconds,
            sets: Array.from({ length: Math.max(1, we.sets) }, () => ({
              weight: 0,
              reps: 0,
              completed: false,
            })),
          };
        }),
      };
    }
    const demo = DEMO_WORKOUTS.find((w) => w.id === id);
    if (demo) {
      return {
        kind: 'demo',
        name: demo.name,
        exercises: demo.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          target: `${ex.sets}x${ex.reps}`,
          rest: ex.rest,
          tempo: '',
          sets: Array.from({ length: Math.max(1, ex.sets) }, () => ({
            weight: 0,
            reps: 0,
            completed: false,
          })),
        })),
      };
    }
  }
  return {
    kind: 'fallback',
    name: 'WD - Push + Pull',
    exercises: INITIAL_EXERCISES.map((e) => ({
      ...e,
      sets: e.sets.map((s) => ({ ...s })),
    })),
  };
}

export default function StartWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    workouts,
    exercises: libraryExercises,
    sessions,
    addCustomExercise,
    logSession,
    settings,
  } = useStore();
  const NEON = useAccent();

  const routeId = typeof params.id === 'string' ? params.id : undefined;

  const source = useMemo(
    () => resolveSource(routeId, workouts, libraryExercises),
    [routeId, workouts, libraryExercises],
  );

  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<ExerciseLog[]>(source.exercises);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restNotificationId, setRestNotificationId] = useState<string | null>(null);
  const [noteEditOpen, setNoteEditOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  const prefillFirstSets = (exs: ExerciseLog[]): ExerciseLog[] =>
    exs.map((ex) => {
      let exId = ex.exerciseId;
      if (!exId) {
        const match = libraryExercises.find(
          (e) => e.name.toLowerCase() === ex.name.toLowerCase(),
        );
        exId = match?.id;
      }
      if (!exId) return ex;

      let prior: (typeof sessions)[number] | null = null;
      for (const s of sessions) {
        if (!s.exercises.some((se) => se.exerciseId === exId)) continue;
        if (!prior || s.date > prior.date) prior = s;
      }
      const priorFirst = prior?.exercises.find((se) => se.exerciseId === exId)
        ?.sets[0];
      if (!priorFirst || (priorFirst.weight === 0 && priorFirst.reps === 0)) {
        return ex;
      }

      const firstSet = ex.sets[0];
      if (
        !firstSet ||
        firstSet.completed ||
        firstSet.weight !== 0 ||
        firstSet.reps !== 0
      ) {
        return ex;
      }
      const nextSets = [...ex.sets];
      nextSets[0] = {
        ...firstSet,
        weight: priorFirst.weight,
        reps: priorFirst.reps,
      };
      return { ...ex, sets: nextSets };
    });

  useEffect(() => {
    const key = `${source.kind}:${source.workoutId ?? 'fallback'}`;
    if (key === loadedFor) return;
    let cancelled = false;
    setHydrating(true);
    (async () => {
      let restored = false;
      try {
        const raw = await AsyncStorage.getItem(
          draftKey(source.kind, source.workoutId),
        );
        if (!cancelled && raw) {
          const parsed: unknown = JSON.parse(raw);
          const draft =
            parsed && typeof parsed === 'object'
              ? (parsed as DraftSnapshot)
              : null;
          if (
            draft &&
            Array.isArray(draft.exercises) &&
            typeof draft.startedAt === 'number'
          ) {
            setStartedAt(draft.startedAt);
            setElapsed(Math.max(0, Math.floor((Date.now() - draft.startedAt) / 1000)));
            setExercises(draft.exercises);
            setActiveIdx(
              Math.max(0, Math.min(draft.activeIdx ?? 0, draft.exercises.length - 1)),
            );
            restored = true;
          }
        }
      } catch {
        // Corrupt draft: fall through to fresh init below.
      }
      if (!cancelled && !restored) {
        const now = Date.now();
        setStartedAt(now);
        setElapsed(0);
        setExercises(prefillFirstSets(source.exercises));
        setActiveIdx(0);
      }
      if (!cancelled) {
        setLoadedFor(key);
        setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, loadedFor]);

  useEffect(() => {
    if (hydrating) return;
    const key = draftKey(source.kind, source.workoutId);
    const draft: DraftSnapshot = { startedAt, activeIdx, exercises };
    AsyncStorage.setItem(key, JSON.stringify(draft)).catch(() => {});
  }, [exercises, activeIdx, startedAt, hydrating, source.kind, source.workoutId]);

  const clearDraft = () => {
    return AsyncStorage.removeItem(
      draftKey(source.kind, source.workoutId),
    ).catch(() => {});
  };

  const handleFinish = () => {
    const loggedExercises = exercises
      .map((ex) => {
        const completedSets = ex.sets
          .filter((s) => s.completed)
          .map((s) => ({
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            rir: s.rir,
          }));
        if (completedSets.length === 0) return null;
        let exerciseId = ex.exerciseId;
        if (!exerciseId) {
          const match = libraryExercises.find(
            (e) => e.name.toLowerCase() === ex.name.toLowerCase(),
          );
          exerciseId = match ? match.id : addCustomExercise(ex.name, null).id;
        }
        return {
          id: `se-${ex.id}`,
          exerciseId,
          name: ex.name,
          sets: completedSets,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    if (loggedExercises.length === 0) {
      cancelNotification(restNotificationId);
      clearDraft();
      router.back();
      return;
    }

    // Snapshot prior first-N sets per exercise BEFORE logging this session.
    const priorByExId = new Map<
      string,
      Array<{ weight: number; reps: number }>
    >();
    for (const le of loggedExercises) {
      let mostRecent: (typeof sessions)[number] | null = null;
      for (const s of sessions) {
        if (!s.exercises.some((se) => se.exerciseId === le.exerciseId)) continue;
        if (!mostRecent || s.date > mostRecent.date) mostRecent = s;
      }
      const priorEx = mostRecent?.exercises.find(
        (se) => se.exerciseId === le.exerciseId,
      );
      if (priorEx) {
        priorByExId.set(
          le.exerciseId,
          priorEx.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        );
      }
    }

    const result = logSession({
      workoutName: source.name,
      workoutId: source.workoutId,
      durationSeconds: elapsed,
      exercises: loggedExercises.map(({ name, ...rest }) => rest),
    });

    const rows: SummaryRow[] = loggedExercises.map((le) => {
      const prior = priorByExId.get(le.exerciseId);
      return {
        name: le.name,
        sets: le.sets.map((curr, i) => ({
          curr: { weight: curr.weight, reps: curr.reps },
          prev: prior?.[i],
        })),
      };
    });

    const setCount = loggedExercises.reduce((a, e) => a + e.sets.length, 0);

    cancelNotification(restNotificationId);
    clearDraft();
    haptic('success');

    setSummary({
      workoutName: source.name,
      date: result.session.date,
      durationSeconds: elapsed,
      exerciseCount: loggedExercises.length,
      setCount,
      rows,
      newPRs: result.newPRs,
      newlyUnlocked: result.newlyUnlocked,
      sessionId: result.session.id,
    });
  };

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      haptic('success');
      setRestRemaining(null);
      setRestNotificationId(null);
      return;
    }
    const t = setTimeout(() => setRestRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [restRemaining]);

  useEffect(() => {
    return () => {
      cancelNotification(restNotificationId);
    };
  }, [restNotificationId]);

  const stats = useMemo(() => {
    const totalSets = exercises.reduce((acc, e) => acc + e.sets.length, 0);
    const completedSets = exercises.reduce(
      (acc, e) => acc + e.sets.filter((s) => s.completed).length,
      0,
    );
    const completedExercises = exercises.filter((e) => e.sets.every((s) => s.completed)).length;
    const volume = exercises.reduce(
      (acc, e) => acc + e.sets.reduce((sa, s) => sa + (s.completed ? s.weight * s.reps : 0), 0),
      0,
    );
    const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    return {
      totalEx: exercises.length,
      activeExNum: activeIdx + 1,
      totalSets,
      completedSets,
      completedExercises,
      volume,
      pct,
    };
  }, [exercises, activeIdx]);

  const active = exercises[activeIdx];
  const upcoming = exercises
    .map((e, i) => ({ ...e, _idx: i }))
    .filter(
      (e) => e._idx !== activeIdx && !e.sets.every((s) => s.completed),
    );
  const completed = exercises
    .map((e, i) => ({ ...e, _idx: i }))
    .filter((e) => e.sets.every((s) => s.completed));

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<SetLog>) => {
    setExercises((prev) => {
      const next = prev.map((e, i) => {
        if (i !== exIdx) return e;
        return {
          ...e,
          sets: e.sets.map((s, si) => (si === setIdx ? { ...s, ...patch } : s)),
        };
      });
      return next;
    });
  };

  const completeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        const justCompleted = e.sets[setIdx];
        const nextSets = e.sets.map((s, si) => {
          if (si === setIdx) return { ...s, completed: true };
          if (
            setIdx === 0 &&
            si > 0 &&
            !s.completed &&
            s.weight === 0 &&
            s.reps === 0
          ) {
            return {
              ...s,
              weight: justCompleted.weight,
              reps: justCompleted.reps,
            };
          }
          return s;
        });
        return { ...e, sets: nextSets };
      }),
    );
    haptic('light');
    const restSeconds = parseRestSeconds(
      exercises[exIdx]?.rest ?? `${settings.defaultRestSeconds}s`,
      settings.defaultRestSeconds,
    );
    setRestRemaining(restSeconds);
    cancelNotification(restNotificationId);
    setRestNotificationId(null);
    scheduleRestNotification(restSeconds, 'Ready for your next set').then((id) => {
      if (id) setRestNotificationId(id);
    });
    setTimeout(() => {
      setExercises((curr) => {
        const ex = curr[exIdx];
        if (ex.sets.every((s) => s.completed)) {
          const nextIdx = curr.findIndex(
            (e, i) => i !== exIdx && !e.sets.every((s) => s.completed),
          );
          if (nextIdx >= 0) setActiveIdx(nextIdx);
        }
        return curr;
      });
    }, 50);
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? { ...e, sets: [...e.sets, { weight: 0, reps: 0, completed: false }] }
          : e,
      ),
    );
  };

  const nextSetIdx = active.sets.findIndex((s) => !s.completed);

  if (summary) {
    return (
      <WorkoutSummaryView
        summary={summary}
        accent={NEON}
        onDone={() => {
          setSummary(null);
          router.dismissTo('/');
        }}
        onView={() => {
          if (summary.sessionId) {
            router.replace(`/sessions/${summary.sessionId}`);
          } else {
            router.back();
          }
        }}
        onShare={() => shareWorkoutSummary(summary)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        <View className="mx-4 mt-2 mb-4 rounded-3xl border border-white/10 bg-[#101010] p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <View
                  style={{ backgroundColor: NEON }}
                  className="w-2 h-2 rounded-full"
                />
                <Text
                  style={{ color: NEON, letterSpacing: 1.5 }}
                  className="text-[11px] font-bold"
                  numberOfLines={1}
                >
                  LIVE · {source.name.toUpperCase()}
                </Text>
              </View>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-white font-bold" style={{ fontSize: 28 }}>
                  {formatElapsed(elapsed)}
                </Text>
                <Text
                  className="text-gray-500 font-bold"
                  style={{ fontSize: 11, letterSpacing: 1.5 }}
                >
                  ELAPSED
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleFinish}
              style={{ backgroundColor: NEON }}
              className="px-5 py-2.5 rounded-2xl active:opacity-80"
            >
              <Text className="text-black font-bold" style={{ fontSize: 13, letterSpacing: 1 }}>
                FINISH
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 rounded-2xl bg-white/5 border border-white/5 px-4 py-3 flex-row items-center">
            <View className="flex-1">
              <Text
                className="text-gray-500 font-bold mb-1"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                EX
              </Text>
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                {stats.activeExNum}/{stats.totalEx}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-gray-500 font-bold mb-1"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                SETS
              </Text>
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                {stats.completedSets}/{stats.totalSets}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text
                className="text-gray-500 font-bold mb-1"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                VOL
              </Text>
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                {stats.volume}kg
              </Text>
            </View>
            <View
              className="ml-3 px-3 py-2 rounded-xl items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
            >
              <Text style={{ color: NEON, fontSize: 14 }} className="font-bold">
                {stats.pct}%
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row gap-1.5">
            {exercises.map((e, i) => {
              const done = e.sets.every((s) => s.completed);
              const isActive = i === activeIdx;
              return (
                <View
                  key={e.id}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    backgroundColor: done
                      ? NEON
                      : isActive
                        ? '#ffffff'
                        : 'rgba(255,255,255,0.12)',
                  }}
                />
              );
            })}
          </View>
        </View>

        <View className="mx-4 mb-4 rounded-3xl border border-white/10 bg-[#101010] p-5">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-white font-bold" style={{ fontSize: 22 }}>
                {active.name}
              </Text>
              <Text className="text-gray-500 mt-1" style={{ fontSize: 13 }}>
                Target: {active.target} · {stats.completedSets === 0 ? '0' : active.sets.filter(s => s.completed).length}/{active.sets.length} sets
              </Text>
              <Text className="text-gray-500 mt-0.5" style={{ fontSize: 13 }}>
                Rest: {active.rest}   Tempo: {active.tempo}
              </Text>
              {active.isDropSet || active.groupType ? (
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                  {active.isDropSet ? (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: '#FBBF24', letterSpacing: 0.5 }}
                      >
                        DROP SET
                      </Text>
                    </View>
                  ) : null}
                  {active.groupType ? (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: NEON, letterSpacing: 0.5 }}
                      >
                        {active.groupType === 'emom'
                          ? `EMOM ${active.emomSeconds ?? ''}s`.trim()
                          : active.groupType.toUpperCase()}
                        {active.supersetGroup ? ` · ${active.supersetGroup}` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {active.note ? (
                <Text className="text-gray-400 italic mt-2" style={{ fontSize: 13 }}>
                  {active.note}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                setNoteDraft(active.note ?? '');
                setNoteEditOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 active:opacity-70"
            >
              <Text className="text-white font-bold" style={{ fontSize: 13 }}>
                {active.note ? 'Edit' : 'Note'}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-1.5 mt-1 mb-1">
            {active.sets.map((s, i) => (
              <View
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: s.completed ? NEON : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </View>

          <View className="mt-4 gap-3">
            {active.sets.map((set, i) => (
              <SwipeableSetCard
                key={`${active.id}-${i}`}
                set={set}
                setIdx={i}
                isNext={i === nextSetIdx}
                isDone={set.completed}
                onDecWeight={() =>
                  updateSet(activeIdx, i, { weight: Math.max(0, set.weight - 2.5) })
                }
                onIncWeight={() => updateSet(activeIdx, i, { weight: set.weight + 2.5 })}
                onDecReps={() => updateSet(activeIdx, i, { reps: Math.max(0, set.reps - 1) })}
                onIncReps={() => updateSet(activeIdx, i, { reps: set.reps + 1 })}
                onChangeWeight={(weight) => updateSet(activeIdx, i, { weight })}
                onChangeReps={(reps) => updateSet(activeIdx, i, { reps })}
                onComplete={() => completeSet(activeIdx, i)}
              />
            ))}

            <Pressable
              onPress={() => addSet(activeIdx)}
              className="self-start px-5 py-3 rounded-2xl bg-white/5 border border-white/10 active:opacity-70"
            >
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                + Add Set
              </Text>
            </Pressable>
          </View>
        </View>

        {upcoming.length > 0 ? (
          <View className="px-4 mb-3">
            <Text
              className="text-gray-500 font-bold mb-3"
              style={{ fontSize: 11, letterSpacing: 1.5 }}
            >
              UP NEXT · {upcoming.length} REMAINING
            </Text>
            <View className="gap-2.5">
              {upcoming.map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => setActiveIdx(ex._idx)}
                  className="rounded-2xl bg-[#101010] border border-white/10 p-4 flex-row items-center gap-3 active:opacity-80"
                >
                  <View className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                    <Text className="text-gray-400 font-bold" style={{ fontSize: 15 }}>
                      {ex._idx + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                        {ex.name}
                      </Text>
                      {ex.pr ? (
                        <Text style={{ color: NEON, fontSize: 12 }} className="font-bold">
                          PR {ex.pr}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      className="text-gray-500 mt-0.5"
                      style={{ fontSize: 11, letterSpacing: 0.8 }}
                    >
                      {ex.target.toUpperCase()} · REST {ex.rest.toUpperCase()} · {ex.tempo}
                    </Text>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#6b7280" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {completed.length > 0 ? (
          <View className="px-4 mb-3">
            <Text
              style={{ color: NEON, fontSize: 11, letterSpacing: 1.5 }}
              className="font-bold mb-3"
            >
              COMPLETED · {completed.length}
            </Text>
            <View className="gap-2.5">
              {completed.map((ex) => {
                const summary = ex.sets
                  .map((s, i) => `S${i + 1} ${s.weight}kg x ${s.reps}`)
                  .join(' · ');
                return (
                  <View
                    key={ex.id}
                    className="rounded-2xl bg-[#101010] p-4 flex-row items-center gap-3"
                    style={{ borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)' }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: NEON }}
                    >
                      <Ionicons name="checkmark" size={20} color="#000" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                          {ex.name}
                        </Text>
                        <Text
                          style={{ color: NEON, fontSize: 11, letterSpacing: 0.5 }}
                          className="font-bold"
                        >
                          PR
                        </Text>
                      </View>
                      <Text className="text-gray-400 mt-0.5" style={{ fontSize: 12 }}>
                        {summary}
                      </Text>
                    </View>
                    <Text style={{ color: NEON, fontSize: 20 }}>··</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10 pt-3 pb-6 px-4">
        {restRemaining !== null ? (
          <View className="flex-row items-center justify-center gap-3 mb-3">
            <Text className="text-green-400 font-bold" style={{ fontSize: 15 }}>
              Rest: {formatRest(restRemaining)}
            </Text>
            <Pressable
              onPress={() => {
                setRestRemaining(null);
                cancelNotification(restNotificationId);
                setRestNotificationId(null);
              }}
              className="px-4 py-1.5 rounded-full border border-green-400 active:opacity-70"
            >
              <Text className="text-green-400 font-bold" style={{ fontSize: 13 }}>
                Skip
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              Save & Exit
            </Text>
          </Pressable>
          <Pressable
            onPress={handleFinish}
            style={{ backgroundColor: NEON }}
            className="flex-1 rounded-2xl py-4 items-center active:opacity-90"
          >
            <Text className="text-black font-bold" style={{ fontSize: 15 }}>
              Finish Workout
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={noteEditOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteEditOpen(false)}
      >
        <Pressable
          onPress={() => setNoteEditOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#141414',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              paddingBottom: 32,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold" style={{ fontSize: 18 }}>
                {active.name} note
              </Text>
              <Pressable
                onPress={() => setNoteEditOpen(false)}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </Pressable>
            </View>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Form cues, tempo, setup…"
              placeholderTextColor="#52525B"
              multiline
              autoFocus
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
              style={{
                paddingVertical: 12,
                fontSize: 15,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
            <View className="flex-row gap-3 mt-4">
              {active.note ? (
                <Pressable
                  onPress={() => {
                    setExercises((prev) =>
                      prev.map((e, i) =>
                        i === activeIdx ? { ...e, note: undefined } : e,
                      ),
                    );
                    setNoteEditOpen(false);
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 active:opacity-80"
                >
                  <Text className="text-red-400 font-bold" style={{ fontSize: 14 }}>
                    Delete
                  </Text>
                </Pressable>
              ) : null}
              <View className="flex-1" />
              <Pressable
                onPress={() => setNoteEditOpen(false)}
                className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 active:opacity-80"
              >
                <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const trimmed = noteDraft.trim();
                  setExercises((prev) =>
                    prev.map((e, i) =>
                      i === activeIdx
                        ? { ...e, note: trimmed.length > 0 ? trimmed : undefined }
                        : e,
                    ),
                  );
                  setNoteEditOpen(false);
                }}
                style={{ backgroundColor: NEON }}
                className="px-5 py-3 rounded-2xl active:opacity-90"
              >
                <Text className="text-black font-bold" style={{ fontSize: 14 }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function formatSummaryDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

function diffLabel(compare: SummarySetCompare): {
  text: string;
  tone: 'same' | 'up' | 'down' | 'new';
} {
  const { prev, curr } = compare;
  if (!prev) return { text: '(new)', tone: 'new' };
  const dw = curr.weight - prev.weight;
  const dr = curr.reps - prev.reps;
  if (dw === 0 && dr === 0) return { text: '(=)', tone: 'same' };
  const parts: string[] = [];
  if (dw !== 0) parts.push(`${dw > 0 ? '+' : ''}${formatNum(dw)}kg`);
  if (dr !== 0) parts.push(`${dr > 0 ? '+' : ''}${dr} reps`);
  const tone: 'up' | 'down' = dw + dr >= 0 ? 'up' : 'down';
  return { text: `(${parts.join(', ')})`, tone };
}

function shareWorkoutSummary(summary: WorkoutSummary) {
  const lines: string[] = [];
  lines.push(`${summary.workoutName} — ${summary.date}`);
  lines.push(
    `${formatSummaryDuration(summary.durationSeconds)} · ${summary.exerciseCount} exercises · ${summary.setCount} sets`,
  );
  lines.push('');
  for (const row of summary.rows) {
    lines.push(row.name);
    for (const s of row.sets) {
      const curr = `${formatNum(s.curr.weight)}×${s.curr.reps}`;
      if (s.prev) {
        const prev = `${formatNum(s.prev.weight)}×${s.prev.reps}`;
        lines.push(`  ${prev} → ${curr} ${diffLabel(s).text}`);
      } else {
        lines.push(`  ${curr} (new)`);
      }
    }
    lines.push('');
  }
  shareContent({ message: lines.join('\n').trim() });
}

function WorkoutSummaryView({
  summary,
  accent,
  onDone,
  onView,
  onShare,
}: {
  summary: WorkoutSummary;
  accent: string;
  onDone: () => void;
  onView: () => void;
  onShare: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View
          className="mx-4 mt-2 rounded-3xl p-6"
          style={{ backgroundColor: accent }}
        >
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            WORKOUT COMPLETE
          </Text>
          <Text
            className="text-black font-bold mt-2"
            style={{ fontSize: 32 }}
            numberOfLines={2}
          >
            {summary.workoutName}
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            {summary.date}
          </Text>
        </View>

        <View className="mx-4 mt-4 p-4 rounded-3xl bg-[#141414] border border-[#1F1F1F]">
          <View className="flex-row gap-3">
            <SummaryStat label="Duration" value={formatSummaryDuration(summary.durationSeconds)} />
            <SummaryStat label="Exercises" value={String(summary.exerciseCount)} />
            <SummaryStat label="Sets" value={String(summary.setCount)} />
          </View>
        </View>

        {summary.newPRs.length > 0 || summary.newlyUnlocked.length > 0 ? (
          <View className="mx-4 mt-4 p-5 rounded-3xl bg-[#141414] border border-[#1F1F1F]">
            {summary.newPRs.length > 0 ? (
              <>
                <Text
                  className="font-bold"
                  style={{ color: accent, fontSize: 12, letterSpacing: 1.5 }}
                >
                  {summary.newPRs.length === 1
                    ? 'NEW PERSONAL RECORD'
                    : `${summary.newPRs.length} NEW PERSONAL RECORDS`}
                </Text>
                {summary.newPRs.map((pr) => (
                  <Text
                    key={pr.id}
                    className="text-white mt-2"
                    style={{ fontSize: 15 }}
                  >
                    🏆{' '}
                    {pr.kind === 'heaviest_weight'
                      ? `${formatNum(pr.weight)}kg heaviest`
                      : `${formatNum(pr.weight)}×${pr.reps} best set`}
                  </Text>
                ))}
              </>
            ) : null}
            {summary.newlyUnlocked.length > 0 ? (
              <>
                <Text
                  className="font-bold mt-3"
                  style={{ color: accent, fontSize: 12, letterSpacing: 1.5 }}
                >
                  ACHIEVEMENTS
                </Text>
                {summary.newlyUnlocked.map((a) => (
                  <Text
                    key={a.id}
                    className="text-white mt-2"
                    style={{ fontSize: 15 }}
                  >
                    ⭐ {a.title} — {a.description}
                  </Text>
                ))}
              </>
            ) : null}
          </View>
        ) : null}

        <View className="mx-4 mt-4 p-5 rounded-3xl bg-[#141414] border border-[#1F1F1F]">
          <Text className="text-white font-bold mb-2" style={{ fontSize: 18 }}>
            Compared to Previous Session
          </Text>
          {summary.rows.map((row, rIdx) => (
            <View key={`${row.name}-${rIdx}`} className="mt-4">
              <Text className="text-white font-bold" style={{ fontSize: 17 }}>
                {row.name}
              </Text>
              {row.sets.map((s, i) => {
                const diff = diffLabel(s);
                const diffColor =
                  diff.tone === 'up'
                    ? accent
                    : diff.tone === 'down'
                      ? '#F87171'
                      : diff.tone === 'new'
                        ? accent
                        : '#71717A';
                return (
                  <View
                    key={i}
                    className="flex-row items-center mt-2"
                    style={{ gap: 8 }}
                  >
                    {s.prev ? (
                      <>
                        <Text className="text-zinc-300" style={{ fontSize: 15 }}>
                          {formatNum(s.prev.weight)}×{s.prev.reps}
                        </Text>
                        <Text className="text-zinc-500" style={{ fontSize: 15 }}>
                          →
                        </Text>
                        <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                          {formatNum(s.curr.weight)}×{s.curr.reps}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                        {formatNum(s.curr.weight)}×{s.curr.reps}
                      </Text>
                    )}
                    <Text
                      className="font-semibold"
                      style={{ color: diffColor, fontSize: 14 }}
                    >
                      {diff.text}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Pressable
          onPress={onShare}
          className="mx-4 mt-4 bg-[#141414] border border-[#1F1F1F] rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            Share Workout
          </Text>
        </Pressable>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-white/5">
        <View className="flex-row gap-3">
          <Pressable
            onPress={onView}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              View Workout
            </Text>
          </Pressable>
          <Pressable
            onPress={onDone}
            style={{ backgroundColor: accent }}
            className="flex-1 rounded-2xl py-4 items-center active:opacity-90"
          >
            <Text className="text-black font-bold" style={{ fontSize: 15 }}>
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-[#0D0D0D] border border-[#1F1F1F] p-4">
      <Text className="text-zinc-500" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <Text className="text-white font-bold mt-1" style={{ fontSize: 22 }}>
        {value}
      </Text>
    </View>
  );
}
