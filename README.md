# AutoQuiz

An intelligent note-taking and quiz generation application built with React Native and Expo. AutoQuiz allows you to create notes and automatically generate AI-powered quizzes to help you learn and retain information more effectively.

## Features

### Authentication
- **Login/Signup**: Secure user authentication with username and password
- User data stored in SQLite database

### Note Management (CRUD Operations)
- **Create**: Add new notes with auto-incrementing "Untitled X" titles
- **Read**: View all your notes with search functionality
- **Update**: Edit note titles and content
- **Delete**: Remove notes with confirmation dialog
- Search notes by title in real-time

### Quiz Generation
- AI-powered quiz generation using Google's Gemini API
- Customizable quiz settings:
  - Question quantity: 3-10 questions
  - Difficulty levels: Easy, Medium, Hard
  - Question types: Multiple Choice or True/False
- Interactive quiz interface with progress tracking
- Previous/Next navigation through questions
- Submit confirmation before completing quiz

### Quiz History
- View all past quiz attempts
- See scores, dates, and times
- Track difficulty and question type for each attempt

### Quiz Review
- Comprehensive results page showing:
  - Overall score and percentage
  - Question-by-question breakdown
  - Correct answers highlighted
  - User's answers compared to correct answers

### Account Management
- Upload and change profile photo
- Edit username (updates login credentials)
- Change password with confirmation
- Profile photo reflects in tab bar

### Settings
- **Dark Mode**: Toggle between light and dark themes with persistent storage
- **About**: App information and version details
- **Logout**: Secure logout with confirmation

### Dark Mode Support
- Full dark mode implementation across all screens
- Theme persists across app sessions
- Automatic icon changes based on theme

## Technology Stack

- **Frontend**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Database**: SQLite for local data storage
- **State Management**: React Context API (Auth & Theme)
- **AI Integration**: Google Generative AI (Gemini)
- **Image Handling**: Expo Image Picker
- **Storage**: AsyncStorage for user session and theme preferences

## Database Schema

### Users Table
```sql
- id (Primary Key)
- username (Unique)
- password
- photo_uri
- created_at
```

### Notes Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- title
- content
- created_at
- updated_at
```

### Quiz History Table
```sql
- id (Primary Key)
- note_id (Foreign Key)
- score
- total_questions
- difficulty
- quiz_type
- quiz_data (JSON)
- user_answers (JSON)
- created_at
```

## Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start the development server:
```bash
npm start
npx expo start --tunnel
```

3. Run on your preferred platform:
```bash
npm run android  # For Android
npm run ios      # For iOS
npm run web      # For Web
```

## Project Structure

```
AutoQuiz/
├── app/
│   ├── (auth)/           # Authentication screens
│   │   ├── login.js
│   │   └── signup.js
│   ├── (tabs)/           # Main app tabs
│   │   ├── home.js       # Notes list
│   │   ├── account.js    # User profile
│   │   └── settings.js   # App settings
│   ├── note/
│   │   └── [id].js       # Note detail screen
│   ├── quiz/
│   │   └── [noteId].js   # Quiz screen
│   ├── quiz-summary/
│   │   └── [noteId].js   # Quiz results
│   ├── _layout.js        # Root layout
│   └── index.js          # Entry point
├── contexts/
│   ├── AuthContext.js    # Authentication state
│   └── ThemeContext.js   # Theme state
├── services/
│   └── geminiService.js  # AI quiz generation
├── utils/
│   └── database.js       # SQLite operations
├── assets/               # Images and icons
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## API Configuration

The app uses Google's Gemini API for quiz generation. The API key is configured in `services/geminiService.js`.

**Current API Key**: AIzaSyASZcO9VAt4auvxT-ZYzTj4vZJ48sbZ1Y8

## Features in Detail

### CRUD Operations

1. **Users**
   - Create: Sign up with username and password
   - Read: Login authentication
   - Update: Change username, password, and profile photo
   - Delete: Implicit (logout)

2. **Notes**
   - Create: Add new notes from home screen
   - Read: View all notes, search by title, view individual note
   - Update: Edit title and content
   - Delete: Remove notes with confirmation

3. **Quiz History**
   - Create: Automatically saved after quiz completion
   - Read: View history in note detail screen
   - Update: N/A
   - Delete: Cascade deleted with notes

## Usage Flow

1. **Sign Up/Login**: Create account or login
2. **Create Note**: Add a new note from home screen
3. **Add Content**: Write your study material
4. **Generate Quiz**: Click "Take a Quiz" and configure settings
5. **Take Quiz**: Answer questions with Previous/Next navigation
6. **Submit**: Review and submit answers
7. **View Results**: See score and review correct answers
8. **Track Progress**: View quiz history for each note
