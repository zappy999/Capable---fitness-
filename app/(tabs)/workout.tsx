import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';
import { EXERCISE_CATEGORIES } from '../../src/store/types';
import { WORKOUTS as DEMO_WORKOUTS, HISTORY } from '../../src/data/workouts';

const NEON = '#22C55E';
const LIME = '#C6F24E';

type Tab = 'Programs' | 'History' | 'Exercises' | 'Discover';
const TABS: Tab[] = ['Programs', 'History', 'Exercises', 'Discover'];

const TAB_COPY: Record<Tab, { eyebrow: string; title: string; subtitle: string }> = {
  Programs: {
    eyebrow: 'WORKOUT',
    title: 'Programs',
    subtitle: 'Preview first, then start.',
  },
  History: {
    eyebrow: 'WORKOUT',
    title: 'History',
    subtitle: 'Sessions you have logged.',
  },
  Exercises: {
    eyebrow: 'WORKOUT',
    title: 'Exercises',
    subtitle: 'Your full exercise catalogue.',
  },
  Discover: {
    eyebrow: 'WORKOUT',
    title: 'Discover',
    subtitle: 'Starter workouts you can try.',
  },
};

export default function WorkoutHubScreen() {
  const [tab, setTab] = useState<Tab>('Programs');
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

        {tab === 'Programs' ? <ProgramsTab /> : null}
        {tab === 'History' ? <HistoryTab /> : null}
        {tab === 'Exercises' ? <ExercisesTab /> : null}
        {tab === 'Discover' ? <DiscoverTab /> : null}
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
  const { programs, workouts, setActiveProgram, deleteProgram } = useStore();

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

      <SectionHeader
        title="Your workouts"
        subtitle="Individual workouts you can add to programs."
        action={{ label: '+ Create', onPress: () => router.push('/workouts/new') }}
        topPad
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

function HistoryTab() {
  return (
    <View className="px-5 gap-3">
      {HISTORY.map((h) => (
        <View
          key={h.id}
          className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              {h.workoutName}
            </Text>
            <Text className="text-zinc-500 text-xs">{h.date}</Text>
          </View>
          <View className="flex-row gap-4 mt-2">
            <Text className="text-zinc-400 text-xs">{h.duration}m</Text>
            <Text className="text-zinc-400 text-xs">{h.calories} kcal</Text>
            <Text className="text-zinc-400 text-xs">{h.exercises} exercises</Text>
            {h.volume > 0 ? (
              <Text className="text-zinc-400 text-xs">{h.volume}kg vol</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function ExercisesTab() {
  const { exercises, deleteExercise } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, category]);

  const categories = ['All', ...EXERCISE_CATEGORIES];

  return (
    <View className="px-5">
      <View className="flex-row items-center bg-[#141414] border border-[#1F1F1F] rounded-2xl px-4 mb-3">
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        className="mb-4 flex-grow-0"
      >
        {categories.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: active ? LIME : '#141414',
                borderWidth: 1,
                borderColor: active ? LIME : '#1F1F1F',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? '#0A0A0A' : '#A1A1AA' }}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No exercises found"
          body="Try a different search or clear the category filter."
          inline
        />
      ) : (
        <View className="gap-2">
          {filtered.map((e) => (
            <View
              key={e.id}
              className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center"
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
              {e.isCustom ? (
                <Pressable
                  onPress={() => deleteExercise(e.id)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={14} color="#F87171" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function DiscoverTab() {
  const router = useRouter();
  return (
    <View className="px-5 gap-3">
      <Text className="text-zinc-500 text-xs mb-1">
        Starter workouts · tap to preview
      </Text>
      {DEMO_WORKOUTS.map((w) => (
        <Pressable
          key={w.id}
          onPress={() => router.push(`/workouts/${w.id}`)}
          className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center gap-4 active:opacity-80"
        >
          <View
            style={{ backgroundColor: `${w.color}20` }}
            className="w-12 h-12 rounded-xl items-center justify-center"
          >
            <Ionicons name={w.icon} size={22} color={w.color} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              {w.name}
            </Text>
            <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
              {w.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
        </Pressable>
      ))}
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
