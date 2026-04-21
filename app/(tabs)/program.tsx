import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  MUSCLE_COLORS,
  type ExerciseCategory,
  type WorkoutSession,
} from '../../src/store/types';

const NEON = '#22C55E';
const LIME = '#22C55E';

type Tab = 'Program' | 'Workout' | 'Exercise';
const TABS: Tab[] = ['Program', 'Workout', 'Exercise'];

const TAB_COPY: Record<Tab, { eyebrow: string; title: string; subtitle: string }> = {
  Program: {
    eyebrow: 'PROGRAM',
    title: 'Programs',
    subtitle: 'Group workouts into a training block.',
  },
  Workout: {
    eyebrow: 'PROGRAM',
    title: 'Workouts',
    subtitle: 'Individual sessions you can add to programs.',
  },
  Exercise: {
    eyebrow: 'PROGRAM',
    title: 'Exercise history',
    subtitle: 'All tracked movements, grouped by muscle.',
  },
};

export default function ProgramHubScreen() {
  const [tab, setTab] = useState<Tab>('Program');
  const copy = TAB_COPY[tab];

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <HeaderCard eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />

        <View className="px-5 mt-4 mb-4">
          <View className="flex-row flex-wrap gap-2">
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  className="px-5 py-2.5 rounded-full"
                  style={{
                    backgroundColor: active ? LIME : '#141414',
                    borderWidth: 1,
                    borderColor: active ? LIME : '#1F1F1F',
                  }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: active ? '#0A0A0A' : '#ffffff' }}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {tab === 'Program' ? <ProgramsTab /> : null}
        {tab === 'Workout' ? <WorkoutsTab /> : null}
        {tab === 'Exercise' ? <ExercisesTab /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            {eyebrow}
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 36 }}>
            {title}
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            {subtitle}
          </Text>
        </View>
        <View className="w-10 h-10 rounded-2xl items-center justify-center bg-black/20">
          <Ionicons name="settings-sharp" size={18} color="#0A0A0A" />
        </View>
      </View>
    </View>
  );
}

