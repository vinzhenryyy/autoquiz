import React, { createContext, useState, useContext } from 'react';

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState(null);

  const startQuiz = (quizData, difficulty, quizType, noteId, timerDuration = 0) => {
    console.log('=== QuizContext: Starting Quiz ===');
    console.log('Quiz data:', quizData);
    console.log('Difficulty:', difficulty);
    console.log('Quiz type:', quizType);
    console.log('Note ID:', noteId);
    console.log('Timer duration:', timerDuration);
    
    setCurrentQuiz({
      questions: quizData.questions,
      difficulty,
      quizType,
      noteId,
      timerDuration,
    });
    
    console.log('Quiz stored in context');
  };

  const clearQuiz = () => {
    setCurrentQuiz(null);
  };

  return (
    <QuizContext.Provider value={{ currentQuiz, startQuiz, clearQuiz }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
