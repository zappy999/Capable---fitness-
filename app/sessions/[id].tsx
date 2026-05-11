import { useEffect, useMemo, useState } from 'react';
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
  // Tap a set chip to open the editor. `target` picks which exercise +
  // set within the session is being edited; drafts hold the in-flight
  // values so we don't dispatch until the user taps Save.
  const [editTarget, setEditTarget] = useState<
    { exId: string; setIdx: number } | null
  >(null);
  const [draftWeight, setDraftWeight] = useState('');
  const [draftReps, setDraftReps] = useState('');
  const [draftRir, setDraftRir] = useState<number | null>(null);

  const editingSet = useMemo(() => {
    if (!editTarget || !session) return null;
    const ex = session.exercises.find((e) => e.id === editTarget.exId);
    if (!ex) return null;
    const set = ex.sets[editTarget.setIdx];
    if (!set) return null;
    const exDef = exercises.find((e) => e.id === ex.exerciseId);
    return { ex, exDef, set };
  }, [editTarget, session, exercises]);

  useEffect(() => {
    if (!editingSet) return;
    setDraftWeight(String(editingSet.set.weight));
    setDraftReps(String(editingSet.set.reps));
    setDraftRir(
      typeof editingSet.set.rir === 'number' ? editingSet.set.rir : null,
    );
  }, [editingSet?.ex.id, editingSet?.set]);

  const closeEdit = () => setEditTarget(null);

  const applyEdit = (
    mutate: (sets: NonNullable<typeof session>['exercises'][number]['sets']) =>
      | NonNullable<typeof session>['exercises'][number]['sets']
      | null,
  ) => {
    if (!session || !editTarget) return;
    const nextExercises = session.exercises
      .map((ex) => {
        if (ex.id !== editTarget.exId) return ex;
        const nextSets = mutate(ex.sets);
        if (!nextSets) return ex;
        return { ...ex, sets: nextSets };
      })
      // Drop an exercise if all its sets were deleted.
      .filter((ex) => ex.sets.length > 0);
    updateSession(session.id, { exercises: nextExercises });
  };

  const handleSaveSet = () => {
    const w = parseFloat(draftWeight.replace(',', '.'));
    const r = parseInt(draftReps, 10);
    const safeWeight = Number.isFinite(w) && w >= 0 ? w : 0;
    const safeReps = Number.isFinite(r) && r >= 0 ? r : 0;
    if (safeReps === 0) {
      Alert.alert('Reps required', 'A logged set needs at least one rep.');
      return;
    }
    applyEdit((sets) =>
      sets.map((s, i) =>
        i === (editTarget?.setIdx ?? -1)
          ? {
              ...s,
              weight: safeWeight,
              reps: safeReps,
              rir: draftRir ?? undefined,
            }
          : s,
      ),
    );
    closeEdit();
  };

  const handleDeleteSet = () => {
    Alert.alert('Delete this set?', 'The set is removed from this session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          applyEdit((sets) =>
            sets.filter((_, i) => i !== (editTarget?.setIdx ?? -1)),
          );
          closeEdit();
        },
      },
    ]);
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
                // No onPress on the card itself — the chips below own
                // their own tap area so editing a logged set works. The
                // chevron at the right is the discrete "view exercise"
                // affordance.
                <CardSm key={se.id}>
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
                            <Pressable
                              key={i}
                              onPress={() =>
                                setEditTarget({ exId: se.id, setIdx: i })
                              }
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
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
                              })}
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
                            </Pressable>
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

      {/* Edit-set sheet */}
      <Modal
        visible={editTarget !== null && editingSet !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}
      >
        <Pressable
          onPress={closeEdit}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: COLORS.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 20,
                paddingBottom: 32,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 18,
                    fontWeight: '800',
                    letterSpacing: -0.2,
                  }}
                >
                  Edit set {(editTarget?.setIdx ?? 0) + 1}
                  {editingSet?.exDef ? ` · ${editingSet.exDef.name}` : ''}
                </Text>
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

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: COLORS.subtle,
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    WEIGHT
                  </Text>
                  <TextInput
                    value={draftWeight}
                    onChangeText={(v) =>
                      setDraftWeight(
                        v
                          .replace(',', '.')
                          .replace(/[^0-9.]/g, '')
                          .replace(/(\..*)\./g, '$1'),
                      )
                    }
                    keyboardType="decimal-pad"
                    placeholder="kg"
                    placeholderTextColor={COLORS.faint}
                    selectTextOnFocus
                    style={{
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      fontSize: 16,
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
                      fontSize: 11,
                      fontWeight: '800',
                      color: COLORS.subtle,
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    REPS
                  </Text>
                  <TextInput
                    value={draftReps}
                    onChangeText={(v) =>
                      setDraftReps(v.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    placeholder="reps"
                    placeholderTextColor={COLORS.faint}
                    selectTextOnFocus
                    style={{
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      fontSize: 16,
                      fontFamily: MONO,
                      color: COLORS.text,
                      textAlign: 'center',
                      fontWeight: '700',
                    }}
                  />
                </View>
              </View>

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: COLORS.subtle,
                  letterSpacing: 1,
                  marginTop: 16,
                  marginBottom: 6,
                }}
              >
                RIR · REPS IN RESERVE
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[0, 1, 2, 3, 4, 5].map((n) => {
                  const on = draftRir === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setDraftRir(on ? null : n)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 12,
                        backgroundColor: on
                          ? accent
                          : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: on
                          ? accent
                          : 'rgba(255,255,255,0.08)',
                        minWidth: 44,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: on ? COLORS.onAccent : COLORS.text,
                          fontWeight: '800',
                          fontSize: 13,
                        }}
                      >
                        {n === 5 ? '5+' : n}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setDraftRir(null)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text
                    style={{ color: COLORS.muted, fontWeight: '700', fontSize: 13 }}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginTop: 22,
                }}
              >
                <Pressable
                  onPress={handleDeleteSet}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: 'rgba(248,113,113,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(248,113,113,0.3)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color="#F87171" />
                  <Text
                    style={{ color: '#F87171', fontWeight: '700', fontSize: 14 }}
                  >
                    Delete
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={closeEdit}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text
                    style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveSet}
                  style={{
                    paddingHorizontal: 22,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: COLORS.text,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.onAccent,
                      fontWeight: '800',
                      fontSize: 14,
                    }}
                  >
                    Save
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
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
