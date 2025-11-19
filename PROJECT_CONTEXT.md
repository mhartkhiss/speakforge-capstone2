# SpeakForge Project Context

## Overview

SpeakForge is a comprehensive language translation application with three main components:
- **Mobile App** (Android - Java): User-facing translation application
- **Web Admin Panel** (React.js): Administrative dashboard for system management
- **Backend API** (Django - Python): Translation processing and admin services

The application provides real-time translation capabilities, conversational translation features, user management, and administrative oversight through Firebase integration and AI-powered translation services.

---

## Module 1: User Authentication

### 1.1: Guest Login
**Status**: ✅ Implemented

**Mobile App Components**:
- `WelcomeScreen.java`: Main welcome screen with guest login option
- Guest session management via `Variables.java` class
- SharedPreferences for persistent guest state (`PREF_IS_GUEST_USER`)

**Features**:
- Skip authentication to use app as guest
- Guest user data: `userUID="guest"`, `userEmail="guest@speakforge.app"`, `accountType="guest"`
- Default language: English, Default translator: Gemini
- Guest session persists across app restarts

**Data Storage**: Local SharedPreferences (no Firebase account created)

---

### 1.2: User Login
**Status**: ✅ Implemented

**Mobile App Components**:
- `LoginActivity.java`: Email/password authentication screen
- `BaseAuthActivity.java`: Base class with common auth UI elements
- Firebase Authentication integration

**Features**:
- Email/password authentication via Firebase Auth
- Email validation using Android Patterns
- Password validation
- Automatic navigation to LanguageSetupActivity for new users
- Navigation to MainActivity for existing users
- Last login date tracking in Firebase Database
- Default translator assignment (Gemini) if not set

**Backend**: Firebase Authentication with email/password method

**Data Storage**: 
- Firebase Auth: User credentials
- Firebase Database: `users/{userId}/lastLoginDate` (ISO timestamp format)

---

### 1.3: Sign Up
**Status**: ✅ Implemented

**Mobile App Components**:
- `SignUpActivity.java`: Registration screen extending BaseAuthActivity
- Email, password, and confirm password fields
- Input validation and error handling

**Features**:
- Email pattern validation
- Password length validation (minimum 6 characters)
- Password confirmation matching
- Account creation via `createUserWithEmailAndPassword()`
- User profile creation in Firebase Database
- Automatic sign-out after registration (requires login)
- Default account type: "free"
- Default translator: "google"

**Backend**: Firebase Authentication + Firebase Realtime Database

**Data Storage**: 
- Firebase Auth: User account
- Firebase Database: `users/{userId}` with User model fields

---

### 1.4: Forgot Password
**Status**: ✅ Implemented

**Mobile App Components**:
- `ForgotPasswordActivity.java`: Password recovery screen
- Email input field
- Firebase password reset functionality

**Features**:
- Email-based password reset via Firebase
- Email validation before sending reset link
- Password reset email sent to user's registered email
- User-friendly error/success messages

**Backend**: Firebase Authentication password reset service

---

## Module 2: User Profile Management

### 2.1: Change Display Name
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Profile screen with username display
- `ChangeUsernameControl.java`: Controller for username management
- Bottom sheet dialog for username editing

**Features**:
- Tap username to edit
- Real-time username update in Firebase Database
- UI updates immediately after change
- Validation for username input

**Data Storage**: Firebase Database `users/{userId}/username`

---

### 2.2: Change Preferred Language
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Language display and selection
- `ChangeLanguageControl.java`: Language management controller
- Language selection bottom sheet dialog

**Features**:
- Language selection from available languages list
- Real-time language preference update
- Language preference affects translation behavior
- Language stored in user profile

**Data Storage**: Firebase Database `users/{userId}/language`

---

### 2.3: Change Password
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Password change option
- `ChangePassControl.java`: Password change controller
- Bottom sheet dialog with current password, new password, and confirm password fields

**Features**:
- Current password verification
- New password validation
- Password confirmation matching
- Secure password update via Firebase Auth
- Success/error feedback

**Backend**: Firebase Authentication password update

---

### 2.4: Change Preferred Translator
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Translator display and selection
- `ChangeTranslatorControl.java`: Translator management controller
- Dynamic translator buttons with icons and names
- `TranslatorType.java`: Enum defining available translators

