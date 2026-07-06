import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { devicesAPI } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and registers this device's Expo push token with the
 * backend. Best-effort and silent on failure — called after login, should
 * never block or surface an error to the user.
 *
 * Known limitations (see mobile/README or project memory for detail):
 * - Requires a real device (Notifications.getExpoPushTokenAsync throws on
 *   simulators/emulators).
 * - Requires an EAS projectId (Constants.expoConfig.extra.eas.projectId),
 *   set up as part of the EAS Build milestone — until then this silently
 *   no-ops instead of registering a token.
 * - Android: Expo Go cannot receive remote push at all since SDK 53 — a
 *   development build is required there. iOS Expo Go works for testing.
 */
export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return; // No EAS project configured yet.

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await devicesAPI.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
  } catch {
    // Push registration is best-effort — never block app usage on it.
  }
}
