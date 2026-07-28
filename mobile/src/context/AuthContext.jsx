import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as authApi from '../api/auth';

let AuthContext = createContext(null);

export function AuthProvider({ children }) {
  let [user, setUser] = useState(null);
  let [loading, setLoading] = useState(true);

  // restores a stored session. requireBiometric=true gates it behind Face ID
  // (used by the manual Face ID button); default is a silent restore (used on launch).
  async function restoreSession({ requireBiometric = false } = {}) {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) return false;

      if (requireBiometric) {
        let hasHardware = await LocalAuthentication.hasHardwareAsync();
        let isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          let result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock House of Love',
          });
          if (!result.success) return false;
        }
      }

      let me = await authApi.getMe();
      setUser(me);
      return true;
    } catch (err) {
      await AsyncStorage.removeItem('token');
      return false;
    }
  }

  // on launch: silently restore any stored session so returning users skip the login screen.
  useEffect(() => {
    restoreSession().finally(() => setLoading(false));
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
    // keep the token so Face ID can unlock straight back into this account from the Login screen
    setUser(null);
  }

  async function hasStoredSession() {
    return !!(await AsyncStorage.getItem('token'));
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, restoreSession, hasStoredSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}