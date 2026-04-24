import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import {
  EXERCISE_CATEGORIES,
  MUSCLE_COLORS,
  type WorkoutSession,
} from '../../src/store/types';
import { LineChart, type ChartPoint } from '../../src/components/LineChart';
import {
  COLORS,
  MONO,
  accentAlpha,
  muscleColor,
} from '../../src/design/tokens';
import {
  Badge,
  CardSm,
  ModernHeader,
  NavTop,
  NumMono,
} from '../../src/design/components';

type ChartMode = 'Best Weight' | 'Volume' | 'Est. 1RM';
const CHART_MODES: ChartMode[] = ['Best Weight', 'Volume', 'Est. 1RM'];

function estimate1RM(weight: number, reps: number) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function friendlyDate(iso: string): string {
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return iso;
  const [, m, d] = parts.map(Number);
  const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTH[m - 1]} ${d}`;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = useAccent();
  const {
    exercises,
    sessions,
    settings,
    updateExerciseCategory,
    mergeExercise,
    deleteExercise,
  } = useStore();

  const exercise = exercises.find((e) => e.id === id);

  const exerciseSessions = useMemo<WorkoutSession[]>(() => {
    if (!exercise) return [];
    return sessions
      .filter((s) => s.exercises.some((se) => se.exerciseId === exercise.id))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, exercise?.id]);

  const allSets = useMemo(() => {
    if (!exercise) return [] as { weight: number; reps: number; date: string }[];
    const out: { weight: number; reps: number; date: string }[] = [];
    for (const s of exerciseSessions) {
      for (const se of s.exercises) {
        if (se.exerciseId !== exercise.id) continue;
        for (const st of se.sets) out.push({ ...st, date: s.date });
      }
    }
    return out;
  }, [exerciseSessions, exercise?.id]);

  const bestSet = useMemo(() => {
    const valid = allSets.filter((s) => s.reps > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, s) => (s.weight > best.weight ? s : best));
  }, [allSets]);

  const [calcWeight, setCalcWeight] = useState<string>(
    bestSet ? String(bestSet.weight) : '',
  );
  const [calcReps, setCalcReps] = useState<string>(
    bestSet ? String(Math.max(1, bestSet.reps)) : '',
  );
  const [chartMode, setChartMode] = useState<ChartMode>('Best Weight');
  const [mergePickerOpen, setMergePickerOpen] = useState(false);

  const estimated = useMemo(() => {
    const w = Number(calcWeight) || 0;
    const r = Number(calcReps) || 0;
    return estimate1RM(w, r);
  }, [calcWeight, calcReps]);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!exercise) return [];
    return exerciseSessions.map((s) => {
      const setsForEx = s.exercises
        .filter((se) => se.exerciseId === exercise.id)
        .flatMap((se) => se.sets)
        .filter((x) => x.reps > 0);
      let value = 0;
      if (chartMode === 'Best Weight') {
        value = Math.max(0, ...setsForEx.map((x) => x.weight));
      } else if (chartMode === 'Volume') {
        value = setsForEx.reduce((a, x) => a + x.weight * x.reps, 0);
      } else {
        value = Math.max(
          0,
          ...setsForEx.map((x) => estimate1RM(x.weight, x.reps)),
        );
      }
      return { label: s.date.slice(5), value: Math.round(value * 10) / 10 };
    });
  }, [exerciseSessions, chartMode, exercise?.id]);

  if (!exercise) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: COLORS.subtle }}>Exercise not found</Text>
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

  const totalSets = allSets.length;
  const sessionsCount = exerciseSessions.length;
  const mainMuscle = exercise.category;
  const muscleHex = muscleColor(mainMuscle);

  const percentages = [70, 75, 80, 85];

  const mergeCandidates = exercises.filter((e) => e.id !== exercise.id);

  const handleDelete = () => {
    deleteExercise(exercise.id);
    router.back();
  };

  const estimatedRounded = estimated > 0 ? Math.round(estimated * 10) / 10 : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
      <NavTop
        onBack={() => router.back()}
        right={
          mainMuscle ? (
            <Text
              style={{
                fontSize: 11,
                color: COLORS.subtle,
                letterSpacing: 1,
                fontWeight: '700',
                textTransform: 'uppercase',
              }}
            >
              {mainMuscle}
            </Text>
          ) : exercise.isCustom ? (
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
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Title card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
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
            }}
          >
            EXERCISE DETAIL
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
            }}
          >
            {mainMuscle ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: muscleHex,
                }}
              />
            ) : null}
            <Text
              style={{
                fontSize: 30,
                fontWeight: '800',
                letterSpacing: -0.6,
                color: COLORS.text,
              }}
            >
              {exercise.name}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: COLORS.subtle, marginTop: 6 }}>
            {sessionsCount} session{sessionsCount === 1 ? '' : 's'} · {totalSets}{' '}
            sets tracked
          </Text>
        </View>

        {/* Stat row */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 12 }}>
          <MiniStat
            label="Best set"
            value={bestSet ? String(bestSet.weight) : '—'}
            suffix={bestSet ? `× ${bestSet.reps}` : undefined}
          />
          <MiniStat
            label="Est. 1RM"
            value={bestSet ? String(Math.round(estimate1RM(bestSet.weight, bestSet.reps))) : '—'}
            suffix="kg"
            valueColor={accent}
          />
          <MiniStat
            label="Sessions"
            value={String(sessionsCount)}
          />
        </View>

        {/* Progression chart */}
        {chartData.length > 0 ? (
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {CHART_MODES.map((m) => {
                const active = m === chartMode;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setChartMode(m)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: active ? accent : COLORS.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? accent : COLORS.muted,
                      }}
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <LineChart
              data={chartData}
              color={accent}
              yLabel={
                chartMode === 'Volume'
                  ? 'Volume (kg)'
                  : chartMode === 'Est. 1RM'
                    ? 'Estimated 1RM (kg)'
                    : 'Best Weight (kg)'
              }
            />
          </View>
        ) : null}

        {/* 1RM calculator */}
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
              1RM Calculator
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: COLORS.subtle,
                letterSpacing: 1,
              }}
            >
              EPLEY
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <CalcField label="WEIGHT" value={calcWeight} onChange={setCalcWeight} />
            <CalcField label="REPS" value={calcReps} onChange={setCalcReps} numeric />
          </View>

          <View
            style={{
              backgroundColor: COLORS.bg,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: COLORS.subtle,
                  letterSpacing: 1,
                }}
              >
                ESTIMATED 1RM
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2 }}>
                From your best set
              </Text>
            </View>
            <NumMono
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: accent,
                letterSpacing: -0.5,
              }}
            >
              {estimatedRounded != null ? `${estimatedRounded}kg` : '—'}
            </NumMono>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 6,
              marginTop: 12,
            }}
          >
            {percentages.map((p) => (
              <View
                key={p}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.bg,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: COLORS.subtle,
                    fontWeight: '700',
                  }}
                >
                  {p}%
                </Text>
                <NumMono
                  style={{ fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 2 }}
                >
                  {estimatedRounded != null
                    ? roundWeight((estimatedRounded * p) / 100, settings.weightIncrementKg)
                    : '—'}
                </NumMono>
              </View>
            ))}
          </View>
        </View>

        {/* Manage */}
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
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
            Manage
          </Text>

          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: COLORS.subtle,
              letterSpacing: 1,
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            MUSCLE GROUP
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pressable
              onPress={() => updateExerciseCategory(exercise.id, null)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: exercise.category === null ? accent : COLORS.bg,
                borderWidth: 1,
                borderColor: exercise.category === null ? accent : COLORS.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: exercise.category === null ? COLORS.onAccent : COLORS.text,
                }}
              >
                None
              </Text>
            </Pressable>
            {EXERCISE_CATEGORIES.map((c) => {
              const active = c === exercise.category;
              const color = MUSCLE_COLORS[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => updateExerciseCategory(exercise.id, c)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? accent : COLORS.bg,
                    borderWidth: 1,
                    borderColor: active ? accent : COLORS.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: color,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? COLORS.onAccent : COLORS.text,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: COLORS.subtle,
              letterSpacing: 1,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            MERGE WITH ANOTHER EXERCISE
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.subtle, marginBottom: 12 }}>
            Same exercise under a different name? Move all logged sets from another
            exercise into this one.
          </Text>
          <Pressable
            onPress={() => setMergePickerOpen(true)}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: COLORS.bg,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}>
              Pick exercise to merge in…
            </Text>
          </Pressable>

          {exercise.isCustom ? (
            <Pressable
              onPress={handleDelete}
              style={{
                alignSelf: 'flex-start',
                marginTop: 14,
                backgroundColor: 'rgba(248,113,113,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(248,113,113,0.3)',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#F87171" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#F87171' }}>
                Delete custom exercise
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* History */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.text,
              letterSpacing: -0.2,
            }}
          >
            History
          </Text>
        </View>
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {[...exerciseSessions].reverse().map((s) => {
            const setsForEx = s.exercises
              .filter((se) => se.exerciseId === exercise.id)
              .flatMap((se) => se.sets);
            const best = setsForEx.reduce(
              (a, b) => (b.weight > a ? b.weight : a),
              0,
            );
            return (
              <CardSm key={s.id}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                      {friendlyDate(s.date)}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2 }}>
                      {s.workoutName}
                      {s.durationSeconds > 0
                        ? ` · ${formatDuration(s.durationSeconds)}`
                        : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.subtle }}>
                    {setsForEx.length} set{setsForEx.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {setsForEx.map((st, i) => {
                    const isTop = st.weight === best && best > 0;
                    return (
                      <View
                        key={i}
                        style={{
                          backgroundColor: isTop
                            ? accentAlpha(accent, 0.133)
                            : COLORS.bg,
                          borderWidth: 1,
                          borderColor: isTop
                            ? accentAlpha(accent, 0.22)
                            : COLORS.border,
                          borderRadius: 10,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                        }}
                      >
                        <NumMono
                          style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}
                        >
                          {st.weight}
                          <Text style={{ color: COLORS.subtle }}> × {st.reps}</Text>
                        </NumMono>
                      </View>
                    );
                  })}
                </View>
              </CardSm>
            );
          })}
          {exerciseSessions.length === 0 ? (
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 24,
                paddingVertical: 32,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}
            >
              <Ionicons name="time-outline" size={22} color={COLORS.subtle} />
              <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: COLORS.text }}>
                No history yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.subtle,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Log a session containing this exercise to see it here.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={mergePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMergePickerOpen(false)}
      >
        <Pressable
          onPress={() => setMergePickerOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: COLORS.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '80%',
            }}
          >
            <View
              style={{
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                Merge into {exercise.name}
              </Text>
              <Pressable
                onPress={() => setMergePickerOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={COLORS.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              {mergeCandidates.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    mergeExercise(e.id, exercise.id);
                    setMergePickerOpen(false);
                  }}
                  style={{
                    backgroundColor: COLORS.bg,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                      {e.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2 }}>
                      {e.category ?? 'Uncategorized'}
                      {e.isCustom ? ' · Custom' : ''}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.subtle} />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function CalcField({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: COLORS.subtle,
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'number-pad' : 'decimal-pad'}
        placeholder="0"
        placeholderTextColor={COLORS.faint}
        style={{
          backgroundColor: COLORS.bg,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 20,
          fontWeight: '800',
          color: COLORS.text,
          fontFamily: MONO,
        }}
      />
    </View>
  );
}

function MiniStat({
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

function roundWeight(v: number, increment: number) {
  if (!Number.isFinite(increment) || increment <= 0) return String(Math.round(v));
  const rounded = Math.round(v / increment) * increment;
  return String(Math.round(rounded * 100) / 100).replace(/\.0+$/, '');
}
