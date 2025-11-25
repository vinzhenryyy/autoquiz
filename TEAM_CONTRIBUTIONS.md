# Team Contributions — Feature & File Assignment

## Pantoja — AI Integration & Quiz Flow

- 1) AI Integration — `services/geminiService.js`
  - Simple: Provides the app's AI-powered quiz generation — takes note content and settings, calls Gemini, and returns a validated quiz object.

  - Details:
    - Imported Google Generative AI (Gemini) client and implemented the quiz-generation flow.
    - Build the generation prompt by injecting the note content and quiz options. The prompt includes the raw note content (referred to here as `noteContent`) and settings variables such as `{quantity}` (how many questions), `{difficulty}` (easy, medium, hard), and `{type}` ("multiple-choice" or "true-false").
    - Example prompt composition: include `noteContent` followed by instructions to return JSON with a `questions` array; include `{quantity}`, `{difficulty}`, and `{type}` placeholders so the service can produce the requested number/type/difficulty of questions.
    - Use a ternary-style mapping for question formats: when `{type}` is `multiple-choice`, generate answer options labeled A–D; when `{type}` is `true-false`, return answers as `True` or `False`.
    - Parse and validate the API response (strip markdown/code fences, parse JSON, validate structure) and return a normalized quiz object to the app.
    - Security: read the API key from `process.env.GEMINI_API_KEY` (or a secure loader) rather than hard-coding secrets.

- 2) Quiz UI & flow — `app/quiz/[noteId].js`
  - Simple: Renders the quiz for a note, handles navigation between questions, and captures user answers.

  - Details:
    - Read `noteId` from route params and request the `QuizContext` for an existing quiz. If none exists, call `geminiService` to generate one using `noteContent` and the selected `{quantity}`, `{difficulty}`, and `{type}`.
    - Render one question at a time with Previous/Next navigation, capture user answers, and persist progress in `QuizContext`.
    - Enforce UI behavior for multiple-choice (radio options A–D) and true/false (two-button choice), and disable navigation while generation is in progress.

- 3) Quiz summary / results — `app/quiz-summary/[noteId].js`
  - Simple: Shows the final score and a per-question breakdown comparing correct answers to the user's answers.

  - Details:
    - Calculate score, percentage, and provide per-question breakdown showing correct answer vs. user answer.
    - Support exporting or saving the quiz attempt to local quiz history via `QuizContext` (so users can review later).

- 4) Quiz state management — `contexts/QuizContext.js`
  - Simple: Centralized quiz state and helper functions that power the quiz UI and persist history.

  - Details:
    - Hold the active quiz object, user answers, quiz settings, and helpers `startQuiz`, `setAnswer`, `finishQuiz`, and `getHistory`.
    - Persist finished quiz attempts into the app persistence layer (SQLite via `utils/database.js`) and expose methods for the UI to load history.

- 5) Local database utilities — `utils/database.js`
  - Simple: Provides the app's SQLite helpers for users, notes, and quiz history (CRUD and queries) used by screens and contexts.

  - Details:
    - Initializes the SQLite database and creates tables for users, notes, and quiz_history. Exposes helper functions used across the app:
      - `initDatabase()` — open DB and run CREATE TABLE statements if needed.
      - `createUser(username, password)` / `getUserByUsername(username)` — user account CRUD helpers.
      - `createNote(userId, title, content)`, `getNotesForUser(userId)`, `getNoteById(id)`, `updateNote(id, fields)`, `deleteNote(id)` — note CRUD and list operations.
      - `saveQuizHistory(noteId, quizData, userAnswers, score, difficulty, quizType)` and `getQuizHistoryForNote(noteId)` — persist and retrieve quiz attempts.
    - Returns normalized JS objects (dates as ISO strings, `id` as number) and uses parameterized SQL to avoid injection.
    - Handles errors and provides clear return values (throws or returns `null`/`false` consistently) so callers (contexts and screens) can show appropriate messages.
    - Transaction usage: batch writes (for example, creating a note + initial quiz history) use transactions to ensure consistency.
    - Minimal performance considerations: use indexed columns where appropriate (e.g., `user_id`, `note_id`) and limit queries for list pagination.

---


## Parraba — Authentication & Session Flow

- 1) Login screen — `app/(auth)/login.js`
  - Simple: Authentication form to sign users in with a username and password.

  - Details:
    - Implements the login form: username and password inputs, input validation, error messaging, and the password visibility toggle. On submit, it calls `getUserByUsername(username)` and compares passwords, then calls `AuthContext.login(user)` on success. Also handles navigation to the signup flow.

- 2) Signup screen — `app/(auth)/signup.js`
  - Simple: Registration form to create a new user account and log them in.

  - Details:
    - Handles registration flow: validates username uniqueness (calls the DB helper), validates password and confirmation, creates the new user record, and logs the user in automatically.