**Features**:
- Multiple translator options: Google, DeepSeek, Claude, Gemini
- Premium account validation (premium required for translator change)
- Visual translator selection with icons
- Real-time translator preference update
- Translator preference affects all translations

**Data Storage**: Firebase Database `users/{userId}/translator`

**Premium Feature**: Changing translator requires premium subscription

---

### 2.5: Change Profile Picture
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Profile picture display
- `ChangeProfilePicControl.java`: Profile picture management controller
- Image picker integration

**Features**:
- Tap profile picture to select new image
- Image selection from device gallery
- Upload to Firebase Storage at `profile_pictures/{userId}`
- Automatic download URL retrieval
- Profile picture URL stored in Firebase Database
- Glide library for image loading and caching
- Default placeholder image for users without profile pictures

**Backend**: Firebase Storage + Firebase Realtime Database

**Data Storage**: 
- Firebase Storage: `profile_pictures/{userId}` (image file)
- Firebase Database: `users/{userId}/profileImageUrl` (download URL)

---

### 2.6: Toggle Translation Mode (Formal/Casual)
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Translation mode display and toggle
- `TranslationModeManager.java`: Translation mode management utility
- Floating toggle button with visual indicators

**Features**:
- Toggle between Formal and Casual translation modes
- Visual indicators (colors, icons) for each mode
- Persistent storage in SharedPreferences (`PREF_FORMAL_TRANSLATION_MODE`)
- Global state management via `Variables.isFormalTranslationMode`
- Real-time mode updates affect all translations
- Mode persists across app sessions

**Data Storage**: Local SharedPreferences (not synced to Firebase)

---

### 2.7: Manage Premium Subscription
**Status**: ✅ Implemented

**Mobile App Components**:
- `ProfileFragment.java`: Account type display
- `UpgradeAccountActivity.java`: Premium upgrade screen
- Account type indicator with upgrade button

**Features**:
- Display current account type (free/premium)
- Tap account type to open upgrade screen
- Premium upgrade process with payment simulation
- Account type update in Firebase Database
- Success confirmation dialog
- Premium features unlocked after upgrade

**Data Storage**: Firebase Database `users/{userId}/accountType` ("free" or "premium")

**Note**: Currently simulates payment processing; integration with payment gateway can be added

---

## Module 3: Basic Translation Features

### 3.1: Voice-to-Text (Single Screen) Translation
**Status**: ✅ Implemented

**Mobile App Components**:
- `BasicTranslationFragment.java`: Main translation interface
- `SpeechRecognitionDialog.java`: Voice input modal dialog
- `SpeechRecognitionHelper.java`: Speech recognition lifecycle management
- Floating Action Button for voice input

**Features**:
- Speech-to-text conversion using Android SpeechRecognizer
- Real-time speech visualization during recording
- Automatic transcription display in text input field
- Translation after voice input
- Microphone permission handling
- Error recovery for recognition failures

**Backend**: Android Speech Recognition API + Translation API

**Translation Flow**: Voice → Text → Translation → Display

---

### 3.2: Text-to-Text Translation
**Status**: ✅ Implemented

**Mobile App Components**:
- `BasicTranslationFragment.java`: Text translation interface
- Text input field with language selection
- Target language spinner
- Translate button
- Translation result display with animated reveal

**Features**:
- Direct text input for translation
- Source language auto-detection or manual selection
- Target language selection from available languages
- Multiple translator support (Google, DeepSeek, Claude, Gemini)
- Translation variants support (single/multiple)
- Formal/Casual mode support
- Translation history integration

**Backend**: Translation API endpoints (`/translate-simple/`)

**Translation Services**: Google Translate, DeepSeek V3, Claude, Gemini

---

### 3.3: Translation History
**Status**: ✅ Implemented

**Mobile App Components**:
- `BasicTranslationFragment.java`: History button and modal
- `TranslationHistoryAdapter.java`: RecyclerView adapter for history items
- `TranslationHistoryManager.java`: History data management utility
- History modal dialog with RecyclerView

**Features**:
- View previous translations
- Click history item to reuse translation
- Local storage using SharedPreferences
- User-specific history (isolated per user)
- Automatic cleanup (50 item limit)
- JSON serialization using Gson library
- Empty state handling

**Data Storage**: Local SharedPreferences (not synced to Firebase)

**History Model**: Stores original text, translated text, source/target languages, translator, timestamp

---

### 3.4: Voice-to-Text (Split Screen) Translation
**Status**: ✅ Implemented

