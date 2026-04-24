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
  const LIME = useAccent();

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
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center">
        <PressableScale
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </PressableScale>
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
            SESSIONS
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
            Your log
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            {sessions.length} logged
            {sessions.length === 1 ? ' session' : ' sessions'}.
          </Text>
        </View>

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
                        <Ionicons name="barbell" size={18} color={LIME} />
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
