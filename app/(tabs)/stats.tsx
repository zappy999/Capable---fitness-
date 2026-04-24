import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import type { WorkoutSession } from '../../src/store/types';
import {
  computeAchievementStatus,
  longestStreak,
  type AchievementStatus,
} from '../../src/lib/achievements';
import {
  COLORS,
  MONO,
  muscleColor,
} from '../../src/design/tokens';
import { ModernHeader, NumMono } from '../../src/design/components';

function mondayISO(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function sessionVolume(s: WorkoutSession) {
  let v = 0;
  for (const e of s.exercises) {
    for (const st of e.sets) v += st.weight * st.reps;
  }
  return v;
}

type WeekBucket = { weekStart: string; volume: number; count: number };

function buildWeeks(sessions: WorkoutSession[], weeks: number): WeekBucket[] {
  const thisMonday = mondayISO(new Date().toISOString().slice(0, 10));
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({
      weekStart: addDaysISO(thisMonday, -i * 7),
      volume: 0,
      count: 0,
    });
  }
  const bucketMap = new Map(buckets.map((b) => [b.weekStart, b]));
  for (const s of sessions) {
    const wk = mondayISO(s.date);
    const bucket = bucketMap.get(wk);
    if (!bucket) continue;
    bucket.volume += sessionVolume(s);
    bucket.count += 1;
  }
  return buckets;
}

function formatVolume(kg: number): { value: string; suffix: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(1), suffix: 'k kg' };
  return { value: String(Math.round(kg)), suffix: 'kg' };
}

