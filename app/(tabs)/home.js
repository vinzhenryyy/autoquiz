import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotesByUserId, createNote, deleteNote, updateNoteTitle } from '../../utils/database';

export default function HomeScreen() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadNotes = async () => {
    try {
      const userNotes = await getNotesByUserId(user.id);
      setNotes(userNotes);
      setFilteredNotes(userNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [user])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  const handleAddNote = async () => {
    try {
      // Find the next available "Untitled X" number
      const untitledNotes = notes.filter(note => note.title.startsWith('Untitled'));
      let nextNumber = 1;
      
      if (untitledNotes.length > 0) {
        const numbers = untitledNotes
          .map(note => {
            const match = note.title.match(/Untitled (\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => num > 0);
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }

      const title = `Untitled ${nextNumber}`;
      await createNote(user.id, title);
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note');
    }
  };

  const handleDeleteNote = (noteId, noteTitle) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const startEditingTitle = (note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
  };

  const saveTitle = async () => {
    if (editingTitle.trim() === '') {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }

    try {
      await updateNoteTitle(editingNoteId, editingTitle.trim());
      setEditingNoteId(null);
      setEditingTitle('');
      loadNotes();
    } catch (error) {
      console.error('Error updating title:', error);
      Alert.alert('Error', 'Failed to update title');
    }
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingTitle('');
  };

  const renderNote = ({ item }) => {
    const isEditing = editingNoteId === item.id;

    return (
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => !isEditing && router.push(`/note/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.noteContent}>
          {isEditing ? (
            <TextInput
              style={[styles.titleInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={editingTitle}
              onChangeText={setEditingTitle}
              autoFocus
              onSubmitEditing={saveTitle}
            />
          ) : (
            <Text style={[styles.noteTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          <Text style={[styles.noteDate, { color: theme.colors.textSecondary }]}>
            {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.noteActions}>
          {isEditing ? (
            <>
              <TouchableOpacity onPress={saveTitle} style={styles.actionButton}>
                <Ionicons name="checkmark" size={24} color={theme.colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditing} style={styles.actionButton}>
                <Ionicons name="close" size={24} color={theme.colors.danger} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  startEditingTitle(item);
                }}
                style={styles.actionButton}
              >
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteNote(item.id, item.title);
                }}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={20} color={theme.colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Notes</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.text 
          }]}
          placeholder="Search notes..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.notesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No notes yet. Create one!
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddNote}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    paddingLeft: 45,
    paddingRight: 15,
    fontSize: 16,
  },
  notesList: {
    padding: 20,
    paddingTop: 0,
  },
  noteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  noteDate: {
    fontSize: 14,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingVertical: 5,
    marginBottom: 5,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
});
