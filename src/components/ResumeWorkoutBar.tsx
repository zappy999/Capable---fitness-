import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, MONO, accentAlpha } from '../design/tokens';
import { useAccent } from '../store/WorkoutStore';
import {
  discardActiveWorkout,
  useActiveWorkout,
} from '../lib/activeWorkout';

function formatElapsed(startedAt: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Persistent strip rendered just above the tab bar when there's a
 * paused (unfinished) workout. Tap to resume; long-press the X to
 * discard. Self-hides when there's no active workout.
 */
export function ResumeWorkoutBar() {
  const router = useRouter();
  const accent = useAccent();
  const active = useActiveWorkout();
  const [now, setNow] = useState<number>(() => Date.now());

  // Tick once a minute so the "Active · 12m" label stays roughly
  // accurate without forcing a re-render every second.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const onResume = () => {
    if (active.workoutId) {
      router.push(`/start-workout?id=${active.workoutId}`);
    } else {
      router.push('/start-workout');
    }
  };

  return (
    <Pressable
      onPress={onResume}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        marginHorizontal: 12,
        marginBottom: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: accentAlpha(accent, 0.55),
        backgroundColor: COLORS.surface,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="play" size={14} color={COLORS.onAccent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 14,
            fontWeight: '800',
            letterSpacing: -0.1,
          }}
          numberOfLines={1}
        >
          Resume {active.name}
        </Text>
        <Text style={{ color: COLORS.subtle, fontSize: 11, marginTop: 1 }}>
          <Text style={{ fontFamily: MONO, color: accent }}>
            {formatElapsed(active.startedAt, now)}
          </Text>
          <Text>  · in progress</Text>
        </Text>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          discardActiveWorkout();
        }}
        hitSlop={10}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Ionicons name="close" size={14} color={COLORS.muted} />
      </Pressable>
    </Pressable>
  );
}
