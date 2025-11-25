import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { QuizProvider } from '../contexts/QuizContext';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase } from '../utils/database';

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still set as initialized to prevent infinite loading
        setDbInitialized(true);
      }
    };
    
    setupDatabase();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="note/[id]" />
            <Stack.Screen name="quiz/[noteId]" />
            <Stack.Screen name="quiz-summary/[noteId]" />
          </Stack>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
