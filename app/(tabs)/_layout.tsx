import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { bootstrapActiveWorkout } from '../../src/lib/activeWorkout';
import { ResumeWorkoutBar } from '../../src/components/ResumeWorkoutBar';

export default function TabLayout() {
  const accent = useAccent();
  const { workouts } = useStore();

  // After app launch (or a relaunch), check AsyncStorage for any
  // leftover in-progress workout so the resume bar reappears even if
  // the JS runtime was killed.
  useEffect(() => {
    bootstrapActiveWorkout(workouts);
  }, [workouts]);

  return (
    <Tabs
      tabBar={(props) => (
        <View style={{ backgroundColor: 'transparent' }}>
          <ResumeWorkoutBar />
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#52525B',
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: Platform.select({ web: 88, default: 96 }),
          paddingBottom: Platform.select({ web: 24, default: 32 }),
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: 'Program',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
