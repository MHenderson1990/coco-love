import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as authApi from '../api/auth';

let AuthContext = createContext(null);

export function AuthProvider({ children }) {
  let [user, setUser] = useState(null);
  let [loading, setLoading] = useState(true);

  // on launch, restore session if a token is stored — gated behind Face ID when the device supports it
  useEffect(() => {
    async function restore() {
      try {
        let token = await AsyncStorage.getItem('token');
        if (!token) return;

        let hasHardware = await LocalAuthentication.hasHardwareAsync();
        let isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          let result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock House of Love',
          });
          if (!result.success) return; // leave the token in place, just don't restore this launch
        }

        let me = await authApi.getMe();
        setUser(me);
      } catch (err) {
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    let data = await authApi.login(email, password);
    await AsyncStorage.setItem('token', data.token);
    let me = await authApi.getMe();
    setUser(me);
  }

  async function signup(email, password, name, birthday) {
    let data = await authApi.signup(email, password, name, birthday);
    await AsyncStorage.setItem('token', data.token);
    let me = await authApi.getMe();
    setUser(me);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}