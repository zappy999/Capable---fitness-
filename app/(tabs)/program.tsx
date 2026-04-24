import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { PressableScale } from '../../src/components/PressableScale';
import {
  EXERCISE_CATEGORIES,
  MUSCLE_COLORS,
  type ExerciseCategory,
  type WorkoutSession,
} from '../../src/store/types';

type Tab = 'Program' | 'Workout' | 'Exercise';
const TABS: Tab[] = ['Program', 'Workout', 'Exercise'];

function SegmentedTabs({
  tabs,
  active,
  onChange,
  activeColor,
}: {
  tabs: Tab[];
  active: Tab;
  onChange: (t: Tab) => void;
  activeColor: string;
}) {
  const activeIdx = tabs.indexOf(active);
  const offset = useSharedValue(activeIdx);
  useEffect(() => {
    offset.value = withSpring(activeIdx, { damping: 22, stiffness: 200 });
  }, [activeIdx, offset]);
  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${(offset.value / tabs.length) * 100}%`,
  }));
  return (
    <View
      className="flex-row rounded-full p-1 relative"
      style={{ backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            width: `${100 / tabs.length}%`,
            backgroundColor: activeColor,
            borderRadius: 9999,
          },
          indicatorStyle,
        ]}
      />
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            className="flex-1 py-2.5 items-center"
          >
            <Text
              className="text-sm font-bold"
              style={{ color: isActive ? '#0A0A0A' : '#ffffff' }}
            >
              {t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function isTab(v: string | undefined): v is Tab {
  return v !== undefined && (TABS as string[]).includes(v);
}

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
    title: 'Exercise History',
    subtitle: 'All tracked movements, grouped by muscle group.',
  },
};

export default function ProgramHubScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: Tab = isTab(params.tab) ? params.tab : 'Program';
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => {
    if (isTab(params.tab) && params.tab !== tab) {
      setTab(params.tab);
    }
  }, [params.tab]);
  const copy = TAB_COPY[tab];
  const LIME = useAccent();

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <HeaderCard eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />

        <View className="px-5 mt-4 mb-4">
          <SegmentedTabs
            tabs={TABS}
            active={tab}
            onChange={setTab}
            activeColor={LIME}
          />
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
  const LIME = useAccent();
  return (
    <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
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
  );
}

function ProgramsTab() {
  const router = useRouter();
  const { programs, setActiveProgram, deleteProgram } = useStore();
  const LIME = useAccent();
  const NEON = LIME;

  return (
    <>
      <SectionHeader
        title="Your programs"
        subtitle="Tap a program to see its workouts."
        action={{ label: '+ Create', onPress: () => router.push('/programs/new') }}
        secondaryAction={{
          label: 'Import',
          icon: 'cloud-upload-outline',
          onPress: () => router.push('/programs/import'),
        }}
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
            <Animated.View
              key={p.id}
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(180)}
              layout={LinearTransition.springify().damping(18)}
            >
            <PressableScale
              onPress={() => router.push(`/programs/${p.id}`)}
              onLongPress={() => deleteProgram(p.id)}
              className="bg-[#141414] rounded-3xl border border-[#1F1F1F] p-4"
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
              <View className="flex-row items-center gap-2 mt-3 ml-[72px]">
                {p.isActive ? (
                  <Badge label="ACTIVE" color={NEON} />
                ) : (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveProgram(p.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 active:opacity-70"
                  >
                    <Text
                      className="text-white font-semibold"
                      style={{ fontSize: 11, letterSpacing: 0.5 }}
                    >
                      Set active
                    </Text>
                  </Pressable>
                )}
                {p.isCustom ? (
                  <Badge label="CUSTOM" color="#EAB308" />
                ) : (
                  <Badge label="PRESET" color="#60A5FA" />
                )}
              </View>
            </PressableScale>
            </Animated.View>
          ))}
        </View>
      )}
    </>
  );
}

function WorkoutsTab() {
  const router = useRouter();
  const { workouts, programs, deleteWorkout } = useStore();
  const LIME = useAccent();

  const activeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of programs) {
      if (!p.isActive) continue;
      for (const id of p.workoutIds) ids.add(id);
    }
    return ids;
  }, [programs]);

  const ordered = useMemo(() => {
    return [...workouts].sort((a, b) => {
      const aActive = activeIds.has(a.id);
      const bActive = activeIds.has(b.id);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }, [workouts, activeIds]);

  return (
    <>
      <SectionHeader
        title="Your workouts"
        subtitle="Active program first, then newest."
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
          {ordered.map((w) => {
            const isActive = activeIds.has(w.id);
            return (
              <Animated.View
                key={w.id}
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(180)}
                layout={LinearTransition.springify().damping(18)}
              >
              <PressableScale
                onPress={() => router.push(`/workouts/${w.id}`)}
                onLongPress={() => deleteWorkout(w.id)}
                className="bg-[#141414] rounded-2xl p-4 flex-row items-center gap-4"
                style={{
                  borderWidth: 1,
                  borderColor: isActive ? `${LIME}66` : '#1F1F1F',
                }}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center bg-[#1F1F1F]">
                  <Ionicons name="barbell" size={20} color={LIME} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap gap-2">
                    <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                      {w.name}
                    </Text>
                    {isActive ? <Badge label="ACTIVE" color={LIME} /> : null}
                  </View>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
              </PressableScale>
              </Animated.View>
            );
          })}
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
        <Text className="text-zinc-500 text-sm mb-3">
          {trackedCount} tracked
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
              group.cat !== 'Uncategorized'
                ? MUSCLE_COLORS[group.cat]
                : '#71717A';
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
  secondaryAction,
  topPad,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name'] };
  topPad?: boolean;
}) {
  const LIME = useAccent();
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
      <View className="flex-row gap-2">
        {secondaryAction ? (
          <Pressable
            onPress={secondaryAction.onPress}
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 active:opacity-80 flex-row items-center"
          >
            {secondaryAction.icon ? (
              <Ionicons
                name={secondaryAction.icon}
                size={14}
                color="#ffffff"
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text className="text-white font-bold" style={{ fontSize: 14 }}>
              {secondaryAction.label}
            </Text>
          </Pressable>
        ) : null}
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