**Mobile App Components**:
- `ConversationalActivity.java`: Split-screen voice translation interface
- `ConversationalSpeechRecognizer.java`: Dual speech recognition manager
- Dual user sections (top and bottom panels)
- Individual FABs for each user section
- Language spinners for each user

**Features**:
- Split-screen layout for two users
- Alternating speech recognition (mutual exclusion)
- Individual language selection per user
- Real-time translation display per user section
- Loading indicators for each user section
- Smooth animations and transitions
- Contact settings integration for translation preferences

**Backend**: Translation API + Firebase Database for contact settings

**Use Case**: Face-to-face conversations between two users speaking different languages

---

## Module 4: Conversational (Connect Mode)

### 4.1: QR Code Connection
**Status**: ✅ Implemented

**Mobile App Components**:
- `QRScanActivity.java`: Camera-based QR code scanning interface
- `BasicTranslationFragment.java`: QR scan initiation
- ML Kit BarcodeScanner integration
- CameraX for camera management

**Features**:
- Real-time QR code scanning using device camera
- Camera permission handling
- QR code validation against connection requests
- Session ID extraction from QR code
- Automatic navigation to ConnectChatActivity on successful scan
- Active session tracking to prevent duplicates

**Backend**: Firebase Database for connection request validation

**Data Flow**: QR Code → Session ID → Connection Request Lookup → Chat Session

---

### 4.2: User Search & Connect
**Status**: ✅ Implemented

**Mobile App Components**:
- `SearchUsersActivity.java`: User discovery and connection interface
- `SearchUserAdapter.java`: RecyclerView adapter for search results
- `RecentConnectionsAdapter.java`: Horizontal adapter for recent contacts
- Real-time search filtering

**Features**:
- Search users by username or email
- Real-time search results as user types
- Case-insensitive matching
- Self-exclusion from search results
- Recent connections horizontal list
- User profile display (name, image, language)
- Connection request creation
- Online status indicators

**Backend**: Firebase Database user search + ConnectionRequestManager

**Data Storage**: Firebase Database `users/` collection + `connection_requests/`

---

### 4.3: Real-Time Text Display
**Status**: ✅ Implemented

**Mobile App Components**:
- `ConnectChatActivity.java`: Real-time chat interface
- `ConnectChatAdapter.java`: RecyclerView adapter for chat messages
- Message layouts (sent/received)
- Auto-scrolling to latest messages

**Features**:
- Real-time message synchronization via Firebase listeners
- Message bubbles (left-aligned for received, right-aligned for sent)
- Translation display with original text option
- Message timestamps
- Translation status indicators (TRANSLATING, TRANSLATED)
- Automatic UI updates on new messages
- Session-based message filtering

**Backend**: Firebase Realtime Database `connect_chats/{sessionId}/`

**Real-time Updates**: ValueEventListener monitors message changes

---

### 4.4: Regenerate Translated Text
**Status**: ✅ Implemented

**Mobile App Components**:
- `ConnectChatActivity.java`: Message long-press context menu
- Regenerate option in message context menu
- Loading indicators during regeneration

**Features**:
- Long-press message to show context menu
- Regenerate translation option
- Alternative translation generation
- Translation variation system
- Real-time message update in Firebase
- Visual feedback during regeneration process

**Backend**: Translation API `/regenerate-translation/` endpoint

**Translation Variation**: Uses different prompts to generate alternative translations

---

### 4.5: View Original Message
**Status**: ✅ Implemented

**Mobile App Components**:
- `ConnectChatActivity.java`: Message context menu
- Message display toggle functionality
- Original text view option

**Features**:
- Long-press message to view options
- Toggle between translated and original text
- View original message in sender's language
- Visual indicators for display mode
- Preserves original message content

**Data**: Original message stored in Firebase `message` field, translations in `translations/` object

---

### 4.6: View Conversation History
**Status**: ✅ Implemented

**Mobile App Components**:
- `ConnectChatActivity.java`: Conversation history display
- Session-based message filtering
- History toggle functionality

**Features**:
- View messages from current session
- Option to show/hide previous session history
- Chronological message ordering
- Session start time tracking
- Message filtering by timestamp

**Data Storage**: Firebase Database `connect_chats/{sessionId}/` with timestamp filtering

---

### 4.7: End Session
**Status**: ✅ Implemented

