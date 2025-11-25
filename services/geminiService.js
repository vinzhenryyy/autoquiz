import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyASZcO9VAt4auvxT-ZYzTj4vZJ48sbZ1Y8';

// Initialize with API version v1
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateQuiz = async (noteContent, quantity, difficulty, type) => {
  try {
    console.log('=== Gemini Service: Starting Quiz Generation ===');
    console.log('Parameters:', { quantity, difficulty, type });
    console.log('Content length:', noteContent.length);
    
    // Use gemini-2.5-flash (latest model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const typeText = type === 'multiple-choice' ? 'multiple choice' : 'true/false';
    
    const prompt = `Generate a quiz based on the following content. Create exactly ${quantity} ${typeText} questions with ${difficulty} difficulty level.

Content:
${noteContent}

Requirements:
- Generate exactly ${quantity} questions
- Difficulty: ${difficulty}
- Type: ${typeText}
${type === 'multiple-choice' 
  ? '- Each question should have 4 options (A, B, C, D)\n- Only one option should be correct'
  : '- Each question should be a true/false statement'}

Return the response in valid JSON format with the following structure:
{
  "questions": [
    {
      "question": "Question text here",
      ${type === 'multiple-choice' 
        ? '"options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "A"'
        : '"correctAnswer": "true" or "false"'}
    }
  ]
}

Important: Return ONLY the JSON object, no additional text or formatting.`;

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    console.log('Received response from Gemini API');
    
    const response = await result.response;
    const text = response.text();
    console.log('Response text length:', text.length);
    console.log('Response preview:', text.substring(0, 200));
    
    // Clean up the response to extract JSON
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      console.log('Removing JSON markdown formatting...');
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      console.log('Removing generic markdown formatting...');
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    console.log('Parsing JSON response...');
    // Parse the JSON
    const quizData = JSON.parse(jsonText);
    console.log('JSON parsed successfully');
    
    // Validate the structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz data structure');
    }
    
    console.log('Quiz data validated:', quizData.questions.length, 'questions');
    
    // Ensure we have the correct number of questions
    if (quizData.questions.length !== quantity) {
      console.warn(`Expected ${quantity} questions but got ${quizData.questions.length}`);
    }
    
    console.log('=== Gemini Service: Quiz Generation Complete ===');
    return quizData;
  } catch (error) {
    console.error('=== Gemini Service: Error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to generate quiz. Please try again.');
  }
};
