import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { updateMe } from '../api/user';

export function usePushToken(user) {
  let [expoPushToken, setExpoPushToken] = useState(null);
  let [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return; // wait until the user is logged in (so updateMe has an auth token)

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
        console.log('PUSH projectId:', projectId);
        let { data } = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('PUSH token:', data);
        setExpoPushToken(data);
        let result = await updateMe({ pushToken: data });
        console.log('PUSH SAVE RESULT:', JSON.stringify(result));
      } catch (e) {
        console.log('PUSH TOKEN ERROR:', e.message);
        setError(e.message);
      }
    };

    register();
  }, [user]);

  return { expoPushToken, error };
}
