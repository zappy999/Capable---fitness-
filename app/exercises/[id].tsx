import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  MUSCLE_COLORS,
  type WorkoutSession,
} from '../../src/store/types';
import { LineChart, type ChartPoint } from '../../src/components/LineChart';

type ChartMode = 'Best Weight' | 'Volume' | 'Est. 1RM';
const CHART_MODES: ChartMode[] = ['Best Weight', 'Volume', 'Est. 1RM'];

function estimate1RM(weight: number, reps: number) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const LIME = useAccent();
  const {
    exercises,
    sessions,
    settings,
    updateExerciseCategory,
    mergeExercise,
    deleteExercise,
  } = useStore();

  const exercise = exercises.find((e) => e.id === id);

  const exerciseSessions = useMemo<WorkoutSession[]>(() => {
    if (!exercise) return [];
    return sessions
      .filter((s) => s.exercises.some((se) => se.exerciseId === exercise.id))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, exercise?.id]);

  const allSets = useMemo(() => {
    if (!exercise) return [] as { weight: number; reps: number; date: string }[];
    const out: { weight: number; reps: number; date: string }[] = [];
    for (const s of exerciseSessions) {
      for (const se of s.exercises) {
        if (se.exerciseId !== exercise.id) continue;
        for (const st of se.sets) out.push({ ...st, date: s.date });
      }
    }
    return out;
  }, [exerciseSessions, exercise?.id]);

  const bestSet = useMemo(() => {
    const valid = allSets.filter((s) => s.reps > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, s) => (s.weight > best.weight ? s : best));
  }, [allSets]);

  const [calcWeight, setCalcWeight] = useState<string>(
    bestSet ? String(bestSet.weight) : '',
  );
  const [calcReps, setCalcReps] = useState<string>(
    bestSet ? String(Math.max(1, bestSet.reps)) : '',
  );
  const [chartMode, setChartMode] = useState<ChartMode>('Best Weight');
  const [mergePickerOpen, setMergePickerOpen] = useState(false);

  const estimated = useMemo(() => {
    const w = Number(calcWeight) || 0;
    const r = Number(calcReps) || 0;
    return estimate1RM(w, r);
  }, [calcWeight, calcReps]);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!exercise) return [];
    return exerciseSessions.map((s) => {
      const setsForEx = s.exercises
        .filter((se) => se.exerciseId === exercise.id)
        .flatMap((se) => se.sets)
        .filter((x) => x.reps > 0);
      let value = 0;
      if (chartMode === 'Best Weight') {
        value = Math.max(0, ...setsForEx.map((x) => x.weight));
      } else if (chartMode === 'Volume') {
        value = setsForEx.reduce((a, x) => a + x.weight * x.reps, 0);
      } else {
        value = Math.max(0, ...setsForEx.map((x) => estimate1RM(x.weight, x.reps)));
      }
      return { label: s.date.slice(5), value: Math.round(value * 10) / 10 };
    });
  }, [exerciseSessions, chartMode, exercise?.id]);

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0D0D] items-center justify-center">
        <Text className="text-zinc-500">Exercise not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10"
        >
          <Text className="text-white font-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalSets = allSets.length;
  const sessionsCount = exerciseSessions.length;

  const percentages = [60, 70, 75, 80, 85, 90, 95];

  const mergeCandidates = exercises.filter((e) => e.id !== exercise.id);

  const handleDelete = () => {
    deleteExercise(exercise.id);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top', 'bottom']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </Pressable>
        {exercise.isCustom ? (
          <Pressable
            onPress={handleDelete}
            className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
          >
            <Ionicons name="trash-outline" size={16} color="#F87171" />
          </Pressable>
        ) : (
          <View className="w-10 h-10" />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mx-5 mt-2 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
          <Text
            className="text-zinc-500 font-bold"
            style={{ fontSize: 11, letterSpacing: 1.5 }}
          >
            EXERCISE DETAIL
          </Text>
          <Text className="text-white font-bold mt-2" style={{ fontSize: 30 }}>
            {exercise.name}
          </Text>
          <Text className="text-zinc-500 text-sm mt-1">
            All logged sessions for this exercise.
          </Text>
        </View>

        <View className="mx-5 mt-4 flex-row gap-3">
          <StatBox label="Sessions" value={String(sessionsCount)} />
          <StatBox label="Total Sets" value={String(totalSets)} />
          <StatBox
            label="Best Set"
            value={bestSet ? `${bestSet.weight}×${bestSet.reps}` : '—'}
          />
        </View>

        <View className="mx-5 mt-4 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold" style={{ fontSize: 18 }}>
              1RM Calculator
            </Text>
            <Text
              className="text-zinc-500 font-bold"
              style={{ fontSize: 11, letterSpacing: 1 }}
            >
              EPLEY
            </Text>
          </View>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text
                className="text-zinc-500 font-bold mb-1.5"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                WEIGHT (KG)
              </Text>
              <TextInput
                value={calcWeight}
                onChangeText={setCalcWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
                style={{ paddingVertical: 14, fontSize: 18, fontWeight: '700' }}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-zinc-500 font-bold mb-1.5"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                REPS
              </Text>
              <TextInput
                value={calcReps}
                onChangeText={setCalcReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
                style={{ paddingVertical: 14, fontSize: 18, fontWeight: '700' }}
              />
            </View>
          </View>

          <View className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-4 flex-row items-center justify-between">
            <View>
              <Text
                className="text-zinc-500 font-bold"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                ESTIMATED 1RM
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">From your best set</Text>
            </View>
            <Text style={{ color: LIME, fontSize: 34, fontWeight: '800' }}>
              {estimated > 0 ? `${Math.round(estimated * 10) / 10}kg` : '—'}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-3">
            {percentages.map((p) => (
              <View
                key={p}
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 py-2"
                style={{ minWidth: 74 }}
              >
                <Text
                  className="text-zinc-500 font-bold"
                  style={{ fontSize: 11 }}
                >
                  {p}%
                </Text>
                <Text
                  className="text-white font-bold"
                  style={{ fontSize: 16 }}
                >
                  {estimated > 0
                    ? roundWeight((estimated * p) / 100, settings.weightIncrementKg)
                    : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-5 mt-4 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
          <Text className="text-white font-bold" style={{ fontSize: 18 }}>
            Manage
          </Text>

          <Text
            className="text-zinc-500 font-bold mt-4 mb-2"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            MUSCLE GROUP
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => updateExerciseCategory(exercise.id, null)}
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: exercise.category === null ? LIME : '#0D0D0D',
                borderWidth: 1,
                borderColor: exercise.category === null ? LIME : '#1F1F1F',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: exercise.category === null ? '#0A0A0A' : '#ffffff',
                }}
              >
                None
              </Text>
            </Pressable>
            {EXERCISE_CATEGORIES.map((c) => {
              const active = c === exercise.category;
              const color = MUSCLE_COLORS[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => updateExerciseCategory(exercise.id, c)}
                  className="px-3 py-1.5 rounded-full flex-row items-center"
                  style={{
                    backgroundColor: active ? LIME : '#0D0D0D',
                    borderWidth: 1,
                    borderColor: active ? LIME : '#1F1F1F',
                  }}
                >
                  <View
                    style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginRight: 6 }}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? '#0A0A0A' : '#ffffff' }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            className="text-zinc-500 font-bold mt-5 mb-2"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            MERGE WITH ANOTHER EXERCISE
          </Text>
          <Text className="text-zinc-500 text-sm mb-3">
            Same exercise under a different name? Move all logged sets from another
            exercise into this one.
          </Text>
          <Pressable
            onPress={() => setMergePickerOpen(true)}
            className="self-start bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 py-3 active:opacity-70"
          >
            <Text className="text-white font-bold" style={{ fontSize: 13 }}>
              Pick exercise to merge in…
            </Text>
          </Pressable>
        </View>

        <View className="mx-5 mt-4 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CHART_MODES.map((m) => {
              const active = m === chartMode;
              return (
                <Pressable
                  key={m}
                  onPress={() => setChartMode(m)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: active ? 'transparent' : '#0D0D0D',
                    borderWidth: 1,
                    borderColor: active ? LIME : '#1F1F1F',
                  }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: active ? LIME : '#A1A1AA' }}
                  >
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <LineChart
            data={chartData}
            color={LIME}
            yLabel={
              chartMode === 'Volume'
                ? 'Volume (kg)'
                : chartMode === 'Est. 1RM'
                  ? 'Estimated 1RM (kg)'
                  : 'Best Weight (kg)'
            }
          />
        </View>

        <View className="mx-5 mt-4 gap-3">
          {[...exerciseSessions].reverse().map((s) => {
            const setsForEx = s.exercises
              .filter((se) => se.exerciseId === exercise.id)
              .flatMap((se) => se.sets);
            return (
              <View
                key={s.id}
                className="bg-[#141414] border border-[#1F1F1F] rounded-3xl p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-bold" style={{ fontSize: 18 }}>
                      {s.date}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-1">
                      {s.workoutName}
                      {s.durationSeconds > 0
                        ? ` · ${formatDuration(s.durationSeconds)}`
                        : ''}
                    </Text>
                  </View>
                  <Text className="text-zinc-500 text-xs">
                    {setsForEx.length} set{setsForEx.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {setsForEx.map((st, i) => (
                    <View
                      key={i}
                      className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 py-1.5"
                    >
                      <Text className="text-white text-sm font-semibold">
                        {st.weight} × {st.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
          {exerciseSessions.length === 0 ? (
            <View className="bg-[#141414] border border-[#1F1F1F] rounded-3xl py-8 px-6 items-center">
              <Ionicons name="time-outline" size={22} color="#71717A" />
              <Text className="text-white font-bold mt-3" style={{ fontSize: 16 }}>
                No history yet
              </Text>
              <Text className="text-zinc-500 text-sm text-center mt-1">
                Log a session containing this exercise to see it here.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={mergePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMergePickerOpen(false)}
      >
        <Pressable
          onPress={() => setMergePickerOpen(false)}
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
              maxHeight: '80%',
            }}
          >
            <View className="p-5 flex-row items-center justify-between border-b border-[#1F1F1F]">
              <Text className="text-white font-bold" style={{ fontSize: 18 }}>
                Merge into {exercise.name}
              </Text>
              <Pressable
                onPress={() => setMergePickerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              {mergeCandidates.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    mergeExercise(e.id, exercise.id);
                    setMergePickerOpen(false);
                  }}
                  className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 py-3 flex-row items-center active:opacity-70"
                >
                  <View className="flex-1">
                    <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                      {e.name}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      {e.category ?? 'Uncategorized'}
                      {e.isCustom ? ' · Custom' : ''}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#71717A" />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function roundWeight(v: number, increment: number) {
  if (!Number.isFinite(increment) || increment <= 0) return String(Math.round(v));
  const rounded = Math.round(v / increment) * increment;
  return String(Math.round(rounded * 100) / 100).replace(/\.0+$/, '');
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
      <Text className="text-zinc-500 text-xs">{label}</Text>
      <Text className="text-white font-bold mt-1" style={{ fontSize: 20 }}>
        {value}
      </Text>
    </View>
  );
}
