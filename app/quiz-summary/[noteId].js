import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createQuizHistory } from '../../utils/database';

export default function QuizSummaryScreen() {
  const { noteId, quizData, userAnswers, difficulty, quizType, timerDuration, fromHistory } = useLocalSearchParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const loadQuizResults = async () => {
      try {
        const parsedQuestions = JSON.parse(quizData);
        const parsedAnswers = JSON.parse(userAnswers);
        
        setQuestions(parsedQuestions);
        setAnswers(parsedAnswers);

        // Calculate score
        let correctCount = 0;
        parsedQuestions.forEach((question, index) => {
          const userAnswer = parsedAnswers[index];
          const correctAnswer = question.correctAnswer?.toLowerCase();
          
          if (userAnswer && userAnswer.toLowerCase() === correctAnswer) {
            correctCount++;
          }
        });

        setScore(correctCount);

        // Only save to quiz history if this is a new quiz (not viewing from history)
        if (fromHistory !== 'true') {
          await createQuizHistory(
            parseInt(noteId),
            correctCount,
            parsedQuestions.length,
            difficulty,
            quizType,
            parsedQuestions,
            parsedAnswers,
            parseInt(timerDuration) || 0
          );
        }
      } catch (error) {
        console.error('Error loading quiz results:', error);
      }
    };

    loadQuizResults();
  }, [quizData, userAnswers, noteId, difficulty, quizType, fromHistory]);

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 85) return theme.colors.success;
    if (percentage >= 75) return theme.colors.warning;
    return theme.colors.danger;
  };

  const handleFinish = () => {
    router.replace(`/note/${noteId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Quiz Results</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Your Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
            {score}/{questions.length}
          </Text>
          <Text style={[styles.scorePercentage, { color: theme.colors.textSecondary }]}>
            {Math.round((score / questions.length) * 100)}%
          </Text>
          {timerDuration && parseInt(timerDuration) > 0 && (
            <View style={styles.timerInfo}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.timerInfoText, { color: theme.colors.textSecondary }]}>
                Timer: {parseInt(timerDuration) >= 60 ? `${parseInt(timerDuration) / 60} min` : `${timerDuration}s`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.questionsContainer}>
          {questions.map((question, index) => {
            const userAnswer = answers[index];
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase();
            const wasAnswered = userAnswer !== undefined;

            return (
              <View
                key={index}
                style={[
                  styles.questionCard,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                ]}
              >
                <View style={styles.questionHeader}>
                  <Text style={[styles.questionNumber, { color: theme.colors.textSecondary }]}>
                    Question {index + 1}
                  </Text>
                  {wasAnswered ? (
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={24}
                      color={isCorrect ? theme.colors.success : theme.colors.danger}
                    />
                  ) : (
                    <Text style={[styles.skippedText, { color: theme.colors.warning }]}>
                      Skipped
                    </Text>
                  )}
                </View>

                <Text style={[styles.questionText, { color: theme.colors.text }]}>
                  {question.question}
                </Text>

                {quizType === 'multiple-choice' && question.options ? (
                  <View style={styles.answersContainer}>
                    {question.options.map((option, optIndex) => {
                      const optionLetter = String.fromCharCode(65 + optIndex);
                      const isUserAnswer = userAnswer === optionLetter;
                      const isCorrectOption = correctAnswer === optionLetter;

                      return (
                        <View
                          key={optIndex}
                          style={[
                            styles.answerOption,
                            {
                              backgroundColor: isCorrectOption
                                ? theme.colors.success + '20'
                                : isUserAnswer && !isCorrect
                                ? theme.colors.danger + '20'
                                : 'transparent',
                              borderColor: theme.colors.border,
                            }
                          ]}
                        >
                          <View style={styles.answerContent}>
                            <Text style={[styles.answerLetter, { color: theme.colors.text }]}>
                              {optionLetter}.
                            </Text>
                            <Text style={[styles.answerText, { color: theme.colors.text }]}>
                              {option}
                            </Text>
                          </View>
                          {isCorrectOption && (
                            <View style={styles.answerBadge}>
                              <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                              <Text style={[styles.badgeText, { color: theme.colors.success }]}>
                                Correct
                              </Text>
                            </View>
                          )}
                          {isUserAnswer && !isCorrect && (
                            <View style={styles.answerBadge}>
                              <Ionicons name="close" size={16} color={theme.colors.danger} />
                              <Text style={[styles.badgeText, { color: theme.colors.danger }]}>
                                Your answer
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.answersContainer}>
                    <View
                      style={[
                        styles.answerOption,
                        {
                          backgroundColor: correctAnswer?.toLowerCase() === 'true'
                            ? theme.colors.success + '20'
                            : userAnswer?.toLowerCase() === 'true' && !isCorrect
                            ? theme.colors.danger + '20'
                            : 'transparent',
                          borderColor: theme.colors.border,
                        }
                      ]}
                    >
                      <Text style={[styles.answerText, { color: theme.colors.text }]}>True</Text>
                      {correctAnswer?.toLowerCase() === 'true' && (
                        <View style={styles.answerBadge}>
                          <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                          <Text style={[styles.badgeText, { color: theme.colors.success }]}>
                            Correct
                          </Text>
                        </View>
                      )}
                      {userAnswer?.toLowerCase() === 'true' && !isCorrect && (
                        <View style={styles.answerBadge}>
                          <Ionicons name="close" size={16} color={theme.colors.danger} />
                          <Text style={[styles.badgeText, { color: theme.colors.danger }]}>
                            Your answer
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.answerOption,
                        {
                          backgroundColor: correctAnswer?.toLowerCase() === 'false'
                            ? theme.colors.success + '20'
                            : userAnswer?.toLowerCase() === 'false' && !isCorrect
                            ? theme.colors.danger + '20'
                            : 'transparent',
                          borderColor: theme.colors.border,
                        }
                      ]}
                    >
                      <Text style={[styles.answerText, { color: theme.colors.text }]}>False</Text>
                      {correctAnswer?.toLowerCase() === 'false' && (
                        <View style={styles.answerBadge}>
                          <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                          <Text style={[styles.badgeText, { color: theme.colors.success }]}>
                            Correct
                          </Text>
                        </View>
                      )}
                      {userAnswer?.toLowerCase() === 'false' && !isCorrect && (
                        <View style={styles.answerBadge}>
                          <Ionicons name="close" size={16} color={theme.colors.danger} />
                          <Text style={[styles.badgeText, { color: theme.colors.danger }]}>
                            Your answer
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.finishButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>Finish</Text>
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
    paddingBottom: 150,
  },
  scoreCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
  },
  scoreLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scorePercentage: {
    fontSize: 18,
    marginTop: 5,
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  timerInfoText: {
    fontSize: 14,
  },
  questionsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  questionCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 14,
  },
  skippedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    lineHeight: 26,
  },
  answersContainer: {
    gap: 10,
  },
  answerOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  answerLetter: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 25,
  },
  answerText: {
    fontSize: 16,
    flex: 1,
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    padding: 15,
    borderTopWidth: 1,
  },
  finishButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
