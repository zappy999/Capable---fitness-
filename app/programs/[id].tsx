import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { COLORS, accentAlpha } from '../../src/design/tokens';
import {
  Badge,
  CardSm,
  ModernHeader,
  NavTop,
  NumMono,
} from '../../src/design/components';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { programs, workouts, setActiveProgram, deleteProgram } = useStore();
  const accent = useAccent();

  const program = programs.find((p) => p.id === id);

  if (!program) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: COLORS.subtle }}>Program not found</Text>
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

  const programWorkouts = program.workoutIds
    .map((wid) => workouts.find((w) => w.id === wid))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const handleDelete = () => {
    deleteProgram(program.id);
    router.back();
  };

  const attributeChips: { label: string }[] = [];
  if (program.phase) attributeChips.push({ label: program.phase });
  if (program.durationWeeks)
    attributeChips.push({ label: `${program.durationWeeks}w block` });
  if (program.restDays != null)
    attributeChips.push({ label: `${program.restDays} rest/wk` });
  if (program.intensityCycle && program.intensityCycle.length > 0)
    attributeChips.push({
      label: `${program.intensityCycle.join(' · ')}%`,
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
      <NavTop
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/programs/new',
                  params: { id: program.id },
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
              <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>
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
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ModernHeader
          eyebrow="Program"
          badge={program.isActive ? 'ACTIVE' : undefined}
          title={program.name}
          sub={[
            `${programWorkouts.length} workout${programWorkouts.length === 1 ? '' : 's'}`,
            program.startDate ? `from ${program.startDate}` : null,
            program.endDate ? `to ${program.endDate}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          accent={accent}
          back
          action={false}
          dropMark
        />

        {/* Active / meta card */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderWidth: program.isActive ? 1.5 : 1,
              borderColor: program.isActive
                ? accentAlpha(accent, 0.55)
                : COLORS.border,
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: attributeChips.length > 0 ? 14 : 0,
              }}
            >
              {program.isActive ? (
                <Badge accent={accent}>ACTIVE</Badge>
              ) : null}
              {program.isCustom ? (
                <Badge accent={accent} variant="yellow">
                  CUSTOM
                </Badge>
              ) : (
                <Badge accent={accent} variant="blue">
                  PRESET
                </Badge>
              )}
              {attributeChips.map((c) => (
                <Badge key={c.label} accent={accent} variant="muted">
                  {c.label}
                </Badge>
              ))}
            </View>
            <Pressable
              onPress={() =>
                setActiveProgram(program.isActive ? null : program.id)
              }
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: program.isActive
                  ? 'rgba(255,255,255,0.05)'
                  : COLORS.text,
                borderWidth: 1,
                borderColor: program.isActive
                  ? 'rgba(255,255,255,0.1)'
                  : 'transparent',
              }}
            >
              <Text
                style={{
                  color: program.isActive ? COLORS.text : COLORS.onAccent,
                  fontWeight: '700',
                  fontSize: 13,
                  letterSpacing: -0.1,
                }}
              >
                {program.isActive ? 'Unset active' : 'Set active'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 20,
            marginTop: 12,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            Workouts
          </Text>
          <Pressable
            onPress={() => router.push('/workouts/new')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>
              + New workout
            </Text>
          </Pressable>
        </View>

        {programWorkouts.length === 0 ? (
          <View
            style={{
              marginHorizontal: 20,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 24,
              paddingVertical: 32,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}
          >
            <Ionicons name="barbell-outline" size={22} color={COLORS.subtle} />
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                fontWeight: '700',
                color: COLORS.text,
              }}
            >
              No workouts in this program
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: COLORS.subtle,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Edit this program to add workouts.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {programWorkouts.map((w, idx) => (
              <CardSm
                key={w.id}
                onPress={() => router.push(`/workouts/${w.id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: COLORS.bg,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NumMono
                    style={{ color: accent, fontSize: 15, fontWeight: '800' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </NumMono>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: COLORS.text,
                    }}
                  >
                    {w.name}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2 }}
                  >
                    {w.exercises.length} exercise
                    {w.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.ghost} />
              </CardSm>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
