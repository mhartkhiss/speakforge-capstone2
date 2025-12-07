# Translation System Implementation Documentation

This document provides a detailed breakdown of the translation system implementation, including the `translate` endpoint, context-aware translation, prompt engineering, and the regeneration flow.

## 1. Translate Endpoint Implementation

### Overview
The primary endpoint for context-aware translation is `translate-db-context`. It handles real-time translation for the Connect Chat feature, leveraging historical conversation context to improve accuracy.

**Endpoint:** `POST /api/translate-db-context/`
**View Function:** `server/core/views/translation_endpoints.py::translate_db_context`

### Implementation Flow

1.  **Input Validation**:
    -   Validates required fields: `text`, `room_id`, `message_id`, `current_user_id`, `recipient_id`.
    -   Checks text length for optimizations (skips enhanced context for very short messages).

2.  **Parallel Context Retrieval**:
    -   Uses `ThreadPoolExecutor` to perform independent operations concurrently:
        -   **Task 1: Context Retrieval**: Calls `get_enhanced_connect_chat_context` to fetch and analyze conversation history.
        -   **Task 2: User Profile**: Calls `UserProfileManager.get_user_preferences` to load user-specific settings (glossary, formality).

3.  **Context Analysis (Enhanced Mode)**:
    -   If enabled, the system analyzes the fetched context to determine:
        -   **Topic**: Detected via `TopicAnalyzer` (e.g., "anime", "technology").
        -   **Complexity**: Assessed via `ContextWindowManager`.
        -   **Entities**: Extracted via `EntityExtractor` (e.g., names, specific terms).

4.  **Translation Execution**:
    -   Calls `translate_with_enhanced_context` (in `server/core/views/context_helpers.py`).
    -   **Translation Memory Check**: Checks `TranslationMemoryManager` for cached translations matching the text and context hash.
    -   **LLM Inference**: If no cache, constructs a prompt and calls the selected AI model (Gemini, Claude, or DeepSeek).

5.  **Result Processing & Storage**:
    -   Updates the specific message in Firebase with the translation result (`update_firebase_message`).
    -   Stores the new translation in the internal Translation Memory for future use.

6.  **Response**:
    -   Returns a JSON response containing the translations, detected language, and context metadata (topic, confidence, entities).

## 2. Context-Aware Translation

The system goes beyond simple text-to-text translation by building a rich context object around the current message. This logic resides primarily in `server/core/views/enhanced_context.py` and `server/core/views/context_helpers.py`.

### Key Components

-   **Topic Analyzer (`TopicAnalyzer`)**:
    -   Uses a hybrid approach of keyword matching (weighted) and AI classification.
    -   Identifies topics like 'anime', 'technology', 'business', etc.
    -   Used to select domain-specific system prompts.

-   **Entity Extractor (`EntityExtractor`)**:
    -   Identifies proper nouns and specific terms (e.g., "Naruto", "API", "Tokyo").
    -   Helps the translator preserve these terms rather than translating them literally.

-   **Context Window Manager (`ContextWindowManager`)**:
    -   Dynamically calculates how many previous messages to include.
    -   Increases window size for complex topics or continuous discussions.
    -   Caps the window size to manage token usage and latency.

-   **Semantic Clusterer (`SemanticClusterer`)**:
    -   Groups messages into semantic clusters to understand the flow of conversation.

-   **Context Summarizer (`ContextSummarizer`)**:
    -   For very long conversations, summarizes older messages into a concise string to retain context without exceeding token limits.

## 3. Prompt Engineering

The system constructs dynamic prompts based on the analyzed context. This logic is handled by `DomainSpecificPromptManager` and `translate_with_enhanced_context`.

### Prompt Structure

The final system instruction sent to the LLM is composed of several layers:

1.  **Base Instruction**:
    -   Standard role definition ("You are a translator...").
    -   Specifies source and target languages.

2.  **Domain-Specific Guidelines**:
    -   Injected based on the detected topic.
    -   *Example (Anime)*: "Preserve Japanese honorifics... Keep commonly used anime terms untranslated."
    -   *Example (Tech)*: "Maintain technical accuracy... Keep programming terms unchanged."

3.  **Contextual Data**:
    -   **Conversation History**: "CONVERSATION CONTEXT: [Speaker A: ..., Speaker B: ...]"
    -   **Entity List**: "Key entities mentioned: - Anime Character: Tanjiro, Nezuko..."
    -   **User Glossary**: "User-specific translation preferences: ..."

4.  **Operational Constraints**:
    -   "Output ONLY the translation."
    -   "Maintain conversational tone."

### Implementation Detail
In `translate_with_enhanced_context`:
```python
context_instruction = (
    f"You are translating a conversation between speakers. "
    f"Analyze the context carefully...\n\n"
    f"CONVERSATION CONTEXT:\n{context_text}"
    f"{entities_info}\n\n"
    f"Translation Guidelines:\n"
    f"{domain_prompt}\n\n" # Injected domain rules
    f"Translate the following text from {source} to {target}:"
)
```

## 4. Regenerate Translation Implementation

The `regenerate-translation` endpoint allows users to re-translate a specific message, potentially with different settings (e.g., changing mode from 'formal' to 'casual', or switching AI models).

**Endpoint:** `POST /api/regenerate-translation/`
**View Function:** `server/core/views/translation_endpoints.py::regenerate_translation`

### Implementation Flow

1.  **Retrieval**:
    -   Accepts `room_id` and `message_id`.
    -   Fetches the *existing* message payload from Firebase to ensure we are translating the exact same source text.

2.  **Context Re-evaluation**:
    -   Re-runs the context retrieval process (`get_enhanced_connect_chat_context`). This ensures that if the user provides feedback or if the conversation has evolved, the new translation considers the latest state.

3.  **Parameter Updates**:
    -   Accepts new parameters in the request body (e.g., `model='gpt-4'`, `translation_mode='formal'`).

4.  **Translation & Update**:
    -   Calls `translate_with_enhanced_context` with the new parameters.
    -   Updates the `translationState` in Firebase.
    -   Optionally updates the message content in the database (`save_to_db` flag).

5.  **Error Handling**:
    -   Includes robust error handling to reset `translationState` in Firebase if the regeneration fails, preventing the UI from getting stuck in a "loading" state.
