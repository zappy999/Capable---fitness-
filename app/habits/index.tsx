import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';
import type { Habit, HabitFrequency } from '../../src/store/types';

const LIME = '#C6F24E';
const FREQS: HabitFrequency[] = ['daily', 'weekdays', 'weekends', 'custom'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const COLOR_OPTIONS = [
  '#C6F24E',
  '#22C55E',
  '#60A5FA',
  '#F87171',
  '#FBBF24',
  '#A78BFA',
  '#EC4899',
  '#10B981',
];

export default function HabitsScreen() {
  const router = useRouter();
  const { habits, deleteHabit, archiveHabit } = useStore();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const sorted = useMemo(
    () =>
      [...habits]
        .filter((h) => showArchived || !h.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [habits, showArchived],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top', 'bottom']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </Pressable>
        <Pressable
          onPress={() => setCreating(true)}
          className="px-5 py-2.5 rounded-2xl"
          style={{ backgroundColor: LIME }}
        >
          <Text className="text-black font-bold" style={{ fontSize: 14 }}>
            + New habit
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            HABITS
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
            Daily habits
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            Track streaks and stay consistent.
          </Text>
        </View>

        {sorted.length === 0 ? (
          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] py-8 px-6 items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
              <Ionicons name="list-outline" size={22} color="#71717A" />
            </View>
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              No habits yet
            </Text>
            <Text className="text-zinc-500 text-sm text-center mt-1">
              Add a habit to start building a streak.
            </Text>
          </View>
        ) : (
          <View className="px-5 mt-5 gap-2.5">
            {sorted.map((h) => (
              <View
                key={h.id}
                className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4"
                style={{ opacity: h.archived ? 0.5 : 1 }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: (h.color ?? LIME) + '25',
                    }}
                  >
                    <Ionicons
                      name={(h.icon as any) ?? 'checkmark-circle-outline'}
                      size={18}
                      color={h.color ?? LIME}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                      {h.name}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      {formatFrequency(h)}
                      {h.targetValue ? ` · target ${h.targetValue}${h.unit ? ' ' + h.unit : ''}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setEditing(h)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70 mr-2"
                  >
                    <Ionicons name="create-outline" size={14} color="#ffffff" />
                  </Pressable>
                  <Pressable
                    onPress={() => archiveHabit(h.id, !h.archived)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70 mr-2"
                  >
                    <Ionicons
                      name={h.archived ? 'arrow-up-outline' : 'archive-outline'}
                      size={14}
                      color="#A1A1AA"
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => deleteHabit(h.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                  >
                    <Ionicons name="trash-outline" size={14} color="#F87171" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setShowArchived((s) => !s)}
          className="mx-5 mt-5 px-4 py-3 rounded-2xl bg-[#141414] border border-[#1F1F1F] items-center active:opacity-70"
        >
          <Text className="text-zinc-400 text-sm font-semibold">
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Text>
        </Pressable>
      </ScrollView>

      <HabitEditor
        visible={creating || editing !== null}
        habit={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </SafeAreaView>
  );
}

function formatFrequency(h: Habit): string {
  switch (h.frequency) {
    case 'daily':
      return 'Daily';
    case 'weekdays':
      return 'Mon–Fri';
    case 'weekends':
      return 'Sat–Sun';
    case 'custom':
      if (!h.customDays || h.customDays.length === 0) return 'Custom';
      return h.customDays
        .slice()
        .sort()
        .map((d) => DAY_LABELS[d])
        .join(' ');
  }
}

function HabitEditor({
  visible,
  habit,
  onClose,
}: {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
}) {
  const { saveHabit } = useStore();

  const [name, setName] = useState(habit?.name ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(
    habit?.frequency ?? 'daily',
  );
  const [customDays, setCustomDays] = useState<number[]>(habit?.customDays ?? []);
  const [color, setColor] = useState<string>(habit?.color ?? LIME);
  const [targetValue, setTargetValue] = useState<string>(
    habit?.targetValue != null ? String(habit.targetValue) : '',
  );
  const [unit, setUnit] = useState<string>(habit?.unit ?? '');

  const resetFrom = (h: Habit | null) => {
    setName(h?.name ?? '');
    setFrequency(h?.frequency ?? 'daily');
    setCustomDays(h?.customDays ?? []);
    setColor(h?.color ?? LIME);
    setTargetValue(h?.targetValue != null ? String(h.targetValue) : '');
    setUnit(h?.unit ?? '');
  };

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveHabit({
      id: habit?.id,
      name: name.trim(),
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      color,
      targetValue: targetValue ? Number(targetValue) || undefined : undefined,
      unit: unit.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
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
            maxHeight: '90%',
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              onLayout={() => resetFrom(habit)}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-bold" style={{ fontSize: 20 }}>
                  {habit ? 'Edit habit' : 'New habit'}
                </Text>
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </Pressable>
              </View>

              <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
                NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. 10 min mobility"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white mb-4"
                style={{ paddingVertical: 14, fontSize: 15 }}
                autoFocus
              />

              <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
                FREQUENCY
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {FREQS.map((f) => {
                  const active = frequency === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setFrequency(f)}
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
                        {f === 'weekdays'
                          ? 'Weekdays'
                          : f === 'weekends'
                            ? 'Weekends'
                            : f[0].toUpperCase() + f.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {frequency === 'custom' ? (
                <View className="flex-row gap-2 mb-4">
                  {DAY_LABELS.map((d, i) => {
                    const active = customDays.includes(i);
                    return (
                      <Pressable
                        key={i}
                        onPress={() =>
                          setCustomDays((prev) =>
                            prev.includes(i)
                              ? prev.filter((x) => x !== i)
                              : [...prev, i],
                          )
                        }
                        className="flex-1 h-10 rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: active ? LIME : '#0D0D0D',
                          borderWidth: 1,
                          borderColor: active ? LIME : '#1F1F1F',
                        }}
                      >
                        <Text
                          className="font-bold"
                          style={{ color: active ? '#0A0A0A' : '#A1A1AA', fontSize: 13 }}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
                COLOR
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {COLOR_OPTIONS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: c + '30',
                      borderWidth: 2,
                      borderColor: color === c ? c : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: c,
                      }}
                    />
                  </Pressable>
                ))}
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text
                    className="text-zinc-500 font-bold mb-1.5"
                    style={{ fontSize: 11 }}
                  >
                    TARGET
                  </Text>
                  <TextInput
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    placeholderTextColor="#52525B"
                    className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
                    style={{ paddingVertical: 12, fontSize: 14 }}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-zinc-500 font-bold mb-1.5"
                    style={{ fontSize: 11 }}
                  >
                    UNIT
                  </Text>
                  <TextInput
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="min, ml, pages…"
                    placeholderTextColor="#52525B"
                    className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
                    style={{ paddingVertical: 12, fontSize: 14 }}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                className="rounded-2xl items-center"
                style={{
                  backgroundColor: canSave ? LIME : '#1F1F1F',
                  paddingVertical: 14,
                }}
              >
                <Text
                  className="font-bold"
                  style={{
                    color: canSave ? '#0A0A0A' : '#52525B',
                    fontSize: 15,
                  }}
                >
                  {habit ? 'Save changes' : 'Create habit'}
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
