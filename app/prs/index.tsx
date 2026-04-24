import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { COLORS, MONO, muscleColor } from '../../src/design/tokens';
import { ModernHeader, NumMono, Badge, CardSm, NavTop } from '../../src/design/components';

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function friendlyISO(iso: string): string {
  if (!iso) return '';
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTH[m - 1]} ${d}`;
}

export default function PRsIndexScreen() {
  const router = useRouter();
  const { personalRecords, exercises } = useStore();
  const accent = useAccent();

  const rows = useMemo(
    () =>
      [...personalRecords]
        .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
        .map((pr) => {
          const ex = exercises.find((e) => e.id === pr.exerciseId);
          return {
            pr,
            name: ex?.name ?? 'Exercise',
            muscle: ex?.category ?? null,
          };
        }),
    [personalRecords, exercises],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <NavTop onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ModernHeader
          eyebrow="Personal records"
          badge={rows.length > 0 ? `${rows.length} total` : undefined}
          title="PRs"
          sub="Most recent first."
          accent={accent}
          back
          action={false}
          dropMark
        />

        {rows.length === 0 ? (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 24,
              paddingVertical: 40,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#1F1F1F',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name="trophy-outline" size={22} color={COLORS.subtle} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
              No PRs yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: COLORS.subtle,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Log a heavier set or a higher-volume set to earn your first PR.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {rows.map(({ pr, name, muscle }, i) => {
              const color = muscleColor(muscle);
              const est1rm = pr.weight * (1 + pr.reps / 30);
              return (
                <CardSm
                  key={pr.id}
                  onPress={() => router.push(`/sessions/${pr.sessionId}`)}
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
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: muscle ? `${color}22` : '#1F1F1F',
                      borderWidth: 1,
                      borderColor: muscle ? `${color}44` : COLORS.border,
                    }}
                  >
                    <Ionicons name="trophy" size={18} color={color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      {i === 0 ? (
                        <Badge accent={accent}>NEW</Badge>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2 }}>
                      {pr.kind === 'heaviest_weight' ? 'Heaviest' : 'Best volume'} ·{' '}
                      <Text style={{ fontFamily: MONO }}>{formatNum(pr.weight)}</Text>
                      kg ×{' '}
                      <Text style={{ fontFamily: MONO }}>{pr.reps}</Text>
                      {' · '}
                      {friendlyISO(pr.achievedAt)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: COLORS.subtle,
                        fontWeight: '700',
                        letterSpacing: 0.5,
                      }}
                    >
                      1RM
                    </Text>
                    <NumMono
                      style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}
                    >
                      {Math.round(est1rm)}
                    </NumMono>
                  </View>
                </CardSm>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
