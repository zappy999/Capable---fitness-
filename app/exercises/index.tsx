import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  MUSCLE_COLORS,
  type Exercise,
  type ExerciseCategory,
} from '../../src/store/types';

export default function ExercisesIndexScreen() {
  const router = useRouter();
  const { exercises, sessions } = useStore();
  const LIME = useAccent();
  const params = useLocalSearchParams<{ custom?: string }>();
  const customOnly = params.custom === '1';

  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  const sessionCountByExId = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      for (const se of s.exercises) {
        map.set(se.exerciseId, (map.get(se.exerciseId) ?? 0) + 1);
      }
    }
    return map;
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (customOnly && !e.isCustom) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, customOnly]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const key = ex.category ?? 'Uncategorized';
      const arr = groups.get(key) ?? [];
      arr.push(ex);
      groups.set(key, arr);
    }
    const order: (ExerciseCategory | 'Uncategorized')[] = [
      ...EXERCISE_CATEGORIES,
      'Uncategorized',
    ];
    return order
      .map((cat) => ({
        cat,
        items: (groups.get(cat) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const toggle = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const title = customOnly ? 'Custom exercises' : 'Exercise library';
  const subtitle = customOnly
    ? 'Exercises you added.'
    : 'Every movement in the catalogue.';
  const eyebrow = customOnly ? 'CUSTOM' : 'EXERCISES';

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          className="mx-5 mt-2 rounded-3xl p-6"
          style={{ backgroundColor: LIME }}
        >
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            {eyebrow}
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 32 }}>
            {title}
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            {subtitle}
          </Text>
        </View>

        <View className="mx-5 mt-5">
          <View className="flex-row items-center bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl px-4">
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
        </View>

        {grouped.length === 0 ? (
          <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] py-10 px-6 items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
              <Ionicons name="search" size={22} color="#71717A" />
            </View>
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              {customOnly ? 'No custom exercises' : 'No matches'}
            </Text>
            <Text className="text-zinc-500 text-sm text-center mt-1">
              {customOnly
                ? 'Add one from the Exercise tab or when building a workout.'
                : 'Try a different search term.'}
            </Text>
          </View>
        ) : (
          <View className="px-5 mt-4 gap-3">
            {grouped.map((group) => {
              const color =
                group.cat !== 'Uncategorized'
                  ? MUSCLE_COLORS[group.cat]
                  : '#71717A';
              const open = openGroups.has(group.cat) || query.trim().length > 0;
              return (
                <View
                  key={group.cat}
                  className="bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] overflow-hidden"
                >
                  <Pressable
                    onPress={() => toggle(group.cat)}
                    className="px-5 py-4 flex-row items-center active:opacity-80"
                  >
                    <View
                      style={{ backgroundColor: color }}
                      className="w-2.5 h-2.5 rounded-full mr-3"
                    />
                    <Text
                      className="text-white font-bold flex-1"
                      style={{ fontSize: 17 }}
                    >
                      {group.cat}
                    </Text>
                    <Text className="text-zinc-500 text-sm mr-3">
                      {group.items.length}
                    </Text>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#71717A"
                    />
                  </Pressable>
                  {open ? (
                    <View>
                      {group.items.map((ex, i) => {
                        const isLast = i === group.items.length - 1;
                        const count = sessionCountByExId.get(ex.id) ?? 0;
                        return (
                          <Pressable
                            key={ex.id}
                            onPress={() => router.push(`/exercises/${ex.id}`)}
                            className="px-5 py-3 flex-row items-center active:opacity-70"
                            style={{
                              borderTopWidth: 1,
                              borderTopColor: '#1F1F1F',
                              borderBottomLeftRadius: isLast ? 24 : 0,
                              borderBottomRightRadius: isLast ? 24 : 0,
                            }}
                          >
                            <View className="flex-1">
                              <Text
                                className="text-white"
                                style={{ fontSize: 15 }}
                              >
                                {ex.name}
                              </Text>
                              <Text
                                className="text-zinc-500 mt-0.5"
                                style={{ fontSize: 12 }}
                              >
                                {count === 0
                                  ? 'Not logged yet'
                                  : `${count} session${count === 1 ? '' : 's'}`}
                                {ex.isCustom ? ' · custom' : ''}
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#3F3F46"
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
