import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateUserPhoto, updateUsername, updatePassword, getUserByUsername } from '../../utils/database';

export default function AccountScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        await updateUserPhoto(user.id, photoUri);
        await updateUser({ ...user, photo_uri: photoUri });
        Alert.alert('Success', 'Profile photo updated');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update photo');
    }
  };

  const handleUpdateUsername = async () => {
    if (newUsername.trim() === '') {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (newUsername.trim() === user.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      // Check if username already exists
      const existingUser = await getUserByUsername(newUsername.trim());
      if (existingUser && existingUser.id !== user.id) {
        Alert.alert('Error', 'Username already exists');
        return;
      }

      await updateUsername(user.id, newUsername.trim());
      await updateUser({ ...user, username: newUsername.trim() });
      setIsEditingUsername(false);
      Alert.alert('Success', 'Username updated');
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters long');
      return;
    }

    try {
      await updatePassword(user.id, newPassword);
      await updateUser({ ...user, password: newPassword });
      setNewPassword('');
      setConfirmNewPassword('');
      setIsChangingPassword(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {user?.photo_uri ? (
              <Image source={{ uri: user.photo_uri }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="person" size={64} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={[styles.editPhotoButton, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: theme.colors.textSecondary }]}>
            Tap to change photo
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Username</Text>
          {isEditingUsername ? (
            <View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
                autoFocus
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf, { backgroundColor: theme.colors.success }]}
                  onPress={handleUpdateUsername}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf, { backgroundColor: theme.colors.textSecondary }]}
                  onPress={() => {
                    setNewUsername(user.username);
                    setIsEditingUsername(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: theme.colors.text }]}>{user?.username}</Text>
              <TouchableOpacity onPress={() => setIsEditingUsername(true)}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Password</Text>
          {isChangingPassword ? (
            <View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="New Password"
                placeholderTextColor={theme.colors.placeholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.colors.placeholder}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf, { backgroundColor: theme.colors.primary }]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf, { backgroundColor: theme.colors.textSecondary }]}
                  onPress={() => {
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setIsChangingPassword(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => setIsChangingPassword(true)}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  photoSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    marginTop: 10,
    fontSize: 14,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonHalf: {
    flex: 1,
  },
});
