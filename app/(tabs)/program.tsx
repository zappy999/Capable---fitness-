import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
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
import {
  COLORS,
  MONO,
  accentAlpha,
} from '../../src/design/tokens';
import {
  Badge,
  CardSm,
  ModernHeader,
  NumMono,
  Segmented,
} from '../../src/design/components';

type Tab = 'Program' | 'Workout' | 'Exercise';
const TABS: Tab[] = ['Program', 'Workout', 'Exercise'];

function isTab(v: string | undefined): v is Tab {
  return v !== undefined && (TABS as string[]).includes(v);
}

const TAB_COPY: Record<
  Tab,
  { eyebrow: string; title: string; subtitle: string; badge?: string }
> = {
  Program: {
    eyebrow: 'Programs',
    title: 'Programs',
    subtitle: 'Group workouts into a training block.',
  },
  Workout: {
    eyebrow: 'Programs',
    title: 'Workouts',
    subtitle: 'Individual sessions you can add to programs.',
  },
  Exercise: {
    eyebrow: 'Programs',
    title: 'Exercise History',
    subtitle: 'All tracked movements, grouped by muscle.',
  },
};

export default function ProgramHubScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const router = useRouter();
  const initialTab: Tab = isTab(params.tab) ? params.tab : 'Program';
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => {
    if (isTab(params.tab) && params.tab !== tab) {
      setTab(params.tab);
    }
  }, [params.tab]);
  const copy = TAB_COPY[tab];
  const accent = useAccent();
  const { programs } = useStore();
  const activeProgram = programs.find((p) => p.isActive);
  const programBadge =
    tab === 'Program' && activeProgram?.durationWeeks
      ? `Wk ? / ${activeProgram.durationWeeks}`
      : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ModernHeader
          eyebrow={copy.eyebrow}
          badge={programBadge}
          title={copy.title}
          sub={copy.subtitle}
          accent={accent}
          onAction={() => router.push('/settings')}
        />

        <View style={{ marginBottom: 16 }}>
          <Segmented
            tabs={TABS}
            active={tab}
            onChange={setTab}
            accent={accent}
          />
        </View>

        {tab === 'Program' ? <ProgramsTab /> : null}
        {tab === 'Workout' ? <WorkoutsTab /> : null}
        {tab === 'Exercise' ? <ExercisesTab /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgramsTab() {
  const router = useRouter();
  const { programs, setActiveProgram, deleteProgram } = useStore();
  const accent = useAccent();

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
          accent={accent}
        />
      ) : (
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
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
                style={{
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <NumMono
                      style={{
                        color: accent,
                        fontSize: 18,
                        fontWeight: '800',
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </NumMono>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: '700',
                        color: COLORS.text,
                        letterSpacing: -0.1,
                      }}
                    >
                      {p.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.subtle, marginTop: 2 }}>
                      {p.workoutIds.length} workout
                      {p.workoutIds.length === 1 ? '' : 's'}
                      {p.durationWeeks ? ` · ${p.durationWeeks} wk block` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/programs/${p.id}`);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: COLORS.text,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.onAccent,
                        fontSize: 13,
                        fontWeight: '700',
                      }}
                    >
                      View
                    </Text>
                  </Pressable>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    marginTop: 12,
                    marginLeft: 68,
                  }}
                >
                  {p.isActive ? (
                    <Badge accent={accent}>ACTIVE</Badge>
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setActiveProgram(p.id);
                      }}
                      style={{
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.muted,
                          fontSize: 10,
                          fontWeight: '800',
                          letterSpacing: -0.05,
                        }}
                      >
                        SET ACTIVE
                      </Text>
                    </Pressable>
                  )}
                  {p.isCustom ? (
                    <Badge accent={accent} variant="yellow">
                      CUSTOM
                    </Badge>
                  ) : (
                    <Badge accent={accent} variant="blue">
                      PRESET
                    </Badge>
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
  const accent = useAccent();

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
          accent={accent}
        />
      ) : (
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
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
                  style={{
                    backgroundColor: COLORS.surface,
                    borderWidth: isActive ? 1.5 : 1,
                    borderColor: isActive ? accentAlpha(accent, 0.55) : COLORS.border,
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="barbell-outline" size={18} color={accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}
                      >
                        {w.name}
                      </Text>
                      {isActive ? <Badge accent={accent}>ACTIVE</Badge> : null}
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.subtle, marginTop: 4 }}>
                      {w.exercises.length} ex
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.ghost} />
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
  const accent = useAccent();
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
    <View style={{ paddingHorizontal: 20 }}>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 12, color: COLORS.subtle, marginBottom: 10 }}>
          {trackedCount} tracked
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.bg,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search" size={14} color={COLORS.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            placeholderTextColor={COLORS.faint}
            style={{
              flex: 1,
              marginLeft: 8,
              paddingVertical: 12,
              fontSize: 14,
              color: COLORS.text,
            }}
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
          accent={accent}
        />
      ) : (
        <View style={{ gap: 8 }}>
          {grouped.map((group) => {
            const color =
              group.cat !== 'Uncategorized'
                ? MUSCLE_COLORS[group.cat]
                : COLORS.subtle;
            const open = openGroups.has(group.cat) || query.trim().length > 0;
            return (
              <View
                key={group.cat}
                style={{
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 24,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => toggle(group.cat)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: color,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '700',
                      color: COLORS.text,
                    }}
                  >
                    {group.cat}
                  </Text>
                  <NumMono style={{ fontSize: 12, color: COLORS.subtle }}>
                    {group.items.length}
                  </NumMono>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={COLORS.subtle}
                  />
                </Pressable>
                {open ? (
                  <View>
                    {group.items.map((ex) => (
                      <Pressable
                        key={ex.id}
                        onPress={() => router.push(`/exercises/${ex.id}`)}
                        style={{
                          paddingHorizontal: 18,
                          paddingVertical: 12,
                          borderTopWidth: 1,
                          borderTopColor: COLORS.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ fontSize: 14, color: COLORS.text }}>
                          {ex.name}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={COLORS.ghost}
                        />
                      </Pressable>
                    ))}
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
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
  };
}) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: COLORS.text,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: COLORS.subtle, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {secondaryAction ? (
          <Pressable
            onPress={secondaryAction.onPress}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {secondaryAction.icon ? (
              <Ionicons name={secondaryAction.icon} size={14} color={COLORS.text} />
            ) : null}
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}>
              {secondaryAction.label}
            </Text>
          </Pressable>
        ) : null}
        {action ? (
          <Pressable
            onPress={action.onPress}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: COLORS.text,
            }}
          >
            <Text
              style={{
                color: COLORS.onAccent,
                fontSize: 13,
                fontWeight: '700',
              }}
            >
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
  accent,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  inline?: boolean;
  accent?: string;
}) {
  const tint = accent ?? COLORS.muted;
  return (
    <View
      style={{
        marginHorizontal: inline ? 0 : 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: accent ? accentAlpha(tint, 0.133) : '#1F1F1F',
          borderWidth: 1,
          borderColor: accent ? accentAlpha(tint, 0.22) : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Ionicons name={icon} size={22} color={accent ?? COLORS.subtle} />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: COLORS.text,
          letterSpacing: -0.1,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: COLORS.subtle,
          textAlign: 'center',
          marginTop: 4,
          lineHeight: 18,
        }}
      >
        {body}
      </Text>
    </View>
  );
}
