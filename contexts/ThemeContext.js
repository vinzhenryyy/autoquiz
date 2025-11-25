import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'true');
      } else {
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('darkMode', newValue.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = {
    dark: isDarkMode,
    colors: {
      background: isDarkMode ? '#121212' : '#FFFFFF',
      card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      text: isDarkMode ? '#FFFFFF' : '#000000',
      textSecondary: isDarkMode ? '#B0B0B0' : '#666666',
      border: isDarkMode ? '#333333' : '#E0E0E0',
      primary: '#8B5CF6',
      danger: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      inputBackground: isDarkMode ? '#2C2C2C' : '#F0F0F0',
      placeholder: isDarkMode ? '#888888' : '#999999',
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
