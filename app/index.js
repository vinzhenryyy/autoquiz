import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useTheme();

  useEffect(() => {
    console.log('=== Index.js Auth Check ===');
    console.log('Loading:', loading);
    console.log('User:', user);
    console.log('Segments:', segments);
    
    if (loading) {
      console.log('Still loading auth, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log('In auth group:', inAuthGroup);

    if (!user && !inAuthGroup) {
      console.log('No user and not in auth group -> navigating to login');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      console.log('User exists and in auth group -> navigating to home');
      router.replace('/(tabs)/home');
    } else if (user) {
      console.log('User exists -> navigating to home');
      router.replace('/(tabs)/home');
    } else {
      console.log('Default case -> navigating to login');
      router.replace('/(auth)/login');
    }
  }, [user, loading, segments]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
