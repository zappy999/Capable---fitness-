import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { MUSCLE_COLORS } from '../../src/store/types';

function formatDuration(seconds: number) {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const LIME = useAccent();
  const {
    sessions,
    exercises,
    personalRecords,
    deleteSession,
    updateSession,
  } = useStore();

  const session = sessions.find((s) => s.id === id);

  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!session) return null;
    const totalSets = session.exercises.reduce(
      (a, e) => a + e.sets.length,
      0,
    );
    const volume = session.exercises.reduce(
      (a, e) => a + e.sets.reduce((sa, s) => sa + s.weight * s.reps, 0),
      0,
    );
    const prs = personalRecords.filter((p) => p.sessionId === session.id);
    return { totalSets, volume, prs };
  }, [session, personalRecords]);

  if (!session || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0D0D] items-center justify-center">
        <Text className="text-zinc-500">Session not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10"
        >
          <Text className="text-white font-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete session?', 'This removes the session and its PRs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          router.back();
        },
      },
    ]);
  };

  const displayNote = noteDraft !== null ? noteDraft : session.notes ?? '';

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
          onPress={handleDelete}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="trash-outline" size={16} color="#F87171" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
            <Text
              className="font-bold text-black/70"
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              SESSION · {session.date}
            </Text>
            <Text className="text-black font-bold mt-2" style={{ fontSize: 30 }}>
              {session.workoutName}
            </Text>
            <View className="flex-row gap-4 mt-2">
              <Text className="text-black/70 text-sm font-semibold">
                {formatDuration(session.durationSeconds)}
              </Text>
              <Text className="text-black/70 text-sm font-semibold">
                {session.exercises.length} exercise
                {session.exercises.length === 1 ? '' : 's'}
              </Text>
              <Text className="text-black/70 text-sm font-semibold">
                {stats.totalSets} sets
              </Text>
            </View>
          </View>

          <View className="mx-5 mt-4 flex-row gap-3">
            <StatBox label="Volume" value={`${Math.round(stats.volume)}kg`} />
            <StatBox label="PRs" value={String(stats.prs.length)} />
            <StatBox
              label="Sets"
              value={`${stats.totalSets}`}
            />
          </View>

          <View className="mx-5 mt-4 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
            <Text
              className="text-zinc-500 font-bold"
              style={{ fontSize: 11, letterSpacing: 1 }}
            >
              SESSION NOTE
            </Text>
            <TextInput
              value={displayNote}
              onChangeText={setNoteDraft}
              onBlur={() => {
                if (noteDraft === null) return;
                const trimmed = noteDraft.trim();
                if ((session.notes ?? '') === trimmed) {
                  setNoteDraft(null);
                  return;
                }
                updateSession(session.id, {
                  notes: trimmed.length > 0 ? trimmed : undefined,
                });
                setNoteDraft(null);
              }}
              placeholder="Tap to add a note"
              placeholderTextColor="#52525B"
              multiline
              className="mt-2 text-white"
              style={{ fontSize: 14, minHeight: 40 }}
            />
          </View>

          <View className="mx-5 mt-4 gap-3">
            {session.exercises.map((se, idx) => {
              const ex = exercises.find((e) => e.id === se.exerciseId);
              const color = ex?.category
                ? MUSCLE_COLORS[ex.category]
                : '#71717A';
              const exPRs = stats.prs.filter(
                (p) => p.exerciseId === se.exerciseId,
              );
              return (
                <Pressable
                  key={se.id}
                  onPress={() =>
                    ex ? router.push(`/exercises/${ex.id}`) : undefined
                  }
                  className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 active:opacity-80"
                >
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: color, width: 6, height: 24, borderRadius: 3, marginRight: 10 }}
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="text-zinc-500"
                          style={{ fontSize: 11 }}
                        >
                          {idx + 1}.
                        </Text>
                        <Text
                          className="text-white font-bold"
                          style={{ fontSize: 16 }}
                        >
                          {ex?.name ?? 'Exercise'}
                        </Text>
                        {exPRs.length > 0 ? (
                          <View
                            className="px-1.5 py-0.5 rounded-full flex-row items-center"
                            style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                          >
                            <Ionicons name="trophy" size={10} color={LIME} />
                            <Text
                              className="font-bold ml-1"
                              style={{ color: LIME, fontSize: 10, letterSpacing: 0.5 }}
                            >
                              PR
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-zinc-500 text-xs mt-0.5">
                        {se.sets.length} set{se.sets.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    {ex ? (
                      <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
                    ) : null}
                  </View>
                  <View className="flex-row flex-wrap gap-1.5 mt-3 ml-4">
                    {se.sets.map((s, i) => (
                      <View
                        key={i}
                        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 py-1.5"
                      >
                        <Text className="text-white text-sm font-semibold">
                          {s.weight} × {s.reps}
                        </Text>
                        {s.rpe != null || s.rir != null ? (
                          <Text className="text-zinc-500 text-[10px] mt-0.5">
                            {s.rpe != null ? `RPE ${s.rpe}` : ''}
                            {s.rpe != null && s.rir != null ? ' · ' : ''}
                            {s.rir != null ? `RIR ${s.rir}` : ''}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                  {se.note ? (
                    <Text className="text-zinc-400 italic text-xs mt-3 ml-4">
                      {se.note}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
      <Text className="text-zinc-500 text-xs">{label}</Text>
      <Text className="text-white font-bold mt-1" style={{ fontSize: 20 }}>
        {value}
      </Text>
    </View>
  );
}