**Mobile App Components**:
- `ConnectChatActivity.java`: End session button
- Confirmation dialog for session termination
- Session state management

**Features**:
- End session button with confirmation dialog
- Session end message sent to other participants
- Firebase listener cleanup
- Active session clearing via ConnectionRequestManager
- UI disabling after session end
- Navigation handling after session termination

**Backend**: Firebase Database session end message + ConnectionRequestManager state management

---

## Module 5: Web Admin Panel

### 5.1: Admin Authentication
**Status**: ✅ Implemented

**Web Admin Components**:
- `AdminLogin.jsx`: Admin login interface
- Token-based authentication
- Session management

**Features**:
- Email/password authentication
- Django REST Framework token authentication
- Token storage in localStorage
- Automatic redirect to login if not authenticated
- Logout functionality with token invalidation

**Backend**: Django `/admin/login/` endpoint with Token authentication

**Security**: Admin users must have `is_staff=True` in Django

---

### 5.2: User Management
**Status**: ✅ Implemented

**Web Admin Components**:
- `AdminDashboard.jsx`: Main dashboard with user management
- `UsersTable.jsx`: User data table with sorting and filtering
- `UsersControlBar.jsx`: Search and filter controls
- `UserDialogs.jsx`: Add/Edit user dialogs
- `UserContextMenu.jsx`: Right-click context menu for user actions

**Features**:
- View all users from Firebase Database
- Search users by username or email
- Sort users by various fields
- Add new users (create Firebase Auth account)
- Edit user details (username, email, account type, language, translator)
- Delete users (remove from Firebase)
- View user details
- Account type management (free/premium)
- Real-time user data updates

**Backend**: Django `/admin/users/` endpoints (GET, POST, PUT, DELETE)

**Data Source**: Firebase Realtime Database `users/` collection

---

### 5.3: Usage Statistics
**Status**: ✅ Implemented

**Web Admin Components**:
- `StatisticsCards.jsx`: Key metrics display cards
- `LoginTrendChart.jsx`: Login activity visualization (line/bar charts)
- `AccountTypeChart.jsx`: Premium vs Free user distribution (pie chart)
- `LanguageDistributionChart.jsx`: Language usage analytics (bar chart)
- `DailyActivityTable.jsx`: Daily login activity table
- `TopUsersLeaderboard.jsx`: Most active users leaderboard
- `StatisticsControlBar.jsx`: Time period selector and controls
- `TimePeriodSelector.jsx`: Period selection dropdown

**Features**:
- Total users, active users (last 7 days), premium/free counts
- Login trend charts with time period selection (7 days, 1 month, 3 months, 6 months, 1 year)
- Account type distribution visualization
- Language preference distribution
- Daily activity tracking
- Top users leaderboard
- Trend indicators with percentage changes
- Chart type toggle (line/bar)
- Auto-refresh functionality

**Backend**: Django `/admin/usage/` endpoint

**Data Source**: Firebase Database `usage_statistics/{date}/` + Firebase `users/` collection

---

### 5.4: API Usage
**Status**: ✅ Implemented

**Web Admin Components**:
- `ApiUsageStatistics.jsx`: API analytics dashboard
- Statistics cards for total requests, tokens, costs
- Model breakdown table (Claude vs Gemini)
- Daily usage charts
- Currency conversion (USD to PHP)

**Features**:
- Total API requests counter
- Total tokens used across all API calls
- Cost breakdown with currency formatting (USD and PHP)
- Model-specific usage breakdown (Claude vs Gemini)
- Daily API usage trends
- Cost per model with percentage breakdowns
- Interactive charts and visualizations

**Backend**: Django `/admin/api-usage/` endpoint

**Data Source**: Django database `APIUsageStats` model

**Cost Calculation**:
- Claude: $3.00 per million input tokens, $15.00 per million output tokens
- Gemini: $0.10 per million input tokens, $0.40 per million output tokens

---

### 5.5: System Settings
**Status**: ✅ Implemented

**Web Admin Components**:
- `SettingsTab.jsx`: System configuration interface
- Form controls for backend URL and APK download URL
- Save and cancel buttons

**Features**:
- Backend URL configuration (API base URL)
- APK download URL management
- Form validation
- Settings persistence in Firebase
- Dynamic configuration loading
- Real-time settings synchronization

**Backend**: Django `/admin/settings/` endpoint (GET, PUT)

**Data Storage**: Firebase Database `settings/` node

