import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  cardBackground: string;
  borderColor: string;
  headerBackground: string;
  inputBackground: string;
  inputBorder: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleDarkMode: () => void;
}

const lightColors: ThemeColors = {
  background: '#F8F9FA',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  cardBackground: '#FFF',
  borderColor: '#E9ECEF',
  headerBackground: '#FFF',
  inputBackground: '#F8F9FA',
  inputBorder: '#DEE2E6',
};

const darkColors: ThemeColors = {
  background: '#121212',
  text: '#E8E8E8',
  textSecondary: '#B0B0B0',
  cardBackground: '#1E1E1E',
  borderColor: '#2A2A2A',
  headerBackground: '#1A1A1A',
  inputBackground: '#2A2A2A',
  inputBorder: '#3A3A3A',
};

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('app_theme', JSON.stringify(newMode));
    } catch (e) {
      console.error(e);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => React.useContext(ThemeContext);
