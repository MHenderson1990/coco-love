import { createContext, useContext, useEffect, useState } from 'react';
import { PALETTES } from '../theme/palettes';
import { useAuth } from './AuthContext';
import * as userApi from '../api/user';

let ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  let { user } = useAuth();
  let [palette, setPaletteState] = useState('purple');
  let [mode, setModeState] = useState('light');
  

  // adopt the user's saved preferences on login
  useEffect(() => {
    if (user?.preferences) {
      let saved = user.preferences.colorPalette;
      if (saved && PALETTES[saved]) setPaletteState(saved);
      if (user.preferences.theme) setModeState(user.preferences.theme);
    }
  }, [user?._id]);

  async function setPalette(next) {
    setPaletteState(next);
    try {
      await userApi.updateMe({ preferences: { colorPalette: next } });
    } catch (err) {
      // keep the local change even if the save fails
    }
  }

  async function setMode(next) {
    setModeState(next);
    try {
      await userApi.updateMe({ preferences: { theme: next } });
    } catch (err) {
      // keep the local change even if the save fails
    }
  }

  let colors = (PALETTES[palette] || PALETTES.purple)[mode] || PALETTES.purple.light;

  return (
    <ThemeContext.Provider value={{ colors, palette, setPalette, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}