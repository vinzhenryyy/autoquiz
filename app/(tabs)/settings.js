import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAbout, setShowAbout] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('=== Settings: Logout Button Pressed ===');
              await logout();
              console.log('=== Settings: Logout Complete ===');
              console.log('=== Settings: Navigating to login ===');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <Image source={require('../../assets/AutoQuiz_Icon.png')} style={styles.photo} />
          </View>
        </View>

        <View style={styles.settingsSection}>
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setShowAbout(true)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={toggleDarkMode}
        >
          <View style={styles.settingLeft}>
            <Ionicons 
              name={isDarkMode ? "moon" : "sunny"} 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>Dark Mode</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: isDarkMode ? theme.colors.primary : theme.colors.border }]}>
            <View style={[styles.toggleCircle, { 
              backgroundColor: '#FFFFFF',
              transform: [{ translateX: isDarkMode ? 22 : 2 }]
            }]} />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={handleLogout}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="log-out" size={24} color={theme.colors.danger} />
            <Text style={[styles.settingText, { color: theme.colors.danger }]}>Logout</Text>
          </View>
        </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
                <Image source={require('../../assets/AutoQuiz_Icon.png')} style={styles.modalLogo} />
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>AutoQuiz</Text>
            </View>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              AutoQuiz is an intelligent note-taking and quiz generation application. 
              Create notes, and let AI generate custom quizzes to help you learn and 
              retain information more effectively.
            </Text>
            <Text style={[styles.modalVersion, { color: theme.colors.textSecondary }]}>
              Version 1.0.0
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: -20,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  settingsSection: {
    marginTop: 25,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  divider: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  modalVersion: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
