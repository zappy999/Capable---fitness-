import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WORKOUTS as DEMO_WORKOUTS } from '../../src/data/workouts';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { isSafeHttpUrl, openExternalUrl } from '../../src/lib/platform';
import { COLORS, MONO, muscleColor } from '../../src/design/tokens';
import {
  Badge,
  CardSm,
  ModernHeader,
  NavTop,
  NumMono,
} from '../../src/design/components';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { workouts, exercises, deleteWorkout } = useStore();
  const accent = useAccent();

  const userWorkout = workouts.find((w) => w.id === id);
  const demoWorkout = DEMO_WORKOUTS.find((w) => w.id === id);

  if (!userWorkout && !demoWorkout) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: COLORS.subtle }}>Workout not found</Text>
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
    if (!userWorkout) return;
    Alert.alert(
      `Delete "${userWorkout.name}"?`,
      'This removes the workout from any program that includes it. Logged sessions stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(userWorkout.id);
            router.back();
          },
        },
      ],
    );
  };

  // Derive a rough set/exercise/rest summary for the header sub-line
  const exerciseList = userWorkout
    ? userWorkout.exercises
    : demoWorkout?.exercises ?? [];
  const totalSets = userWorkout
    ? userWorkout.exercises.reduce((a, we) => a + (we.sets ?? 0), 0)
    : demoWorkout?.exercises.reduce((a, e) => a + (e.sets ?? 0), 0) ?? 0;

  const subLine = userWorkout
    ? `${userWorkout.exercises.length} exercise${userWorkout.exercises.length === 1 ? '' : 's'} · ${totalSets} sets`
    : demoWorkout
      ? `${demoWorkout.duration}m · ${demoWorkout.exercises.length} exercises · ${demoWorkout.difficulty}`
      : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
      <NavTop
        onBack={() => router.back()}
        right={
          userWorkout ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/workouts/new',
                    params: { id: userWorkout.id },
                  })
                }
                style={{
                  paddingHorizontal: 12,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="create-outline" size={14} color={COLORS.text} />
                <Text
                  style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}
                >
                  Edit
                </Text>
              </Pressable>
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
            </View>
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ModernHeader
          eyebrow={demoWorkout ? demoWorkout.category : 'Workout'}
          badge={
            userWorkout
              ? undefined
              : demoWorkout
                ? demoWorkout.difficulty
                : undefined
          }
          title={userWorkout?.name ?? demoWorkout?.name ?? 'Workout'}
          sub={subLine}
          accent={accent}
          back
          action={false}
          dropMark
        />

        {/* Exercises header */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 10,
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
            Exercises
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {userWorkout
            ? userWorkout.exercises.map((we, idx) => {
                const ex = exercises.find((e) => e.id === we.exerciseId);
                const hasBadges =
                  we.tempo ||
                  we.isDropSet ||
                  we.groupType ||
                  (we.demoUrl && isSafeHttpUrl(we.demoUrl));
                return (
                  <CardSm
                    key={we.id}
                    muscle={ex?.category ?? undefined}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: COLORS.bg,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <NumMono
                          style={{
                            color: COLORS.muted,
                            fontSize: 13,
                            fontWeight: '800',
                          }}
                        >
                          {idx + 1}
                        </NumMono>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: COLORS.text,
                          }}
                          numberOfLines={1}
                        >
                          {ex?.name ?? 'Exercise'}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: COLORS.subtle,
                            marginTop: 2,
                          }}
                        >
                          {ex?.category ?? 'Uncategorized'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <NumMono
                          style={{
                            color: COLORS.text,
                            fontSize: 14,
                            fontWeight: '700',
                          }}
                        >
                          {we.sets} × {we.reps}
                        </NumMono>
                        <Text
                          style={{
                            fontSize: 10,
                            color: COLORS.subtle,
                            marginTop: 2,
                          }}
                        >
                          rest {we.restSeconds}s
                        </Text>
                      </View>
                    </View>
                    {hasBadges ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginTop: 10,
                          marginLeft: 48,
                        }}
                      >
                        {we.tempo ? (
                          <Badge accent={accent} variant="muted">
                            tempo {we.tempo}
                          </Badge>
                        ) : null}
                        {we.isDropSet ? (
                          <Badge accent={accent} variant="yellow">
                            DROP SET
                          </Badge>
                        ) : null}
                        {we.groupType ? (
                          <Badge accent={accent}>
                            {we.groupType === 'emom'
                              ? `EMOM ${we.emomSeconds ?? ''}s`.trim()
                              : we.groupType.toUpperCase()}
                            {we.supersetGroup ? ` · ${we.supersetGroup}` : ''}
                          </Badge>
                        ) : null}
                        {we.demoUrl && isSafeHttpUrl(we.demoUrl) ? (
                          <Pressable
                            onPress={() => openExternalUrl(we.demoUrl!)}
                          >
                            <Badge accent={accent} variant="blue">
                              Demo ▸
                            </Badge>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                    {we.note ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.subtle,
                          fontStyle: 'italic',
                          marginTop: 8,
                          marginLeft: 48,
                        }}
                      >
                        {we.note}
                      </Text>
                    ) : null}
                  </CardSm>
                );
              })
            : demoWorkout?.exercises.map((ex, idx) => (
                <CardSm
                  key={ex.id}
                  muscle={ex.muscle}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <NumMono
                      style={{
                        color: COLORS.muted,
                        fontSize: 13,
                        fontWeight: '800',
                      }}
                    >
                      {idx + 1}
                    </NumMono>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: COLORS.text,
                      }}
                      numberOfLines={1}
                    >
                      {ex.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 6,
                        marginTop: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text style={{ fontSize: 11, color: COLORS.subtle }}>
                        {ex.muscle}
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.ghost }}>·</Text>
                      <Text style={{ fontSize: 11, color: COLORS.subtle }}>
                        {ex.equipment}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <NumMono
                      style={{
                        color: COLORS.text,
                        fontSize: 14,
                        fontWeight: '700',
                      }}
                    >
                      {ex.sets} × {ex.reps}
                    </NumMono>
                    <Text
                      style={{
                        fontSize: 10,
                        color: COLORS.subtle,
                        marginTop: 2,
                      }}
                    >
                      rest {ex.rest}
                    </Text>
                  </View>
                </CardSm>
              ))}
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/start-workout',
              params: { id: userWorkout?.id ?? demoWorkout?.id ?? id },
            })
          }
          style={{
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: COLORS.text,
          }}
        >
          <Ionicons name="play" size={18} color={COLORS.onAccent} />
          <Text
            style={{
              color: COLORS.onAccent,
              fontSize: 15,
              fontWeight: '800',
            }}
          >
            Start workout
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
