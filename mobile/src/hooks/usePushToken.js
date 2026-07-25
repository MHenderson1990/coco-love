import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { updateMe } from '../api/user';

export function usePushToken() {
  let [expoPushToken, setExpoPushToken] = useState(null);
  let [error, setError] = useState(null);

  useEffect(() => {
    let register = async () => {
      if (!Device.isDevice) {
        setError('Push notifications require a physical device.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      let { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        let { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        setError('Notification permission was not granted.');
        return;
      }

      try {
        let projectId = Constants.expoConfig?.extra?.eas?.projectId;
        let { data } = await Notifications.getExpoPushTokenAsync({ projectId });
        setExpoPushToken(data);
        await updateMe({ pushToken: data });
      } catch (e) {
        setError(e.message);
      }
    };

    register();
  }, []);

  return { expoPushToken, error };
}