- 3) Authentication state — `contexts/AuthContext.js`
  - Simple: Manages user session and persistence across app launches.

  - Details:
    - Central session manager: stores the current user, exposes `login(user)`, `logout()`, and `restoreSession()` that reads from `AsyncStorage` on app start. Ensures other screens can check `user` to gate access.

- 4) Auth layout & routing — `app/(auth)/_layout.js`
  - Simple: Layout wrapper for auth screens to ensure consistent styling and behavior.

  - Details:
    - Provides the layout for the auth flow (header, consistent margins, keyboard avoiding behavior), and ensures safe navigation between `login` and `signup`. Also integrates light/dark theme styling for the auth screens.

- 5) Settings screen — `app/(tabs)/settings.js`
  - Simple: App settings screen that exposes theme switching, about info, and logout.

  - Details:
    - Toggle Dark Mode (calls `ThemeContext.toggle()`), show About information and app version, and expose Logout (calls `AuthContext.logout()` with confirmation).
    - Handle platform-specific settings or permission explanations (e.g., photo permissions).


---


## Rapsing — Notes UI & Navigation Integration

- 1) Home / Notes list — `app/(tabs)/home.js`
  - Simple: Notes index where the user sees and searches their notes and can create a new note.

  - Details:
    - Query `utils/database.js` (via a UI helper) to list notes for the current user and update the list when notes are created/edited.
    - Create new notes with an auto-incrementing title "Untitled X" and navigate to `app/note/[id].js` for editing.

- 2) Note detail / editor — `app/note/[id].js`
  - Simple: Single-note editor for viewing and editing note content, plus the "Take a Quiz" entry point.

  - Details:
    - Load note content by `id`, support editing and saving, and deletion (with confirmation).
    - Expose "Take a Quiz" controls: open quiz settings (quantity/difficulty/type), trigger generation using `QuizContext` / `geminiService`, and show quiz history for the note.

- 3) App entry route & session redirect — `app/index.js`
  - Simple: Entry route that redirects to the right screen based on whether the user is logged in.

  - Details:
    - Lightweight entry that checks `AuthContext` for an active session and redirects to the authenticated tab layout or auth flow accordingly. Shows a loading indicator while `restoreSession()` runs.

- 4) Tabs layout for main app — `app/(tabs)/_layout.js`
  - Simple: Bottom-tab navigator shell for the main app (home/account/settings).

  - Details:
    - Implements the tab navigator and coordinates which screens are shown. Responsibilities include providing themed icons and badge counts (e.g., unread items or quiz notifications) and integrating the account/settings tabs.

- 5) Account screen — `app/(tabs)/account.js`
  - Simple: User profile screen to view and update user information and profile photo.

  - Details:
    - Display and edit username and profile photo.
    - Use `expo-image-picker` to let users pick or take photos; upload/save the chosen `photo_uri` in the user record so it appears in the tab bar.



## Rubio — App Layout, Routing & Global Providers

- 1) Root router layout — `app/_layout.js`
  - Simple: Top-level router layout that wraps the app with providers and global UI config.

  - Details:
    - Provide SafeArea, StatusBar configuration, and wrap app children with `AuthContext`, `ThemeContext`, and `QuizContext` providers so screens can access app-wide state.
    - Ensure consistent top-level styling and manage layout-level behaviors (keyboard handling, global modals).

- 2) App entry routing helpers — `App.js` (entry point)
  - Simple: App entry point that initializes global providers and hands control to the router.

  - Details:
    - Ensure the app bootstraps providers and kicks off routing. Responsibilities:
    - Register and order global providers, initialize any global SDKs if needed (for example, linking or analytics), and hand off control to the router entry (`expo-router` entry point).

- 3) Layout & navigation shell — `app/_layout.js` (more detailed duties)
  - Simple: Navigation shell coordination, including dynamic icons and deep-link handling.

  - Details:
    - Coordinate the bottom-tab shell and pass theme props to nested layouts. Implement dynamic tab icons (profile photo when set) and handle deep links via the app scheme.

- 4) Theme management — `contexts/ThemeContext.js`
  - Simple: Provides the app theme (light/dark) and a toggle interface.

  - Details:
    - Provide `theme` object (colors, border, inputBackground, textSecondary, etc.), persist the user's theme preference to AsyncStorage, and expose a toggle function.
    - Apply system-preference detection where appropriate and notify components of theme changes.

- 5) Small infra/service integration — `services/geminiService.js` (coordination)
  - Simple: Service integration coordination for AI features and env configuration.

  - Details:
    - Worked together with Pantoja to ensure `geminiService` is wired into the app lifecycle correctly, and that any environment-variable-based config is available at runtime. Rubio reviewed and help QA the integration end-to-end.