function ProgramsTab() {
  const router = useRouter();
  const { programs, setActiveProgram, deleteProgram } = useStore();

  return (
    <>
      <SectionHeader
        title="Your programs"
        subtitle="Tap a program to see its workouts."
        action={{ label: '+ Create', onPress: () => router.push('/programs/new') }}
      />
      {programs.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No programs yet"
          body="Create a program to group workouts into a training block."
        />
      ) : (
        <View className="px-5 gap-3">
          {programs.map((p, idx) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/programs/${p.id}`)}
              onLongPress={() => deleteProgram(p.id)}
              className="bg-[#141414] rounded-3xl border border-[#1F1F1F] p-4 active:opacity-80"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-2xl items-center justify-center bg-[#1F1F1F]">
                  <Text style={{ color: LIME, fontSize: 18 }} className="font-bold">
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold" style={{ fontSize: 20 }}>
                    {p.name}
                  </Text>
                  <Text className="text-zinc-500 text-sm mt-0.5">
                    {p.workoutIds.length} workout{p.workoutIds.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/programs/${p.id}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-white active:opacity-80"
                >
                  <Text className="text-black font-bold" style={{ fontSize: 14 }}>
                    View
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row gap-2 mt-3 ml-[72px]">
                {p.isActive ? (
                  <Badge label="ACTIVE" color={NEON} />
                ) : (
                  <Pressable onPress={() => setActiveProgram(p.id)}>
                    <Badge label="SET ACTIVE" color="#6b7280" outline />
                  </Pressable>
                )}
                {p.isCustom ? <Badge label="CUSTOM" color="#EAB308" /> : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function WorkoutsTab() {
  const router = useRouter();
  const { workouts, deleteWorkout } = useStore();

  return (
    <>
      <SectionHeader
        title="Your workouts"
        subtitle="Individual workouts you can add to programs."
        action={{ label: '+ Create', onPress: () => router.push('/workouts/new') }}
      />
      {workouts.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workouts yet"
          body="Create a workout to add exercises, sets, and reps."
        />
      ) : (
        <View className="px-5 gap-3">
          {workouts.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/workouts/${w.id}`)}
              onLongPress={() => deleteWorkout(w.id)}
              className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center gap-4 active:opacity-80"
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center bg-[#1F1F1F]">
                <Ionicons name="barbell" size={20} color={LIME} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                  {w.name}
                </Text>
                <Text className="text-zinc-500 text-xs mt-0.5">
                  {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function ExercisesTab() {
  const router = useRouter();
  const { exercises, sessions } = useStore();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  const sessionsByExerciseId = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      for (const se of s.exercises) {
        const list = map.get(se.exerciseId) ?? [];
        list.push(s);
        map.set(se.exerciseId, list);
      }
    }
    return map;
  }, [sessions]);

  const trackedCount = sessionsByExerciseId.size;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (!sessionsByExerciseId.has(e.id)) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, sessionsByExerciseId]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof exercises>();
    for (const ex of filtered) {
      const key = (ex.category as string) ?? 'Uncategorized';
      const arr = groups.get(key) ?? [];
      arr.push(ex);
      groups.set(key, arr);
    }
    const order = [...EXERCISE_CATEGORIES, 'Uncategorized'];
    return order
      .map((cat) => ({ cat, items: groups.get(cat) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const toggle = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <View className="px-5">
      <View className="bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5 mb-4">
        <Text
          className="text-zinc-500 font-bold"
          style={{ fontSize: 11, letterSpacing: 1.5 }}
        >
          EXERCISES
        </Text>
        <Text className="text-white font-bold mt-2" style={{ fontSize: 28 }}>
          Exercise History
        </Text>
        <Text className="text-zinc-500 text-sm mt-1 mb-4">
          {trackedCount} tracked · grouped by muscle group
        </Text>
        <View className="flex-row items-center bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4">
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
        <EmptyState
          icon="pulse-outline"
          title={trackedCount === 0 ? 'No tracked exercises yet' : 'No matches'}
          body={
            trackedCount === 0
              ? 'Log a workout to see it here.'
              : 'Try a different search term.'
          }
          inline
        />
      ) : (
        <View className="gap-3">
          {grouped.map((group) => {
            const color =
              MUSCLE_COLORS[group.cat as ExerciseCategory] ?? '#71717A';
            const open = openGroups.has(group.cat) || query.trim().length > 0;
            return (
              <View
                key={group.cat}
                className="bg-[#141414] rounded-3xl border border-[#1F1F1F] overflow-hidden"
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
                      return (
                        <Pressable
                          key={ex.id}
                          onPress={() => router.push(`/exercises/${ex.id}`)}
                          className="px-5 py-4 flex-row items-center active:opacity-70"
                          style={{
                            borderTopWidth: 1,
                            borderTopColor: '#1F1F1F',
                            borderBottomLeftRadius: isLast ? 24 : 0,
                            borderBottomRightRadius: isLast ? 24 : 0,
                          }}
                        >
                          <Text
                            className="text-white flex-1"
                            style={{ fontSize: 15 }}
                          >
                            {ex.name}
                          </Text>
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
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
  topPad,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  topPad?: boolean;
}) {
  return (
    <View
      className="px-5 flex-row items-start justify-between mb-3"
      style={{ marginTop: topPad ? 28 : 0 }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-white font-bold" style={{ fontSize: 20 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-zinc-500 text-sm mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          className="px-5 py-3 rounded-2xl active:opacity-90"
          style={{ backgroundColor: LIME }}
        >
          <Text className="text-black font-bold" style={{ fontSize: 14 }}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  body,
  inline,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  inline?: boolean;
}) {
  return (
    <View
      className="mx-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] py-8 px-6 items-center"
      style={inline ? { marginHorizontal: 0 } : null}
    >
      <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
        <Ionicons name={icon} size={22} color="#71717A" />
      </View>
      <Text className="text-white font-bold" style={{ fontSize: 16 }}>
        {title}
      </Text>
      <Text className="text-zinc-500 text-sm text-center mt-1">{body}</Text>
    </View>
  );
}

function Badge({
  label,
  color,
  outline,
}: {
  label: string;
  color: string;
  outline?: boolean;
}) {
  return (
    <View
      className="px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: outline ? 'transparent' : `${color}22`,
        borderWidth: 1,
        borderColor: outline ? `${color}55` : `${color}66`,
      }}
    >
      <Text className="font-bold" style={{ color, fontSize: 10, letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  );
}
