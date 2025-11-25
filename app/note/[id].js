import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuiz } from '../../contexts/QuizContext';
import { getNoteById, updateNoteTitle, updateNoteContent, getQuizHistoryByNoteId, deleteQuizHistoryByNoteId } from '../../utils/database';
import { generateQuiz } from '../../services/geminiService';

export default function NoteScreen() {
  const { id } = useLocalSearchParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [quizHistory, setQuizHistory] = useState([]);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [quizQuantity, setQuizQuantity] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('multiple-choice');
  const [quizTimer, setQuizTimer] = useState(0); // 0 means no timer
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme } = useTheme();
  const { startQuiz } = useQuiz();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saveTimeoutRef = useRef(null);

  const loadNote = async () => {
    try {
      setLoading(true);
      const noteData = await getNoteById(parseInt(id));
      if (noteData) {
        setNote(noteData);
        setTitle(noteData.title);
        setContent(noteData.content || '');
      } else {
        // Note not found, go back to home
        Alert.alert('Error', 'Note not found', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
        ]);
      }
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizHistory = async () => {
    try {
      const history = await getQuizHistoryByNoteId(parseInt(id));
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading quiz history:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNote();
      loadQuizHistory();
    }, [id])
  );

  const handleSaveTitle = async () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }
    try {
      await updateNoteTitle(parseInt(id), title.trim());
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  const handleSaveContent = async () => {
    try {
      await updateNoteContent(parseInt(id), content);
      console.log('Content saved successfully');
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  // Auto-save content with debounce
  useEffect(() => {
    if (!note) return; // Don't save if note hasn't loaded yet
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1 second of no typing
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveContent();
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  const handleStartQuiz = async () => {
    console.log('=== Starting Quiz Generation ===');
    if (!content.trim()) {
      Alert.alert('Error', 'Please add content to your note before generating a quiz');
      return;
    }

    // Save content before generating quiz
    console.log('Saving content before quiz generation...');
    await handleSaveContent();
    console.log('Content saved');

    setShowQuizSettings(false);
    setIsGenerating(true);

    try {
      console.log('Generating quiz with:', { quizQuantity, quizDifficulty, quizType, quizTimer });
      console.log('Content to generate quiz from:', content.substring(0, 100) + '...');
      const quizData = await generateQuiz(content, quizQuantity, quizDifficulty, quizType);
      console.log('Quiz generated:', quizData);
      setIsGenerating(false);
      
      // Store quiz data in context
      console.log('Storing quiz in context...');
      startQuiz(quizData, quizDifficulty, quizType, parseInt(id), quizTimer);
      console.log('Quiz stored in context');
      
      // Navigate to quiz screen
      console.log('Navigating to quiz screen:', `/quiz/${id}`);
      router.push(`/quiz/${id}`);
      console.log('Navigation triggered');
    } catch (error) {
      setIsGenerating(false);
      console.error('Error generating quiz:', error);
      Alert.alert('Error', error.message || 'Failed to generate quiz. Please try again.');
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Quiz History',
      'Are you sure you want to delete all quiz history for this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuizHistoryByNoteId(parseInt(id));
              await loadQuizHistory();
              Alert.alert('Success', 'Quiz history cleared');
            } catch (error) {
              console.error('Error clearing quiz history:', error);
              Alert.alert('Error', 'Failed to clear quiz history');
            }
          },
        },
      ]
    );
  };

  const calculateAveragePercentage = () => {
    if (quizHistory.length === 0) return 0;
    const totalPercentage = quizHistory.reduce((sum, item) => {
      return sum + (item.score / item.total_questions) * 100;
    }, 0);
    return Math.round(totalPercentage / quizHistory.length);
  };

  const renderQuizHistoryItem = ({ item }) => {
    const date = new Date(item.created_at);
    const percentage = Math.round((item.score / item.total_questions) * 100);
    const scoreColor = percentage >= 85 ? theme.colors.success : percentage >= 75 ? theme.colors.warning : theme.colors.danger;
    const timerText = item.timer_duration ? (item.timer_duration >= 60 ? `${item.timer_duration / 60}min` : `${item.timer_duration}s`) : 'No Timer';
    
    const handleViewQuizResult = () => {
      router.push({
        pathname: `/quiz-summary/${id}`,
        params: {
          quizData: JSON.stringify(item.quiz_data),
          userAnswers: JSON.stringify(item.user_answers),
          difficulty: item.difficulty,
          quizType: item.quiz_type,
          timerDuration: item.timer_duration || 0,
          fromHistory: 'true',
        },
      });
    };
    
    return (
      <TouchableOpacity 
        style={[styles.historyItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={handleViewQuizResult}
        activeOpacity={0.7}
      >
        <View style={styles.historyHeader}>
          <Text style={[styles.historyScore, { color: theme.colors.text }]}>
            Score: {item.score}/{item.total_questions} <Text style={{ color: scoreColor }}>({percentage}%)</Text>
          </Text>
          <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.historyDetails}>
          <View style={styles.historyDetailRow}>
            <Text style={[styles.historyDetail, { color: theme.colors.textSecondary }]}>
              {item.difficulty} • {item.quiz_type === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}
            </Text>
            <View style={styles.historyTimerBadge}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.historyTimerText, { color: theme.colors.textSecondary }]}>
                {timerText}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isGenerating) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10, justifyContent: 'flex-end' }]}> 
          <TouchableOpacity 
            onPress={() => {
              setIsGenerating(false);
              setShowQuizSettings(false);
            }} 
            style={styles.backButton}
          >
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Generating quiz...
          </Text>
          <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
            This may take a few moments
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading note...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Note not found
          </Text>
          <TouchableOpacity
            style={[styles.quizButton, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.quizButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TextInput
          style={[styles.titleInput, { color: theme.colors.text }]}
          value={title}
          onChangeText={setTitle}
          onBlur={handleSaveTitle}
          placeholder="Note title"
          placeholderTextColor={theme.colors.placeholder}
        />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Content</Text>
          <TextInput
            style={[styles.contentInput, { 
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            value={content}
            onChangeText={setContent}
            onBlur={handleSaveContent}
            placeholder="Write your notes here..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quiz History</Text>
            {quizHistory.length > 0 && (
              <TouchableOpacity
                onPress={handleClearHistory}
                style={styles.clearButton}
              >
                <Text style={[styles.clearButtonText, { color: theme.colors.danger }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          {quizHistory.length > 0 ? (
            <>
              <View style={[styles.averageCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.averageLabel, { color: theme.colors.textSecondary }]}>Average Score</Text>
                <Text style={[styles.averagePercentage, { color: calculateAveragePercentage() >= 85 ? theme.colors.success : calculateAveragePercentage() >= 75 ? theme.colors.warning : theme.colors.danger }]}>{calculateAveragePercentage()}%</Text>
              </View>
              <FlatList
                data={quizHistory}
                renderItem={renderQuizHistoryItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No quizzes taken yet
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.quizButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowQuizSettings(true)}
        >
          <Text style={styles.quizButtonText}>Take a Quiz</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showQuizSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuizSettings(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuizSettings(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Quiz Settings</Text>
                <TouchableOpacity 
                  onPress={() => setShowQuizSettings(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Number of Questions: {quizQuantity}
              </Text>
              <View style={styles.quantityButtons}>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.quantityButton,
                      { borderColor: theme.colors.border },
                      quizQuantity === num && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setQuizQuantity(num)}
                  >
                    <Text style={[
                      styles.quantityButtonText,
                      { color: quizQuantity === num ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Difficulty</Text>
              <View style={styles.optionButtons}>
                {['easy', 'medium', 'hard'].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.optionButton,
                      { 
                        borderColor: theme.colors.border,
                        backgroundColor: quizDifficulty === diff ? theme.colors.card : 'transparent'
                      },
                      quizDifficulty === diff && { borderColor: theme.colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => setQuizDifficulty(diff)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      { color: quizDifficulty === diff ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Type</Text>
              <View style={styles.optionButtons}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { 
                      borderColor: theme.colors.border,
                      backgroundColor: quizType === 'multiple-choice' ? theme.colors.card : 'transparent'
                    },
                    quizType === 'multiple-choice' && { borderColor: theme.colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setQuizType('multiple-choice')}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: quizType === 'multiple-choice' ? theme.colors.primary : theme.colors.text }
                  ]}>
                    Multiple Choice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { 
                      borderColor: theme.colors.border,
                      backgroundColor: quizType === 'true-false' ? theme.colors.card : 'transparent'
                    },
                    quizType === 'true-false' && { borderColor: theme.colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setQuizType('true-false')}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: quizType === 'true-false' ? theme.colors.primary : theme.colors.text }
                  ]}>
                    True/False
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Timer: {quizTimer === 0 ? 'No Timer' : quizTimer >= 60 ? `${quizTimer / 60} min` : `${quizTimer}s`}
              </Text>
              <View style={styles.quantityButtons}>
                {[
                  { label: 'No Timer', value: 0 },
                  { label: '30s', value: 30 },
                  { label: '1min', value: 60 },
                  { label: '2min', value: 120 },
                  { label: '3min', value: 180 },
                  { label: '5min', value: 300 },
                  { label: '10min', value: 600 },
                  { label: '15min', value: 900 }
                ].map((timer) => (
                  <TouchableOpacity
                    key={timer.value}
                    style={[
                      styles.timerButton,
                      { borderColor: theme.colors.border },
                      quizTimer === timer.value && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setQuizTimer(timer.value)}
                  >
                    <Text style={[
                      styles.timerButtonText,
                      { color: quizTimer === timer.value ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {timer.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleStartQuiz}
              >
                <Text style={styles.modalButtonText}>Start Quiz</Text>
              </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    gap: 10,
  },
  backButton: {
    padding: 5,
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  contentInput: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  historyItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  historyScore: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 14,
  },
  historyDetails: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  historyDetail: {
    fontSize: 14,
  },
  historyTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyTimerText: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  averageCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  averageLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  averagePercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    borderTopWidth: 1,
    padding: 15,
  },
  quizButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  settingGroup: {
    marginBottom: 25,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  quantityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quantityButton: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerButton: {
    minWidth: 70,
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  timerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtons: {
    gap: 10,
  },
  optionButton: {
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
