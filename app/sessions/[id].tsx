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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { MUSCLE_COLORS, type SessionSet } from '../../src/store/types';
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
  // Tapping an exercise row opens a multi-set editor for that
  // exercise. draftSets holds the in-flight values so changes aren't
  // committed until the user taps Save.
  const [editExId, setEditExId] = useState<string | null>(null);
  const [draftSets, setDraftSets] = useState<SessionSet[]>([]);

  const editingExercise = useMemo(() => {
    if (!editExId || !session) return null;
    const ex = session.exercises.find((e) => e.id === editExId);
    if (!ex) return null;
    const exDef = exercises.find((e) => e.id === ex.exerciseId);
    return { ex, exDef };
  }, [editExId, session, exercises]);

  const openEdit = (exId: string) => {
    if (!session) return;
    const ex = session.exercises.find((e) => e.id === exId);
    if (!ex) return;
    setEditExId(exId);
    setDraftSets(ex.sets.map((s) => ({ ...s })));
  };

  const closeEdit = () => setEditExId(null);

  const patchDraftSet = (idx: number, patch: Partial<SessionSet>) => {
    setDraftSets((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  };

  const deleteDraftSet = (idx: number) => {
    setDraftSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDraftSet = () => {
    setDraftSets((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
          rir: last?.rir,
          rpe: last?.rpe,
        },
      ];
    });
  };

  const handleSaveExercise = () => {
    if (!session || !editExId) return;
    // Drop zero-rep sets so the user can't save an empty placeholder.
    const cleaned = draftSets.filter((s) => s.reps > 0);
    const nextExercises = session.exercises
      .map((ex) => (ex.id === editExId ? { ...ex, sets: cleaned } : ex))
      .filter((ex) => ex.sets.length > 0);
    updateSession(session.id, { exercises: nextExercises });
    closeEdit();
  };

  const handleDeleteExercise = () => {
    if (!session || !editExId) return;
    Alert.alert(
      'Delete this exercise from the session?',
      'All of its logged sets are removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const nextExercises = session.exercises.filter(
              (ex) => ex.id !== editExId,
            );
            updateSession(session.id, { exercises: nextExercises });
            closeEdit();
          },
        },
      ],
    );
  };

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
                // Tap the card to open the multi-set editor. The
                // chevron-forward Pressable below has its own onPress
                // for navigating to exercise history, and RN's hit
                // testing routes the touch to the inner Pressable.
                <CardSm key={se.id} onPress={() => openEdit(se.id)}>
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
                      <Pressable
                        onPress={() => router.push(`/exercises/${ex.id}`)}
                        hitSlop={10}
                        style={{
                          padding: 6,
                          marginLeft: 4,
                          marginTop: -2,
                        }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={COLORS.ghost}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </CardSm>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Multi-set editor sheet for the tapped exercise */}
      <Modal
        visible={editExId !== null && editingExercise !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Pressable
            onPress={closeEdit}
            style={{ flex: 1 }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 20,
                paddingHorizontal: 20,
                paddingBottom: 32,
                maxHeight: '85%',
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.subtle,
                      fontWeight: '800',
                      letterSpacing: 1,
                    }}
                  >
                    EDIT EXERCISE
                  </Text>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 20,
                      fontWeight: '800',
                      letterSpacing: -0.2,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    {editingExercise?.exDef?.name ?? 'Exercise'}
                  </Text>
                </View>
                <Pressable
                  onPress={closeEdit}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color={COLORS.text} />
                </Pressable>
              </View>

              {/* Scrollable list of editable sets */}
              <ScrollView
                style={{ marginHorizontal: -4 }}
                contentContainerStyle={{ paddingHorizontal: 4 }}
                showsVerticalScrollIndicator={false}
              >
                {draftSets.map((s, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: COLORS.bg,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: COLORS.subtle,
                          letterSpacing: 1,
                        }}
                      >
                        SET {i + 1}
                      </Text>
                      <Pressable
                        onPress={() => deleteDraftSet(i)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#F87171"
                        />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 10,
                            color: COLORS.subtle,
                            marginBottom: 4,
                          }}
                        >
                          Weight
                        </Text>
                        <TextInput
                          value={s.weight === 0 ? '' : String(s.weight)}
                          onChangeText={(v) => {
                            const sanitized = v
                              .replace(',', '.')
                              .replace(/[^0-9.]/g, '')
                              .replace(/(\..*)\./g, '$1');
                            const n = parseFloat(sanitized);
                            patchDraftSet(i, {
                              weight: Number.isFinite(n) ? n : 0,
                            });
                          }}
                          keyboardType="decimal-pad"
                          placeholder="kg"
                          placeholderTextColor={COLORS.faint}
                          selectTextOnFocus
                          style={{
                            backgroundColor: COLORS.surface,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            borderRadius: 10,
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                            fontSize: 15,
                            fontFamily: MONO,
                            color: COLORS.text,
                            textAlign: 'center',
                            fontWeight: '700',
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 10,
                            color: COLORS.subtle,
                            marginBottom: 4,
                          }}
                        >
                          Reps
                        </Text>
                        <TextInput
                          value={s.reps === 0 ? '' : String(s.reps)}
                          onChangeText={(v) => {
                            const sanitized = v.replace(/[^0-9]/g, '');
                            const n = parseInt(sanitized, 10);
                            patchDraftSet(i, {
                              reps: Number.isFinite(n) ? n : 0,
                            });
                          }}
                          keyboardType="number-pad"
                          placeholder="reps"
                          placeholderTextColor={COLORS.faint}
                          selectTextOnFocus
                          style={{
                            backgroundColor: COLORS.surface,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            borderRadius: 10,
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                            fontSize: 15,
                            fontFamily: MONO,
                            color: COLORS.text,
                            textAlign: 'center',
                            fontWeight: '700',
                          }}
                        />
                      </View>
                      <View style={{ width: 96 }}>
                        <Text
                          style={{
                            fontSize: 10,
                            color: COLORS.subtle,
                            marginBottom: 4,
                          }}
                        >
                          RIR
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            backgroundColor: COLORS.surface,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            borderRadius: 10,
                            padding: 3,
                            justifyContent: 'space-between',
                          }}
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => {
                            const on = s.rir === n;
                            return (
                              <Pressable
                                key={n}
                                onPress={() =>
                                  patchDraftSet(i, {
                                    rir: on ? undefined : n,
                                  })
                                }
                                style={{
                                  flex: 1,
                                  alignItems: 'center',
                                  paddingVertical: 6,
                                  borderRadius: 7,
                                  backgroundColor: on
                                    ? '#60A5FA'
                                    : 'transparent',
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: on
                                      ? COLORS.onAccent
                                      : COLORS.muted,
                                  }}
                                >
                                  {n}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Add-set pill */}
                <Pressable
                  onPress={addDraftSet}
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    marginTop: 4,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}
                  >
                    + Add set
                  </Text>
                </Pressable>
              </ScrollView>

              {/* Footer */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginTop: 10,
                  alignItems: 'center',
                }}
              >
                <Pressable
                  onPress={handleDeleteExercise}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: 'rgba(248,113,113,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(248,113,113,0.3)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color="#F87171" />
                  <Text
                    style={{ color: '#F87171', fontWeight: '700', fontSize: 13 }}
                  >
                    Remove
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={closeEdit}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text
                    style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveExercise}
                  style={{
                    paddingHorizontal: 22,
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: COLORS.text,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.onAccent,
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
