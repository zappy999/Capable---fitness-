import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  type Exercise,
  type ExerciseCategory,
  type WorkoutExercise,
} from '../../src/store/types';

const LIME = '#C6F24E';

type Draft = Omit<WorkoutExercise, 'id'> & { id: string };

export default function NewWorkoutScreen() {
  const router = useRouter();
  const { exercises, addCustomExercise, saveWorkout } = useStore();

  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (category && e.category !== category) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, category]);

  const draftIds = new Set(drafts.map((d) => d.exerciseId));

  const addExercise = (ex: Exercise) => {
    if (draftIds.has(ex.id)) return;
    setDrafts((prev) => [
      ...prev,
      {
        id: `we-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseId: ex.id,
        sets: 3,
        reps: '10-12',
        restSeconds: 90,
        tempo: undefined,
        note: undefined,
      },
    ]);
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const patchDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const ex = addCustomExercise(customName, customCategory);
    addExercise(ex);
    setCustomName('');
    setCustomCategory(null);
  };

  const canSave = name.trim().length > 0 && drafts.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveWorkout({
      name: name.trim(),
      exercises: drafts,
    });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top', 'bottom']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={18} color="#ffffff" />
        </Pressable>
        <Pressable
          disabled={!canSave}
          onPress={handleSave}
          className="px-5 py-2.5 rounded-2xl"
          style={{ backgroundColor: canSave ? LIME : '#1F1F1F' }}
        >
          <Text
            className="font-bold"
            style={{
              color: canSave ? '#0A0A0A' : '#52525B',
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
            <Text
              className="font-bold text-black/70"
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              WORKOUT
            </Text>
            <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
              New Workout
            </Text>
            <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
              Search and add exercises, add custom ones, and reorder them.
            </Text>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
            <Text
              className="text-white font-bold mb-3"
              style={{ fontSize: 14, letterSpacing: 0.5 }}
            >
              Workout name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Push, Pull, Legs"
              placeholderTextColor="#52525B"
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
              style={{ paddingVertical: 14, fontSize: 15 }}
            />
          </View>

          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
            <Text className="text-white font-bold" style={{ fontSize: 20 }}>
              Add Exercise
            </Text>
            <Text
              className="text-white/80 font-bold mt-4 mb-2"
              style={{ fontSize: 14 }}
            >
              Search exercise list
            </Text>
            <View className="flex-row items-center bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 mb-3">
              <Ionicons name="search" size={16} color="#52525B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises"
                placeholderTextColor="#52525B"
                className="flex-1 text-white ml-2"
                style={{ paddingVertical: 12, fontSize: 15 }}
              />
            </View>

            <View className="flex-row flex-wrap gap-2">
              {EXERCISE_CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(active ? null : c)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? LIME : '#0D0D0D',
                      borderWidth: 1,
                      borderColor: active ? LIME : '#1F1F1F',
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: active ? '#0A0A0A' : '#ffffff' }}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-zinc-500 text-xs mt-4 mb-2">
              Type to search your exercise library. You can also add a custom exercise
              directly if it isn't in the list.
            </Text>

            <View className="gap-2 mt-2">
              {filtered.slice(0, 8).map((ex) => {
                const added = draftIds.has(ex.id);
                return (
                  <View
                    key={ex.id}
                    className="bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F] px-4 py-3 flex-row items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                        {ex.name}
                      </Text>
                      <Text className="text-zinc-500 text-xs mt-0.5">
                        {ex.category ?? 'Uncategorized'}
                        {ex.isCustom ? ' · Custom' : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => (added ? null : addExercise(ex))}
                      disabled={added}
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: added ? '#1F1F1F' : LIME,
                      }}
                    >
                      <Ionicons
                        name={added ? 'checkmark' : 'add'}
                        size={20}
                        color={added ? '#71717A' : '#0A0A0A'}
                      />
                    </Pressable>
                  </View>
                );
              })}
              {filtered.length === 0 ? (
                <Text className="text-zinc-500 text-sm italic py-2">
                  No exercises match your search.
                </Text>
              ) : null}
              {filtered.length > 8 ? (
                <Text className="text-zinc-500 text-xs mt-1">
                  Showing 8 of {filtered.length}. Refine your search to narrow down.
                </Text>
              ) : null}
            </View>

            <Text
              className="text-white/80 font-bold mt-6 mb-2"
              style={{ fontSize: 14 }}
            >
              Add custom exercise
            </Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Custom exercise name"
              placeholderTextColor="#52525B"
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white mb-3"
              style={{ paddingVertical: 14, fontSize: 15 }}
            />
            <View className="flex-row flex-wrap gap-2 mb-3">
              <Pressable
                onPress={() => setCustomCategory(null)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: customCategory === null ? LIME : '#0D0D0D',
                  borderWidth: 1,
                  borderColor: customCategory === null ? LIME : '#1F1F1F',
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: customCategory === null ? '#0A0A0A' : '#ffffff' }}
                >
                  No category
                </Text>
              </Pressable>
              {EXERCISE_CATEGORIES.map((c) => {
                const active = c === customCategory;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCustomCategory(c)}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: active ? LIME : '#0D0D0D',
                      borderWidth: 1,
                      borderColor: active ? LIME : '#1F1F1F',
                    }}
                  >
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
            <Pressable
              onPress={handleAddCustom}
              disabled={!customName.trim()}
              className="self-start px-5 py-3 rounded-2xl"
              style={{
                backgroundColor: customName.trim() ? '#ffffff' : '#1F1F1F',
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color: customName.trim() ? '#0A0A0A' : '#52525B',
                  fontSize: 14,
                }}
              >
                Add Custom Exercise
              </Text>
            </Pressable>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold" style={{ fontSize: 20 }}>
                Selected ({drafts.length})
              </Text>
            </View>
            {drafts.length === 0 ? (
              <Text className="text-zinc-500 text-sm italic">
                Add exercises from above to build your workout.
              </Text>
            ) : (
              <View className="gap-3">
                {drafts.map((d, idx) => {
                  const ex = exercises.find((e) => e.id === d.exerciseId);
                  return (
                    <View
                      key={d.id}
                      className="bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F] p-4"
                    >
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-8 h-8 rounded-lg items-center justify-center bg-[#1F1F1F]">
                          <Text
                            className="font-bold"
                            style={{ color: LIME, fontSize: 13 }}
                          >
                            {idx + 1}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-white font-bold"
                            style={{ fontSize: 15 }}
                          >
                            {ex?.name ?? 'Exercise'}
                          </Text>
                          <Text className="text-zinc-500 text-xs">
                            {ex?.category ?? 'Uncategorized'}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => removeDraft(d.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                        >
                          <Ionicons name="close" size={14} color="#F87171" />
                        </Pressable>
                      </View>

                      <View className="flex-row gap-3">
                        <NumberField
                          label="Sets"
                          value={String(d.sets)}
                          onChange={(v) =>
                            patchDraft(d.id, { sets: Math.max(1, Number(v) || 1) })
                          }
                          keyboard="number-pad"
                        />
                        <NumberField
                          label="Reps"
                          value={d.reps}
                          onChange={(v) => patchDraft(d.id, { reps: v })}
                        />
                        <NumberField
                          label="Rest (s)"
                          value={String(d.restSeconds)}
                          onChange={(v) =>
                            patchDraft(d.id, {
                              restSeconds: Math.max(0, Number(v) || 0),
                            })
                          }
                          keyboard="number-pad"
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NumberField({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'number-pad' | 'default';
}) {
  return (
    <View className="flex-1">
      <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? 'default'}
        placeholderTextColor="#52525B"
        className="bg-[#141414] border border-[#1F1F1F] rounded-xl px-3 text-white"
        style={{ paddingVertical: 10, fontSize: 14 }}
      />
    </View>
  );
}
