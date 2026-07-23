import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

let AuthContext = createContext(null);

export function AuthProvider({ children }) {
  let [user, setUser] = useState(null);
  let [loading, setLoading] = useState(true);

  // on launch, restore session if a token is stored
  useEffect(() => {
    async function restore() {
      try {
        let token = await AsyncStorage.getItem('token');
        if (token) {
          let me = await authApi.getMe();
          setUser(me);
        }
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