**Settings Fields**:
- `backendUrl`: API base URL for mobile app
- `apkDownloadUrl`: APK download and QR code URL
- `updatedAt`: Last update timestamp
- `updatedBy`: Admin user who made the update

---

### 5.6: Database
**Status**: ✅ Implemented

**Web Admin Components**:
- `FirebaseStructureTab.jsx`: Database visualization interface
- Interactive database structure display
- Expandable tree view for collections
- Field documentation and data types
- Data preview capabilities

**Features**:
- Visual database structure representation
- Collection and table navigation
- Field descriptions and types
- Real-time data preview
- Database schema documentation
- Export functionality (planned)

**Data Source**: Firebase Realtime Database structure

**Displayed Collections**:
- `users/`: User profiles
- `connect_chats/`: Chat sessions
- `connection_requests/`: Connection requests
- `messages/`: Direct messages
- `groups/`: Group conversations
- `group_messages/`: Group messages
- `usage_statistics/`: Usage statistics
- `settings/`: System settings

---

## Module 6: Backend API Services

### 6.1: Translation Processing
**Status**: ✅ Implemented

**Backend Components**:
- `translation_endpoints.py`: Translation API endpoints
- `translation_helpers.py`: Core translation logic
- `TranslatorFactory`: Factory pattern for translator selection
- Multiple translator implementations (Google, DeepSeek, Claude, Gemini)

**Endpoints**:
- `POST /translate-simple/`: Simple text translation (no context)
- `POST /translate-db-context/`: Context-aware translation for connect chats
- `POST /regenerate-translation/`: Regenerate alternative translation
- `POST /translation-feedback/`: Submit translation feedback
- `GET /user-preferences/`: Get user translation preferences

**Features**:
- Multiple AI model support (Claude, Gemini, DeepSeek, Google)
- Translation mode support (formal/casual)
- Translation variants (single/multiple)
- Language auto-detection
- Translation caching via `TranslationCache` model
- Error handling and fallback mechanisms
- Token usage tracking for cost calculation

**Translation Models**:
- **Claude 3.5 Sonnet**: Advanced context understanding
- **Gemini 2.5 Flash**: Fast and efficient translations
- **DeepSeek V3**: Alternative AI translation
- **Google Translate**: Standard translation service

**Data Storage**: Django database `TranslationCache` model for caching

---

### 6.2: Context-Aware Translation
**Status**: ✅ Implemented

**Backend Components**:
- `context_helpers.py`: Context gathering and processing
- `enhanced_context.py`: Advanced context analysis
- `TranslationMemoryManager`: Translation memory management
- `UserProfileManager`: User preference management
- `FeedbackProcessor`: Feedback processing and learning

**Features**:
- Conversation context analysis
- Entity extraction (anime characters, tech terms, places, etc.)
- Topic classification (anime, technology, casual, business, etc.)
- Semantic clustering of related messages
- Translation memory with context awareness
- User profile learning from feedback
- Enhanced translation prompts based on context
- Context metadata generation

**Models**:
- `ContextualTranslationMemory`: Context-aware translation cache
- `EntityTracking`: Track entities mentioned in conversations
- `ConversationTopic`: Track conversation topics
- `TranslationFeedback`: User feedback and corrections
- `UserTranslationProfile`: User-specific translation preferences
- `MessageCluster`: Group related messages semantically

**Context Processing**:
- Analyzes recent conversation messages (configurable depth, default 25)
- Extracts entities and topics for better translation accuracy
- Builds enhanced context metadata
- Applies user preferences and learned patterns
- Falls back to basic translation if context processing fails

**Endpoints**:
- `POST /translate-db-context/`: Context-aware translation endpoint
- `POST /translation-feedback/`: Submit feedback for learning
- `GET /user-preferences/`: Retrieve user translation preferences

---

### 6.3: Admin API Endpoints
**Status**: ✅ Implemented

**Backend Components**:
- `admin_views.py`: Admin API endpoint implementations
- Token-based authentication
- Permission checks (`IsAdminUser`)

**Endpoints**:
- `POST /admin/login/`: Admin authentication (returns token)
- `POST /admin/logout/`: Logout and token invalidation
- `GET /admin/users/`: List all users
- `POST /admin/users/`: Create new user
- `GET /admin/users/<user_id>/`: Get user details
- `PUT /admin/users/<user_id>/`: Update user
- `DELETE /admin/users/<user_id>/`: Delete user
- `GET /admin/usage/`: Get usage statistics
- `GET /admin/api-usage/`: Get API usage statistics
- `GET /admin/settings/`: Get system settings
- `PUT /admin/settings/`: Update system settings

