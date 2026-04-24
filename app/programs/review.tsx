import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  type Exercise,
} from '../../src/store/types';
import {
  clearStagedImport,
  matchExercise,
  takeStagedImport,
  type ImportedExercise,
} from '../../src/lib/programImport';

type ReviewExercise = {
  draftId: string;
  name: string;
  matchedId: string | null;
  sourceName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  note?: string;
};

type ReviewWorkout = {
  draftId: string;
  name: string;
  exercises: ReviewExercise[];
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildExercise(
  ie: ImportedExercise,
  library: Exercise[],
): ReviewExercise {
  const m = matchExercise(ie.name, library);
  return {
    draftId: makeId('rx'),
    sourceName: ie.name,
    name: m.matched?.name ?? ie.name,
    matchedId: m.matched?.id ?? null,
    sets: ie.sets,
    reps: ie.reps,
    restSeconds: ie.restSeconds,
    tempo: ie.tempo,
    note: ie.note,
  };
}

export default function ReviewImportScreen() {
  const router = useRouter();
  const LIME = useAccent();
  const { exercises, addCustomExercise, saveWorkout, saveProgram } = useStore();
  const staged = useMemo(() => takeStagedImport(), []);

  const [name, setName] = useState(staged?.name ?? 'Imported program');
  const [phase, setPhase] = useState(staged?.phase ?? '');
  const [durationWeeks, setDurationWeeks] = useState(
    staged?.durationWeeks ? String(staged.durationWeeks) : '',
  );
  const [workoutsDraft, setWorkoutsDraft] = useState<ReviewWorkout[]>(() => {
    if (!staged) return [];
    return staged.workouts.map((w) => ({
      draftId: makeId('rw'),
      name: w.name,
      exercises: w.exercises.map((e) => buildExercise(e, exercises)),
    }));
  });

  const [swapTarget, setSwapTarget] = useState<{
    workoutId: string;
    exerciseDraftId: string;
  } | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  useEffect(() => {
    if (!staged) {
      Alert.alert(
        'Nothing to review',
        'Paste a program JSON on the previous screen first.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }, [staged, router]);

  const totals = useMemo(() => {
    const workouts = workoutsDraft.length;
    const exs = workoutsDraft.reduce((a, w) => a + w.exercises.length, 0);
    const unmatched = workoutsDraft.reduce(
      (a, w) => a + w.exercises.filter((e) => !e.matchedId).length,
      0,
    );
    return { workouts, exs, unmatched };
  }, [workoutsDraft]);

  const patchWorkout = (id: string, patch: Partial<ReviewWorkout>) => {
    setWorkoutsDraft((prev) =>
      prev.map((w) => (w.draftId === id ? { ...w, ...patch } : w)),
    );
  };

  const patchExercise = (
    workoutId: string,
    exId: string,
    patch: Partial<ReviewExercise>,
  ) => {
    setWorkoutsDraft((prev) =>
      prev.map((w) =>
        w.draftId !== workoutId
          ? w
          : {
              ...w,
              exercises: w.exercises.map((e) =>
                e.draftId === exId ? { ...e, ...patch } : e,
              ),
            },
      ),
    );
  };

  const removeExercise = (workoutId: string, exId: string) => {
    setWorkoutsDraft((prev) =>
      prev.map((w) =>
        w.draftId !== workoutId
          ? w
          : { ...w, exercises: w.exercises.filter((e) => e.draftId !== exId) },
      ),
    );
  };

  const moveExercise = (
    workoutId: string,
    exId: string,
    direction: -1 | 1,
  ) => {
    setWorkoutsDraft((prev) =>
      prev.map((w) => {
        if (w.draftId !== workoutId) return w;
        const idx = w.exercises.findIndex((e) => e.draftId === exId);
        if (idx < 0) return w;
        const target = idx + direction;
        if (target < 0 || target >= w.exercises.length) return w;
        const next = [...w.exercises];
        [next[idx], next[target]] = [next[target], next[idx]];
        return { ...w, exercises: next };
      }),
    );
  };

  const openSwap = (workoutId: string, exerciseDraftId: string) => {
    setSwapTarget({ workoutId, exerciseDraftId });
    setPickerQuery('');
  };

  const pickLibraryExercise = (ex: Exercise) => {
    if (!swapTarget) return;
    patchExercise(swapTarget.workoutId, swapTarget.exerciseDraftId, {
      name: ex.name,
      matchedId: ex.id,
    });
    setSwapTarget(null);
  };

  const handleCancel = () => {
    clearStagedImport();
    router.back();
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give the program a name.');
      return;
    }
    const nonEmpty = workoutsDraft.filter((w) => w.exercises.length > 0);
    if (nonEmpty.length === 0) {
      Alert.alert(
        'No workouts to save',
        'Every workout is empty. Add at least one exercise or cancel.',
      );
      return;
    }

    const workoutIds: string[] = [];
    for (const w of nonEmpty) {
      const wExercises = w.exercises.map((re) => {
        let exerciseId = re.matchedId;
        if (!exerciseId) {
          const existing = exercises.find(
            (e) => e.name.toLowerCase() === re.name.trim().toLowerCase(),
          );
          exerciseId = existing
            ? existing.id
            : addCustomExercise(re.name.trim(), null).id;
        }
        return {
          id: makeId('we'),
          exerciseId,
          sets: re.sets,
          reps: re.reps,
          restSeconds: re.restSeconds,
          tempo: re.tempo,
          note: re.note,
        };
      });
      const saved = saveWorkout({
        name: w.name.trim() || 'Workout',
        exercises: wExercises,
      });
      workoutIds.push(saved.id);
    }

    const weeks = Number(durationWeeks);
    saveProgram({
      name: trimmedName,
      workoutIds,
      phase: phase.trim() || undefined,
      durationWeeks: Number.isFinite(weeks) && weeks > 0 ? weeks : undefined,
    });
    clearStagedImport();
    router.dismissTo('/program');
  };

  if (!staged) {
    return <SafeAreaView className="flex-1 bg-[#0D0D0D]" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={handleCancel}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={18} color="#ffffff" />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View
          className="mx-5 mt-2 rounded-3xl p-6"
          style={{ backgroundColor: LIME }}
        >
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            REVIEW IMPORT
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 30 }}>
            {name || 'Imported program'}
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            {totals.workouts} workout{totals.workouts === 1 ? '' : 's'} ·{' '}
            {totals.exs} exercise{totals.exs === 1 ? '' : 's'}
            {totals.unmatched > 0
              ? ` · ${totals.unmatched} new`
              : ' · all matched'}
          </Text>
        </View>

        <Section title="Program">
          <FieldLabel>Name</FieldLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Program name"
            placeholderTextColor="#52525B"
            className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
            style={{ paddingVertical: 12, fontSize: 15 }}
          />
          <View className="flex-row gap-3 mt-3">
            <View className="flex-1">
              <FieldLabel>Phase</FieldLabel>
              <TextInput
                value={phase}
                onChangeText={setPhase}
                placeholder="e.g. Hypertrophy"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
                style={{ paddingVertical: 12, fontSize: 15 }}
              />
            </View>
            <View className="w-28">
              <FieldLabel>Weeks</FieldLabel>
              <TextInput
                value={durationWeeks}
                onChangeText={setDurationWeeks}
                placeholder="—"
                keyboardType="number-pad"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white text-center"
                style={{ paddingVertical: 12, fontSize: 15 }}
              />
            </View>
          </View>
        </Section>

        {workoutsDraft.map((w, wIdx) => (
          <WorkoutBlock
            key={w.draftId}
            index={wIdx}
            workout={w}
            onRename={(v) => patchWorkout(w.draftId, { name: v })}
            onPatchExercise={(exId, patch) =>
              patchExercise(w.draftId, exId, patch)
            }
            onRemoveExercise={(exId) => removeExercise(w.draftId, exId)}
            onMove={(exId, dir) => moveExercise(w.draftId, exId, dir)}
            onSwap={(exId) => openSwap(w.draftId, exId)}
          />
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-white/5">
        <View className="flex-row gap-3">
          <Pressable
            onPress={handleCancel}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={{ backgroundColor: LIME }}
            className="flex-1 rounded-2xl py-4 items-center active:opacity-90"
          >
            <Text className="text-black font-bold" style={{ fontSize: 15 }}>
              Create program
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={swapTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSwapTarget(null)}
      >
        <Pressable
          onPress={() => setSwapTarget(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 16,
              paddingBottom: 24,
              maxHeight: '80%',
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold" style={{ fontSize: 18 }}>
                Swap exercise
              </Text>
              <Pressable
                onPress={() => setSwapTarget(null)}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </Pressable>
            </View>
            <View className="flex-row items-center bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 mb-3">
              <Ionicons name="search" size={16} color="#52525B" />
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder="Search exercises"
                placeholderTextColor="#52525B"
                className="flex-1 text-white ml-2"
                style={{ paddingVertical: 12, fontSize: 15 }}
              />
            </View>
            <LibraryPicker
              query={pickerQuery}
              exercises={exercises}
              onPick={pickLibraryExercise}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] p-5">
      <Text className="text-white font-bold mb-3" style={{ fontSize: 18 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="text-zinc-500 font-bold mb-1.5"
      style={{ fontSize: 11, letterSpacing: 0.5 }}
    >
      {String(children).toUpperCase()}
    </Text>
  );
}

function WorkoutBlock({
  index,
  workout,
  onRename,
  onPatchExercise,
  onRemoveExercise,
  onMove,
  onSwap,
}: {
  index: number;
  workout: ReviewWorkout;
  onRename: (v: string) => void;
  onPatchExercise: (exId: string, patch: Partial<ReviewExercise>) => void;
  onRemoveExercise: (exId: string) => void;
  onMove: (exId: string, direction: -1 | 1) => void;
  onSwap: (exId: string) => void;
}) {
  return (
    <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] p-5">
      <View className="flex-row items-center gap-3 mb-3">
        <Text
          className="text-zinc-500 font-bold"
          style={{ fontSize: 12, width: 24 }}
        >
          {String(index + 1).padStart(2, '0')}
        </Text>
        <TextInput
          value={workout.name}
          onChangeText={onRename}
          placeholder="Workout name"
          placeholderTextColor="#52525B"
          className="flex-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white font-bold"
          style={{ paddingVertical: 10, fontSize: 16 }}
        />
      </View>

      {workout.exercises.length === 0 ? (
        <View className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-5 items-center">
          <Text className="text-zinc-500 text-sm">No exercises in this workout.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {workout.exercises.map((item, i) => {
            const isMatched = Boolean(item.matchedId);
            const isFirst = i === 0;
            const isLast = i === workout.exercises.length - 1;
            return (
              <View
                key={item.draftId}
                className="rounded-2xl border"
                style={{
                  backgroundColor: '#0D0D0D',
                  borderColor: '#1F1F1F',
                }}
              >
                <View className="p-4 flex-row items-start gap-3">
                  <View className="gap-1">
                    <Pressable
                      onPress={() => onMove(item.draftId, -1)}
                      disabled={isFirst}
                      className="w-8 h-7 rounded-lg bg-white/5 border border-white/10 items-center justify-center"
                      style={{ opacity: isFirst ? 0.3 : 1 }}
                    >
                      <Ionicons name="chevron-up" size={14} color="#ffffff" />
                    </Pressable>
                    <Pressable
                      onPress={() => onMove(item.draftId, 1)}
                      disabled={isLast}
                      className="w-8 h-7 rounded-lg bg-white/5 border border-white/10 items-center justify-center"
                      style={{ opacity: isLast ? 0.3 : 1 }}
                    >
                      <Ionicons name="chevron-down" size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-2">
                      <Text
                        className="text-white font-bold"
                        style={{ fontSize: 15, flexShrink: 1 }}
                        numberOfLines={2}
                      >
                        {String(i + 1).padStart(2, '0')}. {item.name}
                      </Text>
                      {!isMatched ? <Badge text="NEW" color="#EAB308" /> : null}
                    </View>
                    <Text className="text-zinc-500 mt-1.5" style={{ fontSize: 12 }}>
                      {item.sets}×{item.reps} · {item.restSeconds}s rest
                    </Text>
                    {item.sourceName.toLowerCase().trim() !==
                    item.name.toLowerCase().trim() ? (
                      <Text
                        className="text-zinc-600 mt-1"
                        style={{ fontSize: 11 }}
                        numberOfLines={1}
                      >
                        from “{item.sourceName}”
                      </Text>
                    ) : null}
                    {!isMatched ? (
                      <Text
                        className="mt-1"
                        style={{ color: '#EAB308', fontSize: 11 }}
                      >
                        Not in your library — will be added as custom. Tap{' '}
                        <Text style={{ fontWeight: '700' }}>swap</Text> if it
                        already exists under another name.
                      </Text>
                    ) : null}
                  </View>
                  <View className="gap-1">
                    <Pressable
                      onPress={() => onSwap(item.draftId)}
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#ffffff" />
                    </Pressable>
                    <Pressable
                      onPress={() => onRemoveExercise(item.draftId)}
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                    >
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                    </Pressable>
                  </View>
                </View>
                <View className="px-4 pb-4 flex-row gap-2">
                  <TinyField
                    label="Sets"
                    value={String(item.sets)}
                    onChange={(v) => {
                      const n = Math.max(1, Math.round(Number(v) || 0));
                      onPatchExercise(item.draftId, { sets: n });
                    }}
                    numeric
                  />
                  <TinyField
                    label="Reps"
                    value={item.reps}
                    onChange={(v) => onPatchExercise(item.draftId, { reps: v })}
                  />
                  <TinyField
                    label="Rest (s)"
                    value={String(item.restSeconds)}
                    onChange={(v) => {
                      const n = Math.max(0, Math.round(Number(v) || 0));
                      onPatchExercise(item.draftId, { restSeconds: n });
                    }}
                    numeric
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function TinyField({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View className="flex-1">
      <Text
        className="text-zinc-500 font-bold mb-1"
        style={{ fontSize: 10, letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'number-pad' : 'default'}
        className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl px-3 text-white text-center"
        style={{ paddingVertical: 8, fontSize: 13 }}
      />
    </View>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}55`,
      }}
    >
      <Text className="font-bold" style={{ color, fontSize: 9, letterSpacing: 0.8 }}>
        {text}
      </Text>
    </View>
  );
}

function LibraryPicker({
  query,
  exercises,
  onPick,
}: {
  query: string;
  exercises: Exercise[];
  onPick: (ex: Exercise) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, exercises]);

  const grouped = useMemo(() => {
    const g = new Map<string, Exercise[]>();
    for (const e of filtered) {
      const key = e.category ?? 'Uncategorized';
      const arr = g.get(key) ?? [];
      arr.push(e);
      g.set(key, arr);
    }
    const order = [...EXERCISE_CATEGORIES, 'Uncategorized'];
    return order
      .map((cat) => ({ cat, items: g.get(cat) ?? [] }))
      .filter((x) => x.items.length > 0);
  }, [filtered]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {grouped.map((g) => (
        <View key={g.cat} className="mb-3">
          <Text
            className="text-zinc-500 font-bold mb-2"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            {g.cat.toUpperCase()}
          </Text>
          {g.items.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => onPick(e)}
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-4 mb-1.5 flex-row items-center justify-between active:opacity-80"
              style={{ paddingVertical: 12 }}
            >
              <Text className="text-white" style={{ fontSize: 14 }}>
                {e.name}
              </Text>
              {e.isCustom ? (
                <Text className="text-zinc-600" style={{ fontSize: 11 }}>
                  custom
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
