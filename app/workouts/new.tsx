import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  GROUP_TYPES,
  type Exercise,
  type ExerciseCategory,
  type GroupType,
  type WorkoutExercise,
} from '../../src/store/types';
import { isSafeHttpUrl } from '../../src/lib/platform';
import { COLORS } from '../../src/design/tokens';
import { ModernHeader, NavTop } from '../../src/design/components';

type Draft = WorkoutExercise;

function makeDraftId() {
  return `we-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function NewWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const { exercises, workouts, addCustomExercise, saveWorkout } = useStore();
  const LIME = useAccent();

  const editing = editId ? workouts.find((w) => w.id === editId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(editing?.exercises ?? []);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDrafts(editing.exercises);
    }
  }, [editing?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (category && e.category !== category) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, category]);

  const draftIds = useMemo(() => new Set(drafts.map((d) => d.exerciseId)), [drafts]);

  const addExercise = (ex: Exercise) => {
    if (draftIds.has(ex.id)) return;
    setDrafts((prev) => [
      ...prev,
      {
        id: makeDraftId(),
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
      id: editing?.id,
      name: name.trim(),
      exercises: drafts,
    });
    router.back();
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Draft>) => {
    const idx = (getIndex() ?? 0) + 1;
    const ex = exercises.find((e) => e.id === item.exerciseId);
    return (
      <ScaleDecorator>
        <View className="px-5 mb-3">
          <View
            className="bg-[#0D0D0D] rounded-2xl border p-4"
            style={{
              borderColor: isActive ? LIME : '#1F1F1F',
              opacity: isActive ? 0.95 : 1,
            }}
          >
            <View className="flex-row items-center gap-3 mb-3">
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                disabled={isActive}
                className="w-8 h-8 rounded-lg items-center justify-center active:opacity-60"
                style={{ backgroundColor: '#1F1F1F' }}
              >
                <Ionicons name="reorder-three" size={18} color="#A1A1AA" />
              </TouchableOpacity>
              <View className="w-8 h-8 rounded-lg items-center justify-center bg-[#1F1F1F]">
                <Text className="font-bold" style={{ color: LIME, fontSize: 13 }}>
                  {idx}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                  {ex?.name ?? 'Exercise'}
                </Text>
                <Text className="text-zinc-500 text-xs">
                  {ex?.category ?? 'Uncategorized'}
                </Text>
              </View>
              <Pressable
                onPress={() => removeDraft(item.id)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
              >
                <Ionicons name="close" size={14} color="#F87171" />
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              <NumberField
                label="Sets"
                value={String(item.sets)}
                onChange={(v) =>
                  patchDraft(item.id, { sets: Math.max(1, Number(v) || 1) })
                }
                keyboard="number-pad"
              />
              <NumberField
                label="Reps"
                value={item.reps}
                onChange={(v) => patchDraft(item.id, { reps: v })}
              />
              <NumberField
                label="Rest (s)"
                value={String(item.restSeconds)}
                onChange={(v) =>
                  patchDraft(item.id, {
                    restSeconds: Math.max(0, Number(v) || 0),
                  })
                }
                keyboard="number-pad"
              />
            </View>

            <AdvancedSection
              item={item}
              open={expanded.has(item.id)}
              onToggle={() =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })
              }
              patch={(patch) => patchDraft(item.id, patch)}
            />
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  const header = (
    <>
      <ModernHeader
        eyebrow="Workout"
        title={editing ? 'Edit workout' : 'New workout'}
        sub="Search and add exercises, add custom ones, and reorder them."
        accent={LIME}
        back
        action={false}
        dropMark
      />

      <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] p-5">
        <Text className="text-white font-bold mb-3" style={{ fontSize: 14 }}>
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

      <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] p-5">
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
                  style={{ backgroundColor: added ? '#1F1F1F' : LIME }}
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

        <Text className="text-white/80 font-bold mt-6 mb-2" style={{ fontSize: 14 }}>
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

      <View className="px-5 mt-5 mb-3 flex-row items-center justify-between">
        <Text className="text-white font-bold" style={{ fontSize: 20 }}>
          Selected ({drafts.length})
        </Text>
        {drafts.length > 1 ? (
          <Text className="text-zinc-500 text-xs italic">
            Long-press handle to reorder
          </Text>
        ) : null}
      </View>

      {drafts.length === 0 ? (
        <View className="mx-5 bg-[#1A1A1A] rounded-2xl border border-[#1F1F1F] py-6 px-5 mb-3">
          <Text className="text-zinc-500 text-sm italic text-center">
            Add exercises from above to build your workout.
          </Text>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
      <NavTop
        onBack={() => router.back()}
        right={
          <Pressable
            disabled={!canSave}
            onPress={handleSave}
            style={{
              paddingHorizontal: 18,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSave ? COLORS.text : '#1F1F1F',
            }}
          >
            <Text
              style={{
                color: canSave ? COLORS.onAccent : '#52525B',
                fontWeight: '800',
                fontSize: 13,
                letterSpacing: -0.1,
              }}
            >
              {editing ? 'Save changes' : 'Save'}
            </Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <DraggableFlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => setDrafts(data)}
          renderItem={renderItem}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
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
        className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl px-3 text-white"
        style={{ paddingVertical: 10, fontSize: 14 }}
      />
    </View>
  );
}

function AdvancedSection({
  item,
  open,
  onToggle,
  patch,
}: {
  item: WorkoutExercise;
  open: boolean;
  onToggle: () => void;
  patch: (p: Partial<WorkoutExercise>) => void;
}) {
  const demoUrlInvalid = Boolean(item.demoUrl) && !isSafeHttpUrl(item.demoUrl);
  const LIME = useAccent();

  return (
    <View className="mt-3">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between px-1 py-2 active:opacity-70"
      >
        <Text className="text-zinc-400 text-xs font-semibold">
          {open ? 'Hide advanced' : 'Advanced'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#71717A"
        />
      </Pressable>
      {open ? (
        <View className="gap-3 mt-1">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text
                className="text-zinc-500 font-bold mb-1.5"
                style={{ fontSize: 11 }}
              >
                TEMPO
              </Text>
              <TextInput
                value={item.tempo ?? ''}
                onChangeText={(v) => patch({ tempo: v || undefined })}
                placeholder="e.g. 3011"
                placeholderTextColor="#52525B"
                className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl px-3 text-white"
                style={{ paddingVertical: 10, fontSize: 14 }}
              />
            </View>
            <Pressable
              onPress={() => patch({ isDropSet: !item.isDropSet })}
              className="flex-1 flex-row items-center px-3 rounded-xl"
              style={{
                paddingVertical: 10,
                backgroundColor: item.isDropSet ? 'rgba(34,197,94,0.15)' : '#1A1A1A',
                borderWidth: 1,
                borderColor: item.isDropSet ? LIME : '#1F1F1F',
              }}
            >
              <Ionicons
                name={item.isDropSet ? 'checkbox' : 'square-outline'}
                size={16}
                color={item.isDropSet ? LIME : '#71717A'}
              />
              <Text
                className="font-bold ml-2"
                style={{
                  color: item.isDropSet ? LIME : '#ffffff',
                  fontSize: 13,
                }}
              >
                Drop set
              </Text>
            </Pressable>
          </View>

          <View>
            <Text
              className="text-zinc-500 font-bold mb-1.5"
              style={{ fontSize: 11 }}
            >
              GROUP
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <Pressable
                onPress={() =>
                  patch({
                    groupType: undefined,
                    supersetGroup: undefined,
                    emomSeconds: undefined,
                  })
                }
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: !item.groupType ? LIME : '#1A1A1A',
                  borderWidth: 1,
                  borderColor: !item.groupType ? LIME : '#1F1F1F',
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: !item.groupType ? '#0A0A0A' : '#ffffff' }}
                >
                  None
                </Text>
              </Pressable>
              {GROUP_TYPES.map((g: GroupType) => {
                const active = item.groupType === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() =>
                      patch({
                        groupType: g,
                        supersetGroup: item.supersetGroup ?? 'A',
                      })
                    }
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: active ? LIME : '#1A1A1A',
                      borderWidth: 1,
                      borderColor: active ? LIME : '#1F1F1F',
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: active ? '#0A0A0A' : '#ffffff' }}
                    >
                      {g === 'emom' ? 'EMOM' : g[0].toUpperCase() + g.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {item.groupType ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text
                  className="text-zinc-500 font-bold mb-1.5"
                  style={{ fontSize: 11 }}
                >
                  GROUP LABEL
                </Text>
                <TextInput
                  value={item.supersetGroup ?? ''}
                  onChangeText={(v) => patch({ supersetGroup: v || undefined })}
                  placeholder="A"
                  placeholderTextColor="#52525B"
                  className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl px-3 text-white"
                  style={{ paddingVertical: 10, fontSize: 14 }}
                />
              </View>
              {item.groupType === 'emom' ? (
                <View className="flex-1">
                  <Text
                    className="text-zinc-500 font-bold mb-1.5"
                    style={{ fontSize: 11 }}
                  >
                    EMOM (s)
                  </Text>
                  <TextInput
                    value={item.emomSeconds ? String(item.emomSeconds) : ''}
                    onChangeText={(v) => {
                      const n = Number(v);
                      patch({
                        emomSeconds:
                          Number.isFinite(n) && n > 0 ? n : undefined,
                      });
                    }}
                    keyboardType="number-pad"
                    placeholder="60"
                    placeholderTextColor="#52525B"
                    className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl px-3 text-white"
                    style={{ paddingVertical: 10, fontSize: 14 }}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <View>
            <Text
              className="text-zinc-500 font-bold mb-1.5"
              style={{ fontSize: 11 }}
            >
              DEMO URL
            </Text>
            <TextInput
              value={item.demoUrl ?? ''}
              onChangeText={(v) => patch({ demoUrl: v || undefined })}
              placeholder="https://…"
              placeholderTextColor="#52525B"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="bg-[#1A1A1A] border rounded-xl px-3 text-white"
              style={{
                paddingVertical: 10,
                fontSize: 14,
                borderColor: demoUrlInvalid ? '#F87171' : '#1F1F1F',
              }}
            />
            {demoUrlInvalid ? (
              <Text className="text-red-400 text-xs mt-1">
                Must start with http:// or https://
              </Text>
            ) : null}
          </View>

          <TextInput
            value={item.note ?? ''}
            onChangeText={(v) => patch({ note: v || undefined })}
            placeholder="Exercise note (grip, cue, etc.)"
            placeholderTextColor="#52525B"
            multiline
            className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl px-3 text-white"
            style={{ paddingVertical: 10, fontSize: 13, minHeight: 40 }}
          />
        </View>
      ) : null}
    </View>
  );
}
