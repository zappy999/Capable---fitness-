import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../src/store/WorkoutStore';
import { WORKOUTS as DEMO_WORKOUTS } from '../src/data/workouts';
import {
  cancelNotification,
  haptic,
  scheduleRestNotification,
} from '../src/lib/platform';

function parseRestSeconds(rest: string): number {
  const s = rest.match(/(\d+)\s*s/i);
  if (s) return Number(s[1]);
  const m = rest.match(/(\d+)\s*min/i);
  if (m) return Number(m[1]) * 60;
  const n = Number(rest);
  return Number.isFinite(n) && n > 0 ? n : 90;
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

const NEON = '#22C55E';
const SWIPE_THRESHOLD = 110;

type SetLog = {
  weight: number;
  reps: number;
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
  onComplete,
}: SwipeableSetCardProps) {
  const translateX = useSharedValue(0);

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
      ? 'rgba(198,242,78,0.3)'
      : 'rgba(255,255,255,0.08)';
  const cardBg = isDone ? 'rgba(198,242,78,0.05)' : '#101010';

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
                style={{ backgroundColor: 'rgba(198,242,78,0.2)' }}
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
                <View className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                  <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                    {set.weight > 0 ? `${set.weight}kg` : 'kg'}
                  </Text>
                </View>
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
                <View className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                  <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                    {set.reps > 0 ? `${set.reps}` : 'reps'}
                  </Text>
                </View>
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
  userWorkouts: { id: string; name: string; exercises: { id: string; exerciseId: string; sets: number; reps: string; restSeconds: number; tempo?: string; note?: string }[] }[],
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
  const { workouts, exercises: libraryExercises, addCustomExercise, logSession } =
    useStore();

  const routeId = typeof params.id === 'string' ? params.id : undefined;

  const source = useMemo(
    () => resolveSource(routeId, workouts, libraryExercises),
    [routeId, workouts, libraryExercises],
  );

  const [elapsed, setElapsed] = useState(3);
  const [exercises, setExercises] = useState<ExerciseLog[]>(source.exercises);
  const [loadedFor, setLoadedFor] = useState<string>(
    `${source.kind}:${source.workoutId ?? 'fallback'}`,
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restNotificationId, setRestNotificationId] = useState<string | null>(null);

  useEffect(() => {
    const key = `${source.kind}:${source.workoutId ?? 'fallback'}`;
    if (key === loadedFor) return;
    setExercises(source.exercises);
    setActiveIdx(0);
    setLoadedFor(key);
  }, [source, loadedFor]);

  const handleFinish = () => {
    const loggedExercises = exercises
      .map((ex) => {
        const completedSets = ex.sets
          .filter((s) => s.completed)
          .map((s) => ({ weight: s.weight, reps: s.reps }));
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
          sets: completedSets,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    if (loggedExercises.length > 0) {
      logSession({
        workoutName: source.name,
        workoutId: source.workoutId,
        durationSeconds: elapsed,
        exercises: loggedExercises,
      });
    }
    cancelNotification(restNotificationId);
    haptic('success');
    router.back();
  };

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

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
    updateSet(exIdx, setIdx, { completed: true });
    haptic('light');
    const restSeconds = parseRestSeconds(exercises[exIdx]?.rest ?? '90s');
    setRestRemaining(restSeconds);
    cancelNotification(restNotificationId);
    setRestNotificationId(null);
    scheduleRestNotification(restSeconds, 'Ready for your next set').then((id) => {
      if (id) setRestNotificationId(id);
    });
    // advance to next exercise if all sets complete
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

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        {/* Top Status Card */}
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

          {/* Stats row */}
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
              style={{ backgroundColor: 'rgba(198,242,78,0.12)' }}
            >
              <Text style={{ color: NEON, fontSize: 14 }} className="font-bold">
                {stats.pct}%
              </Text>
            </View>
          </View>

          {/* Progress segments */}
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

        {/* Active Exercise */}
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
              {active.note ? (
                <Text className="text-gray-400 italic mt-2" style={{ fontSize: 13 }}>
                  {active.note}
                </Text>
              ) : null}
            </View>
            <Pressable className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 active:opacity-70">
              <Text className="text-white font-bold" style={{ fontSize: 13 }}>
                Note
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

          {/* Set cards */}
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

        {/* Up Next */}
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

        {/* Completed */}
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
                    style={{ borderWidth: 1, borderColor: 'rgba(198,242,78,0.35)' }}
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

      {/* Bottom Action Bar */}
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
    </SafeAreaView>
  );
}
