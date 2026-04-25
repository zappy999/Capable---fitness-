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
import {
  COLORS,
  MONO,
  accentAlpha,
} from '../../src/design/tokens';
import {
  Badge,
  CardSm,
  ModernHeader,
  NavTop,
  NumMono,
} from '../../src/design/components';

function formatDuration(seconds: number) {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function friendlyDate(iso: string): string {
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTH[m - 1]} ${d}`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = useAccent();
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
    let totalRestSeconds = 0; // not tracked yet; placeholder
    const avgRest = totalSets > 1 ? totalRestSeconds / (totalSets - 1) : 0;
    return { totalSets, volume, prs, avgRest };
  }, [session, personalRecords]);

  if (!session || !stats) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: COLORS.subtle }}>Session not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: '700' }}>Go back</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
      <NavTop
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={handleDelete}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#F87171" />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <ModernHeader
            eyebrow={`Session · ${friendlyDate(session.date)}`}
            badge={stats.prs.length > 0 ? `${stats.prs.length} new PR${stats.prs.length === 1 ? '' : 's'}` : undefined}
            title={session.workoutName}
            sub={`${formatDuration(session.durationSeconds)} · ${session.exercises.length} exercise${session.exercises.length === 1 ? '' : 's'} · ${stats.totalSets} sets`}
            accent={accent}
            back
            action={false}
            dropMark
          />

          {/* Stat row */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            <StatBox label="Volume" value={Math.round(stats.volume).toLocaleString()} suffix="kg" />
            <StatBox
              label="PRs"
              value={String(stats.prs.length)}
              valueColor={stats.prs.length > 0 ? accent : COLORS.text}
            />
            <StatBox label="Sets" value={String(stats.totalSets)} />
          </View>

          {/* Session note */}
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 12,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: COLORS.subtle,
                letterSpacing: 1,
              }}
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
              placeholderTextColor={COLORS.faint}
              multiline
              style={{
                marginTop: 8,
                fontSize: 14,
                minHeight: 40,
                color: COLORS.text,
              }}
            />
          </View>

          {/* Exercises */}
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {session.exercises.map((se, idx) => {
              const ex = exercises.find((e) => e.id === se.exerciseId);
              const color = ex?.category
                ? MUSCLE_COLORS[ex.category]
                : COLORS.subtle;
              const exPRs = stats.prs.filter(
                (p) => p.exerciseId === se.exerciseId,
              );
              const workingSets = se.sets;
              return (
                <CardSm
                  key={se.id}
                  onPress={() =>
                    ex ? router.push(`/exercises/${ex.id}`) : undefined
                  }
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 4,
                        alignSelf: 'stretch',
                        backgroundColor: color,
                        borderRadius: 2,
                        marginRight: 12,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <NumMono
                          style={{ fontSize: 11, color: COLORS.subtle, fontWeight: '700' }}
                        >
                          {idx + 1}.
                        </NumMono>
                        <Text
                          style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}
                        >
                          {ex?.name ?? 'Exercise'}
                        </Text>
                        {exPRs.length > 0 ? (
                          <Badge accent={accent}>
                            <Ionicons name="trophy" size={9} color={accent} />
                            {'  '}PR
                          </Badge>
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.subtle,
                          marginTop: 2,
                        }}
                      >
                        {workingSets.length} set
                        {workingSets.length === 1 ? '' : 's'}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginTop: 10,
                        }}
                      >
                        {workingSets.map((s, i) => {
                          const isPR = exPRs.some(
                            (p) => p.weight === s.weight && p.reps === s.reps,
                          );
                          return (
                            <View
                              key={i}
                              style={{
                                backgroundColor: isPR
                                  ? accentAlpha(accent, 0.133)
                                  : COLORS.bg,
                                borderWidth: 1,
                                borderColor: isPR
                                  ? accentAlpha(accent, 0.22)
                                  : COLORS.border,
                                borderRadius: 10,
                                paddingVertical: 5,
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <NumMono
                                style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}
                              >
                                {s.weight}
                                <Text style={{ color: COLORS.subtle }}> × {s.reps}</Text>
                              </NumMono>
                              {typeof s.rir === 'number' ? (
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: '#60A5FA',
                                    letterSpacing: 0.3,
                                  }}
                                >
                                  R{s.rir}
                                </Text>
                              ) : null}
                              {isPR ? (
                                <Ionicons name="trophy" size={10} color={accent} />
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                      {se.note ? (
                        <Text
                          style={{
                            color: COLORS.muted,
                            fontStyle: 'italic',
                            fontSize: 12,
                            marginTop: 10,
                          }}
                        >
                          {se.note}
                        </Text>
                      ) : null}
                    </View>
                    {ex ? (
                      <Ionicons name="chevron-forward" size={14} color={COLORS.ghost} />
                    ) : null}
                  </View>
                </CardSm>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  suffix,
  valueColor,
}: {
  label: string;
  value: string;
  suffix?: string;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 11, color: COLORS.subtle, letterSpacing: -0.1 }}>
        {label}
      </Text>
      <NumMono
        style={{
          fontSize: 18,
          fontWeight: '800',
          color: valueColor ?? COLORS.text,
          marginTop: 6,
          letterSpacing: -0.3,
        }}
      >
        {value}
        {suffix ? (
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.muted }}>
            {' '}
            {suffix}
          </Text>
        ) : null}
      </NumMono>
    </View>
  );
}
