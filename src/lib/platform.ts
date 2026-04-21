import { Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

export function isSafeHttpUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function openExternalUrl(url: string): Promise<boolean> {
  if (!isSafeHttpUrl(url)) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

let handlerSet = false;
function ensureHandler() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
    }),
  });
}

let permissionStatus: 'granted' | 'denied' | 'undetermined' | 'unsupported' =
  Platform.OS === 'web' ? 'unsupported' : 'undetermined';

export async function ensureNotificationPermission() {
  if (permissionStatus === 'granted') return true;
  if (permissionStatus === 'unsupported') return false;
  ensureHandler();
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) {
      permissionStatus = 'granted';
      return true;
    }
    const req = await Notifications.requestPermissionsAsync();
    permissionStatus = req.granted ? 'granted' : 'denied';
    return req.granted;
  } catch {
    permissionStatus = 'denied';
    return false;
  }
}

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

export function haptic(kind: HapticKind = 'light') {
  if (Platform.OS === 'web') return;
  try {
    switch (kind) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
    }
  } catch {
    // ignore
  }
}

export async function scheduleRestNotification(
  secondsFromNow: number,
  body: string,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (secondsFromNow <= 0) return null;
  const ok = await ensureNotificationPermission();
  if (!ok) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest complete',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(secondsFromNow)),
      },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelNotification(id: string | null | undefined) {
  if (!id) return;
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}