**Features**:
- Token-based authentication for admin access
- Staff user requirement (`is_staff=True`)
- User CRUD operations
- Usage statistics aggregation
- API usage tracking and cost calculation
- System settings management
- Firebase integration for data operations

**Security**: All admin endpoints require valid admin token and staff privileges

---

## Technical Architecture

### Mobile App Architecture
- **Language**: Java (Android)
- **Framework**: Android SDK
- **Architecture Pattern**: MVC (Model-View-Controller)
- **Key Libraries**:
  - Firebase SDK (Auth, Database, Storage)
  - Glide (Image loading)
  - Gson (JSON serialization)
  - ML Kit (Barcode scanning)
  - CameraX (Camera management)
  - Android Speech Recognition API

### Web Admin Architecture
- **Language**: JavaScript
- **Framework**: React.js
- **UI Library**: Material-UI (MUI)
- **Charts**: Chart.js
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

### Backend Architecture
- **Language**: Python
- **Framework**: Django + Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **External Services**: Firebase Admin SDK
- **AI Services**: Claude API, Gemini API, DeepSeek API, Google Translate API

### Data Storage

#### Firebase Realtime Database Structure
```
speakforge-appdev/
├── users/{userId}/
├── messages/{roomId}/{messageId}/
├── connect_chats/{sessionId}/{messageId}/
├── connection_requests/{requestId}/
├── groups/{groupId}/
├── group_messages/{groupId}/{messageId}/
├── usage_statistics/{date}/
└── settings/
```

#### Firebase Storage Structure
```
speakforge-storage/
├── profile_pictures/{userId}
└── group_images/{groupId}
```

#### Django Database Models
- `TranslationCache`: Translation result caching
- `ContextualTranslationMemory`: Context-aware translation memory
- `EntityTracking`: Entity tracking for context
- `ConversationTopic`: Topic classification
- `TranslationFeedback`: User feedback
- `UserTranslationProfile`: User preferences
- `MessageCluster`: Semantic message clustering
- `APIUsageStats`: API usage and cost tracking

---

## Key Features Summary

### Authentication & User Management
✅ Guest login, User login, Sign up, Forgot password
✅ Profile management (name, language, password, translator, picture)
✅ Premium subscription management
✅ Translation mode toggle (formal/casual)

### Translation Features
✅ Voice-to-text translation (single and split screen)
✅ Text-to-text translation
✅ Translation history (local storage)
✅ Multiple translator support (Google, DeepSeek, Claude, Gemini)
✅ Context-aware translation
✅ Translation regeneration
✅ View original message

### Conversational Features
✅ QR code connection
✅ User search and connect
✅ Real-time text display
✅ Conversation history
✅ End session functionality

### Admin Features
✅ Admin authentication
✅ User management (CRUD operations)
✅ Usage statistics with charts
✅ API usage tracking and cost analysis
✅ System settings management
✅ Database structure visualization

### Backend Services
✅ Translation processing with multiple AI models
✅ Context-aware translation with entity extraction and topic classification
✅ Translation memory and caching
✅ User preference learning
✅ API usage tracking and cost calculation
✅ Admin API endpoints

---

## Color Palette

The application uses a consistent color scheme across mobile and web admin:
- **Primary Orange**: `#FBA834`
- **Primary Blue**: `#387ADF`
- **Accent Cyan**: `#50C4ED`

---

## Documentation Files

Detailed documentation for each feature is available in:
- `mobileapp/docs/`: Mobile app feature documentation
- `admin/docs/`: Web admin feature documentation
- `server/docs/`: Backend API documentation
- `mobileapp/FirebaseStructure.md`: Firebase database structure
- `mobileapp/FirebaseStorage.md`: Firebase storage structure

---

## Development Notes

- All Firebase operations use Realtime Database (not Firestore)
- Translation history is stored locally (not synced to Firebase)
- Guest users do not create Firebase accounts
- Premium features require account type validation
- Admin panel requires Django staff user privileges
- API usage tracking is automatic for all translation requests
- Context-aware translation is enabled by default for connect chats

---

*Last Updated: Based on codebase scan and documentation review*