export default function StatsScreen() {
  const router = useRouter();
  const { programs, workouts, exercises, sessions, personalRecords } = useStore();
  const accent = useAccent();

  const customExercises = exercises.filter((e) => e.isCustom).length;

  const weeks = useMemo(() => buildWeeks(sessions, 8), [sessions]);
  const maxVolume = Math.max(...weeks.map((w) => w.volume), 1);
  const maxCount = Math.max(...weeks.map((w) => w.count), 1);
  const totalVolume8wk = weeks.reduce((a, w) => a + w.volume, 0);
  const thisWeekVol = weeks[weeks.length - 1]?.volume ?? 0;
  const prevWeekVol = weeks[weeks.length - 2]?.volume ?? 0;
  const deltaPct =
    prevWeekVol > 0
      ? Math.round(((thisWeekVol - prevWeekVol) / prevWeekVol) * 100)
      : 0;

  const streak = useMemo(
    () => longestStreak(Array.from(new Set(sessions.map((s) => s.date)))),
    [sessions],
  );

  const achievements = useMemo(
    () =>
      computeAchievementStatus({
        sessions,
        prs: personalRecords,
      }),
    [sessions, personalRecords],
  );

  // Muscle split over last 4 weeks by volume
  const muscleSplit = useMemo(() => {
    const fourWeeksAgo = weeks[Math.max(0, weeks.length - 4)]?.weekStart;
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const s of sessions) {
      if (fourWeeksAgo && s.date < fourWeeksAgo) continue;
      for (const se of s.exercises) {
        const ex = exercises.find((e) => e.id === se.exerciseId);
        const cat = ex?.category ?? 'Other';
        const v = se.sets.reduce((a, st) => a + st.weight * st.reps, 0);
        totals[cat] = (totals[cat] ?? 0) + v;
        grand += v;
      }
    }
    if (grand === 0) return [] as Array<{ name: string; pct: number }>;
    return Object.entries(totals)
      .map(([name, v]) => ({ name, pct: Math.round((v / grand) * 100) }))
      .filter((d) => d.pct > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [sessions, exercises, weeks]);

  const volFmt = formatVolume(totalVolume8wk);
  const topPR = [...personalRecords].sort((a, b) =>
    b.achievedAt.localeCompare(a.achievedAt),
  )[0];
  const topPRExercise = topPR
    ? exercises.find((e) => e.id === topPR.exerciseId)
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ModernHeader
          eyebrow="Stats"
          badge={
            deltaPct !== 0 ? `${deltaPct > 0 ? '+' : ''}${deltaPct}% · 1 wk` : undefined
          }
          title="Progress"
          sub="Your training in numbers."
          accent={accent}
          onAction={() => router.push('/settings')}
        />

        {/* 2-column stat grid */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatBig
              label="Total volume · 8 wk"
              value={volFmt.value}
              suffix={volFmt.suffix}
              trend={deltaPct !== 0 ? `${deltaPct > 0 ? '+' : ''}${deltaPct}%` : undefined}
              accent={accent}
              icon="trending-up-outline"
            />
            <StatBig
              label={topPRExercise ? `Best 1RM · ${topPRExercise.name}` : 'Best 1RM'}
              value={
                topPR
                  ? String(Math.round(topPR.weight * (1 + topPR.reps / 30)))
                  : '—'
              }
              suffix="kg"
              accent={accent}
              icon="trophy-outline"
              valueAccent
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SmallStat
              label="Sessions"
              value={String(sessions.length)}
              icon="barbell-outline"
              accent={accent}
              onPress={() => router.push('/sessions')}
            />
            <SmallStat
              label="PRs"
              value={String(personalRecords.length)}
              icon="trophy-outline"
              accent={accent}
              onPress={() => router.push('/prs')}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SmallStat
              label="Streak"
              value={`${streak}d`}
              icon="flame"
              accent="#F97316"
            />
            <SmallStat
              label="Programs"
              value={String(programs.length)}
              icon="albums-outline"
              accent={accent}
              onPress={() => router.push('/program?tab=Program')}
            />
          </View>
        </View>

        {/* Volume chart card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            marginBottom: 12,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: COLORS.subtle,
                  letterSpacing: -0.1,
                }}
              >
                Weekly volume
              </Text>
              <NumMono
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                  color: COLORS.text,
                  marginTop: 4,
                }}
              >
                {formatVolume(thisWeekVol).value}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: COLORS.muted,
                  }}
                >
                  {' '}
                  {formatVolume(thisWeekVol).suffix}
                </Text>
              </NumMono>
            </View>
            {deltaPct !== 0 ? (
              <Text style={{ fontSize: 12, color: accent, fontWeight: '700' }}>
                {deltaPct > 0 ? '+' : ''}
                {deltaPct}% {deltaPct > 0 ? '↑' : '↓'}
              </Text>
            ) : null}
          </View>
          <WeekBars
            weeks={weeks}
            valueFor={(w) => w.volume}
            maxValue={maxVolume}
            color={accent}
            unit="kg"
          />
        </View>

        {/* Muscle split card */}
        {muscleSplit.length > 0 ? (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 12,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 24,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: COLORS.subtle,
                letterSpacing: -0.1,
                marginBottom: 14,
              }}
            >
              Muscle split · 4 wk
            </Text>
            <View
              style={{
                flexDirection: 'row',
                height: 12,
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 14,
              }}
            >
              {muscleSplit.map((d) => (
                <View
                  key={d.name}
                  style={{
                    flex: d.pct,
                    backgroundColor: muscleColor(d.name),
                  }}
                />
              ))}
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                rowGap: 8,
              }}
            >
              {muscleSplit.map((d) => (
                <View
                  key={d.name}
                  style={{
                    width: '50%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: muscleColor(d.name),
                    }}
                  />
                  <Text
                    style={{ fontSize: 12, color: COLORS.muted, flex: 1 }}
                  >
                    {d.name}
                  </Text>
                  <NumMono
                    style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}
                  >
                    {d.pct}%
                  </NumMono>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Library links */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <SmallStat
            label="In library"
            value={String(exercises.length)}
            icon="list-outline"
            accent={accent}
            onPress={() => router.push('/exercises')}
          />
          <SmallStat
            label="Custom"
            value={String(customExercises)}
            icon="create-outline"
            accent={accent}
            onPress={() => router.push('/exercises?custom=1')}
          />
          <SmallStat
            label="Workouts"
            value={String(workouts.length)}
            icon="barbell-outline"
            accent={accent}
            onPress={() => router.push('/program?tab=Workout')}
          />
        </View>

        {/* Achievements */}
        <View
          style={{
            paddingHorizontal: 20,
            marginTop: 8,
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.text,
              letterSpacing: -0.2,
            }}
          >
            Achievements
          </Text>
          <NumMono style={{ fontSize: 12, color: COLORS.subtle }}>
            {achievements.filter((a) => a.unlocked).length} / {achievements.length}
          </NumMono>
        </View>
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {achievements.map((a) => (
            <AchievementCard key={a.def.id} achievement={a} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBig({
  label,
  value,
  suffix,
  trend,
  icon,
  accent,
  valueAccent,
}: {
  label: string;
  value: string;
  suffix?: string;
  trend?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  valueAccent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Ionicons name={icon} size={18} color={accent} />
        {trend ? (
          <Text style={{ fontSize: 11, color: accent, fontWeight: '700' }}>
            {trend}
          </Text>
        ) : null}
      </View>
      <NumMono
        style={{
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: -0.5,
          color: valueAccent ? accent : COLORS.text,
          marginTop: 6,
        }}
      >
        {value}
        {suffix ? (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: COLORS.muted,
            }}
          >
            {' '}
            {suffix}
          </Text>
        ) : null}
      </NumMono>
      <Text
        style={{
          fontSize: 11,
          color: COLORS.subtle,
          marginTop: 2,
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SmallStat({
  label,
  value,
  icon,
  accent,
  onPress,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  onPress?: () => void;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <Ionicons name={icon} size={18} color={accent} />
      <NumMono
        style={{
          fontSize: 20,
          fontWeight: '800',
          color: COLORS.text,
          marginTop: 6,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </NumMono>
      <Text
        style={{
          fontSize: 11,
          color: COLORS.subtle,
          marginTop: 2,
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
    </Wrap>
  );
}

function WeekBars({
  weeks,
  valueFor,
  maxValue,
  color,
  unit,
}: {
  weeks: WeekBucket[];
  valueFor: (w: WeekBucket) => number;
  maxValue: number;
  color: string;
  unit?: string;
}) {
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 96,
          gap: 6,
        }}
      >
        {weeks.map((w) => {
          const v = valueFor(w);
          const pct = maxValue > 0 ? (v / maxValue) * 100 : 0;
          return (
            <View
              key={w.weekStart}
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <View
                style={{
                  flex: 1,
                  width: '100%',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: '80%',
                    height: `${Math.max(pct, v > 0 ? 4 : 2)}%`,
                    backgroundColor: v > 0 ? color : '#2A2A2A',
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    borderBottomLeftRadius: 2,
                    borderBottomRightRadius: 2,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: COLORS.faint,
                  fontWeight: '500',
                  marginTop: 6,
                }}
              >
                {w.weekStart.slice(5)}
              </Text>
            </View>
          );
        })}
      </View>
      {unit ? (
        <Text style={{ fontSize: 10, color: COLORS.faint, marginTop: 6 }}>
          peak {Math.round(maxValue).toLocaleString()}
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementStatus }) {
  const { def, progress, unlocked } = achievement;
  const pct = Math.min(1, progress / def.target);
  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: unlocked ? 1 : 0.75,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: unlocked ? `${def.color}22` : '#1F1F1F',
        }}
      >
        <Ionicons
          name={def.icon}
          size={18}
          color={unlocked ? def.color : COLORS.subtle}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
            {def.title}
          </Text>
          {unlocked ? (
            <Ionicons name="checkmark-circle" size={14} color={def.color} />
          ) : null}
        </View>
        <Text style={{ fontSize: 12, color: COLORS.subtle, marginTop: 2 }}>
          {def.description}
        </Text>
        {!unlocked ? (
          <>
            <View
              style={{
                height: 4,
                backgroundColor: '#1F1F1F',
                borderRadius: 2,
                marginTop: 8,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${pct * 100}%`,
                  backgroundColor: def.color,
                  borderRadius: 2,
                }}
              />
            </View>
            <NumMono
              style={{
                fontSize: 10,
                color: COLORS.subtle,
                marginTop: 4,
              }}
            >
              {Math.min(progress, def.target)} / {def.target}
            </NumMono>
          </>
        ) : null}
      </View>
    </View>
  );
}
