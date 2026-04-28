import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { PressableScale } from '../../src/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import type { WorkoutSession } from '../../src/store/types';
import { COLORS } from '../../src/design/tokens';
import { ModernHeader, NavTop } from '../../src/design/components';

function formatDuration(seconds: number) {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function monthLabel(iso: string) {
  const [y, m] = iso.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function SessionsIndexScreen() {
  const router = useRouter();
  const { sessions } = useStore();
  const accent = useAccent();

  const grouped = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    const groups: { key: string; items: WorkoutSession[] }[] = [];
    for (const s of sorted) {
      const key = s.date.slice(0, 7);
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) {
        g = { key, items: [] };
        groups.push(g);
      }
      g.items.push(s);
    }
    return groups;
  }, [sessions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <NavTop onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ModernHeader
          eyebrow="Sessions"
          badge={
            sessions.length > 0
              ? `${sessions.length} logged`
              : undefined
          }
          title="Your log"
          sub={
            sessions.length === 0
              ? 'No sessions yet — finish a workout to start.'
              : `${sessions.length} session${sessions.length === 1 ? '' : 's'} on the books.`
          }
          accent={accent}
          back
          action={false}
          dropMark
        />

        {sessions.length === 0 ? (
          <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] py-10 px-6 items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
              <Ionicons name="time-outline" size={22} color="#71717A" />
            </View>
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              No sessions yet
            </Text>
            <Text className="text-zinc-500 text-sm text-center mt-1">
              Finish a workout to start building your log.
            </Text>
          </View>
        ) : (
          grouped.map((g) => (
            <View key={g.key} className="mt-6">
              <Text
                className="px-5 text-zinc-500 font-bold mb-2"
                style={{ fontSize: 11, letterSpacing: 1.5 }}
              >
                {monthLabel(`${g.key}-01`).toUpperCase()}
              </Text>
              <View className="px-5 gap-2">
                {g.items.map((s) => {
                  const setCount = s.exercises.reduce(
                    (a, e) => a + e.sets.length,
                    0,
                  );
                  return (
                    <Animated.View
                      key={s.id}
                      entering={FadeIn.duration(220)}
                      exiting={FadeOut.duration(180)}
                      layout={LinearTransition.springify().damping(18)}
                    >
                    <PressableScale
                      onPress={() => router.push(`/sessions/${s.id}`)}
                      className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl p-4 flex-row items-center gap-3"
                    >
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                      >
                        <Ionicons name="barbell" size={18} color={accent} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-white font-bold"
                          style={{ fontSize: 15 }}
                          numberOfLines={1}
                        >
                          {s.workoutName}
                        </Text>
                        <Text
                          className="text-zinc-500 mt-0.5"
                          style={{ fontSize: 12 }}
                        >
                          {s.date} · {s.exercises.length} ex · {setCount} sets ·{' '}
                          {formatDuration(s.durationSeconds)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#3F3F46"
                      />
                    </PressableScale>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
