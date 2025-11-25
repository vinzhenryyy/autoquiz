import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuiz } from '../../contexts/QuizContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuizScreen() {
  const { noteId } = useLocalSearchParams();
  const { currentQuiz } = useQuiz();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('=== Quiz Screen Mounted ===');
    console.log('Note ID from params:', noteId);
    console.log('Current quiz from context:', currentQuiz);
    
    if (currentQuiz && currentQuiz.questions) {
      console.log('Setting questions from context:', currentQuiz.questions.length, 'questions');
      setQuestions(currentQuiz.questions);
      
      // Initialize timer if set
      if (currentQuiz.timerDuration && currentQuiz.timerDuration > 0) {
        console.log('Timer enabled:', currentQuiz.timerDuration, 'seconds');
        setTimeRemaining(currentQuiz.timerDuration);
        setTimerActive(true);
      }
    } else {
      // No quiz data, go back
      console.error('No quiz data found in context!');
      Alert.alert('Error', 'Quiz data not found');
      router.back();
    }
  }, [currentQuiz]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          // Time's up! Auto-submit
          clearInterval(interval);
          setTimerActive(false);
          Alert.alert(
            'Time\'s Up!',
            'The quiz time has expired. Your answers will be submitted.',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.push({
                    pathname: `/quiz-summary/${noteId}`,
                    params: {
                      quizData: JSON.stringify(questions),
                      userAnswers: JSON.stringify(userAnswers),
                      difficulty: currentQuiz.difficulty,
                      quizType: currentQuiz.quizType,
                      timerDuration: currentQuiz.timerDuration,
                    },
                  });
                },
              },
            ],
            { cancelable: false }
          );
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, questions, userAnswers, noteId, currentQuiz, router]);

  if (questions.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const quizType = currentQuiz?.quizType || 'multiple-choice';

  const handleSelectAnswer = (answer) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const unansweredCount = totalQuestions - Object.keys(userAnswers).length;
    
    if (unansweredCount > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Do you want to submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: confirmSubmit },
        ]
      );
    } else {
      confirmSubmit();
    }
  };

  const confirmSubmit = () => {
    if (!currentQuiz) return;
    
    Alert.alert(
      'Submit Quiz',
      'Are you sure you want to submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            // Stop timer
            setTimerActive(false);
            
            // Use context to navigate with data
            router.push({
              pathname: `/quiz-summary/${noteId}`,
              params: {
                quizData: JSON.stringify(questions),
                userAnswers: JSON.stringify(userAnswers),
                difficulty: currentQuiz.difficulty,
                quizType: currentQuiz.quizType,
                timerDuration: currentQuiz.timerDuration || 0,
              },
            });
          },
        },
      ]
    );
  };

  const selectedAnswer = userAnswers[currentQuestionIndex];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!timerActive) return theme.colors.text;
    const totalTime = currentQuiz?.timerDuration || 0;
    const percentRemaining = (timeRemaining / totalTime) * 100;
    if (percentRemaining <= 10) return theme.colors.danger;
    if (percentRemaining <= 25) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        {timerActive && (
          <View style={[styles.timerContainer, { backgroundColor: theme.colors.card, borderColor: getTimerColor() }]}>
            <Ionicons name="time-outline" size={20} color={getTimerColor()} />
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => {
          setTimerActive(false);
          Alert.alert(
            'Exit Quiz',
            'Are you sure you want to exit? Your progress will be lost.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => {
                if (currentQuiz?.timerDuration > 0) setTimerActive(true);
              }},
              { text: 'Exit', style: 'destructive', onPress: () => router.back() },
            ]
          );
        }}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={[styles.questionNumber, { color: theme.colors.textSecondary }]}>
            Question {currentQuestionIndex + 1} out of {totalQuestions}
          </Text>
          <Text style={[styles.questionText, { color: theme.colors.text }]}>
            {currentQuestion.question}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {quizType === 'multiple-choice' ? (
            currentQuestion.options?.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedAnswer === optionLetter;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => handleSelectAnswer(optionLetter)}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionCircle,
                      { borderColor: isSelected ? '#FFFFFF' : theme.colors.border },
                      isSelected && { backgroundColor: '#FFFFFF' }
                    ]}>
                      {isSelected && (
                        <View style={[styles.optionCircleInner, { backgroundColor: theme.colors.primary }]} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionLetter,
                      { color: isSelected ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {optionLetter}.
                    </Text>
                    <Text style={[
                      styles.optionText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    backgroundColor: selectedAnswer === 'true' ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => handleSelectAnswer('true')}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionCircle,
                    { borderColor: selectedAnswer === 'true' ? '#FFFFFF' : theme.colors.border },
                    selectedAnswer === 'true' && { backgroundColor: '#FFFFFF' }
                  ]}>
                    {selectedAnswer === 'true' && (
                      <View style={[styles.optionCircleInner, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: selectedAnswer === 'true' ? '#FFFFFF' : theme.colors.text }
                  ]}>
                    True
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    backgroundColor: selectedAnswer === 'false' ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => handleSelectAnswer('false')}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionCircle,
                    { borderColor: selectedAnswer === 'false' ? '#FFFFFF' : theme.colors.border },
                    selectedAnswer === 'false' && { backgroundColor: '#FFFFFF' }
                  ]}>
                    {selectedAnswer === 'false' && (
                      <View style={[styles.optionCircleInner, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: selectedAnswer === 'false' ? '#FFFFFF' : theme.colors.text }
                  ]}>
                    False
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: isFirstQuestion ? theme.colors.border : theme.colors.textSecondary }
          ]}
          onPress={handlePrevious}
          disabled={isFirstQuestion}
        >
          <Text style={[styles.navButtonText, { opacity: isFirstQuestion ? 0.5 : 1 }]}>
            Previous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
          onPress={isLastQuestion ? handleSubmit : handleNext}
        >
          <Text style={styles.navButtonText}>
            {isLastQuestion ? 'Submit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionNumber: {
    fontSize: 14,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionLetter: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 25,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 15,
    padding: 15,
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
