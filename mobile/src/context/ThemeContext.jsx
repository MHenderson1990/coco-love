import { createContext, useContext, useState } from 'react';
import { PALETTES } from '../theme/palettes';

let ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  let [palette, setPalette] = useState('purple');
  let [mode, setMode] = useState('light');

  let colors = PALETTES[palette][mode];

  return (
    <ThemeContext.Provider value={{ colors, palette, setPalette, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}