import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(n);
}

export default function PRsIndexScreen() {
  const router = useRouter();
  const { personalRecords, exercises } = useStore();
  const LIME = useAccent();

  const rows = useMemo(
    () =>
      [...personalRecords]
        .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
        .map((pr) => ({
          pr,
          name: exercises.find((e) => e.id === pr.exerciseId)?.name ?? 'Exercise',
        })),
    [personalRecords, exercises],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
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
            PERSONAL RECORDS
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
            PRs
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            {rows.length} record{rows.length === 1 ? '' : 's'}, most recent
            first.
          </Text>
        </View>

        {rows.length === 0 ? (
          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] py-10 px-6 items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
              <Ionicons name="trophy-outline" size={22} color="#71717A" />
            </View>
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              No PRs yet
            </Text>
            <Text className="text-zinc-500 text-sm text-center mt-1">
              Log a heavier set or a higher-volume set to earn your first PR.
            </Text>
          </View>
        ) : (
          <View className="px-5 mt-5 gap-2">
            {rows.map(({ pr, name }) => (
              <Pressable
                key={pr.id}
                onPress={() => router.push(`/sessions/${pr.sessionId}`)}
                className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 flex-row items-center gap-3 active:opacity-80"
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${LIME}22` }}
                >
                  <Ionicons name="trophy" size={18} color={LIME} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: 15 }}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text
                    className="text-zinc-500 mt-0.5"
                    style={{ fontSize: 12 }}
                  >
                    {pr.kind === 'heaviest_weight'
                      ? `Heaviest · ${formatNum(pr.weight)}kg × ${pr.reps}`
                      : `Best volume · ${formatNum(pr.weight)}kg × ${pr.reps}`}{' '}
                    · {pr.achievedAt}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
