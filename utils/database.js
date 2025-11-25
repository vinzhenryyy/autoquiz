import { Platform } from 'react-native';

// Conditionally import SQLite only for native platforms
let SQLite = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

let db = null;
let webStorage = {
  users: [],
  notes: [],
  quiz_history: [],
  _nextId: { users: 1, notes: 1, quiz_history: 1 }
};

export const initDatabase = async () => {
  // SQLite doesn't work on web, use in-memory storage
  if (Platform.OS === 'web') {
    console.warn('SQLite is not supported on web. Using in-memory storage.');
    db = { isWeb: true };
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync('autoquiz.db');
    
    // Create users table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        photo_uri TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create notes table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);
    
    // Create quiz_history table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quiz_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        quiz_type TEXT NOT NULL,
        quiz_data TEXT NOT NULL,
        user_answers TEXT NOT NULL,
        timer_duration INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
      );
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// User CRUD operations
export const createUser = async (username, password) => {
  console.log('=== Database: createUser called ===');
  console.log('Username:', username);
  
  const database = getDatabase();
  console.log('Database:', database);
  
  if (database.isWeb) {
    console.log('Using web storage');
    console.log('Current users:', webStorage.users);
    // Web implementation
    const existing = webStorage.users.find(u => u.username === username);
    if (existing) {
      console.log('User already exists');
      throw new Error('UNIQUE constraint failed: users.username');
    }
    const id = webStorage._nextId.users++;
    const user = {
      id,
      username,
      password,
      photo_uri: null,
      created_at: new Date().toISOString()
    };
    webStorage.users.push(user);
    console.log('User created:', user);
    console.log('Updated users:', webStorage.users);
    return id;
  }
  
  try {
    const result = await database.runAsync(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      username, password
    );
    return result.lastInsertRowId;
  } catch (error) {
    throw error;
  }
};

export const getUserByUsername = async (username) => {
  console.log('=== Database: getUserByUsername called ===');
  console.log('Username:', username);
  
  const database = getDatabase();
  console.log('Database:', database);
  
  if (database.isWeb) {
    console.log('Using web storage');
    console.log('All users:', webStorage.users);
    // Web implementation
    const user = webStorage.users.find(u => u.username === username) || null;
    console.log('Found user:', user);
    return user;
  }
  
  try {
    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE username = ?',
      username
    );
    return user;
  } catch (error) {
    throw error;
  }
};

export const updateUserPhoto = async (userId, photoUri) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const user = webStorage.users.find(u => u.id === userId);
    if (user) user.photo_uri = photoUri;
    return;
  }
  
  try {
    await database.runAsync(
      'UPDATE users SET photo_uri = ? WHERE id = ?',
      photoUri, userId
    );
  } catch (error) {
    throw error;
  }
};

export const updateUsername = async (userId, newUsername) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const user = webStorage.users.find(u => u.id === userId);
    if (user) user.username = newUsername;
    return;
  }
  
  try {
    await database.runAsync(
      'UPDATE users SET username = ? WHERE id = ?',
      newUsername, userId
    );
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (userId, newPassword) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const user = webStorage.users.find(u => u.id === userId);
    if (user) user.password = newPassword;
    return;
  }
  
  try {
    await database.runAsync(
      'UPDATE users SET password = ? WHERE id = ?',
      newPassword, userId
    );
  } catch (error) {
    throw error;
  }
};

// Note CRUD operations
export const createNote = async (userId, title) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const id = webStorage._nextId.notes++;
    const note = {
      id,
      user_id: userId,
      title,
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    webStorage.notes.push(note);
    return id;
  }
  
  try {
    const result = await database.runAsync(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      userId, title, ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    throw error;
  }
};

export const getNotesByUserId = async (userId) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    return webStorage.notes
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  
  try {
    const notes = await database.getAllAsync(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
      userId
    );
    return notes;
  } catch (error) {
    throw error;
  }
};

export const getNoteById = async (noteId) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    return webStorage.notes.find(n => n.id === noteId) || null;
  }
  
  try {
    const note = await database.getFirstAsync(
      'SELECT * FROM notes WHERE id = ?',
      noteId
    );
    return note;
  } catch (error) {
    throw error;
  }
};

export const updateNoteTitle = async (noteId, title) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const note = webStorage.notes.find(n => n.id === noteId);
    if (note) {
      note.title = title;
      note.updated_at = new Date().toISOString();
    }
    return;
  }
  
  try {
    await database.runAsync(
      'UPDATE notes SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      title, noteId
    );
  } catch (error) {
    throw error;
  }
};

export const updateNoteContent = async (noteId, content) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const note = webStorage.notes.find(n => n.id === noteId);
    if (note) {
      note.content = content;
      note.updated_at = new Date().toISOString();
    }
    return;
  }
  
  try {
    await database.runAsync(
      'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      content, noteId
    );
  } catch (error) {
    throw error;
  }
};

export const deleteNote = async (noteId) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const index = webStorage.notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      webStorage.notes.splice(index, 1);
      // Also delete associated quiz history
      webStorage.quiz_history = webStorage.quiz_history.filter(q => q.note_id !== noteId);
    }
    return;
  }
  
  try {
    await database.runAsync('DELETE FROM notes WHERE id = ?', noteId);
  } catch (error) {
    throw error;
  }
};

// Quiz history CRUD operations
export const createQuizHistory = async (noteId, score, totalQuestions, difficulty, quizType, quizData, userAnswers, timerDuration = 0) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    const id = webStorage._nextId.quiz_history++;
    const history = {
      id,
      note_id: noteId,
      score,
      total_questions: totalQuestions,
      difficulty,
      quiz_type: quizType,
      quiz_data: JSON.stringify(quizData),
      user_answers: JSON.stringify(userAnswers),
      timer_duration: timerDuration,
      created_at: new Date().toISOString()
    };
    webStorage.quiz_history.push(history);
    return id;
  }
  
  try {
    const result = await database.runAsync(
      'INSERT INTO quiz_history (note_id, score, total_questions, difficulty, quiz_type, quiz_data, user_answers, timer_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      noteId, score, totalQuestions, difficulty, quizType, JSON.stringify(quizData), JSON.stringify(userAnswers), timerDuration, new Date().toISOString()
    );
    return result.lastInsertRowId;
  } catch (error) {
    throw error;
  }
};

export const getQuizHistoryByNoteId = async (noteId) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    return webStorage.quiz_history
      .filter(q => q.note_id === noteId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(item => ({
        ...item,
        quiz_data: JSON.parse(item.quiz_data),
        user_answers: JSON.parse(item.user_answers)
      }));
  }
  
  try {
    const history = await database.getAllAsync(
      'SELECT * FROM quiz_history WHERE note_id = ? ORDER BY created_at DESC',
      noteId
    );
    return history.map(item => ({
      ...item,
      quiz_data: JSON.parse(item.quiz_data),
      user_answers: JSON.parse(item.user_answers)
    }));
  } catch (error) {
    throw error;
  }
};

export const deleteQuizHistoryByNoteId = async (noteId) => {
  const database = getDatabase();
  
  if (database.isWeb) {
    // Web implementation
    webStorage.quiz_history = webStorage.quiz_history.filter(q => q.note_id !== noteId);
    return;
  }
  
  try {
    await database.runAsync('DELETE FROM quiz_history WHERE note_id = ?', noteId);
  } catch (error) {
    throw error;
  }
};
