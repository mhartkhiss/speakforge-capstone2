from firebase_admin import db
from google.genai import types
import anthropic
import os
from openai import OpenAI
from datetime import datetime
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import helpers from the new location
from .translation_helpers import get_translation_instruction, get_translation, anthropic_client, deepseek_client, gemini_clients

# Import enhanced context features
from .enhanced_context import (
    EntityExtractor,
    TopicAnalyzer,
    ContextWindowManager,
    SemanticClusterer,
    UserProfileManager,
    ContextSummarizer,
    TranslationMemoryManager,
    DomainSpecificPromptManager,
    FeedbackProcessor
)

# ============================================================================
# CONNECT CHAT CONTEXT FUNCTIONS (Used by ConnectChatActivity)
# ============================================================================

def get_enhanced_connect_chat_context(session_id, message_id, max_context_messages=25, current_user_id=None, recipient_id=None, session_start_time=None, use_enhancements=True):
    """
    Enhanced version: Get connect chat context with advanced features
    """
    print(f"🚀 ENHANCED CONNECT CHAT: Processing session {session_id} with enhancements={use_enhancements}")
    # Get messages
    messages_ref = db.reference(f'connect_chats/{session_id}')
    messages_query = messages_ref.order_by_child('timestamp').get()
    
    if not messages_query:
        return [], {}
    
    # Filter and sort messages
    all_messages = []
    for msg_id, msg_data in messages_query.items():
        if 'timestamp' in msg_data and msg_id != message_id:
            message_timestamp = msg_data.get('timestamp', 0)
            if session_start_time is None or message_timestamp >= session_start_time:
                all_messages.append({
                    'message_id': msg_id,
                    'data': msg_data
                })
    
    all_messages.sort(key=lambda x: x['data'].get('timestamp', 0))
    
    context_metadata = {}
    
    if use_enhancements:
        # PARALLEL PROCESSING: Run analysis tasks simultaneously
        message_texts = [msg['data'].get('voiceText', msg['data'].get('message', '')) for msg in all_messages]
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {}
            
            # Task 1: Topic analysis
            recent_for_topic = message_texts[-5:] if len(message_texts) > 5 else message_texts
            futures['topic'] = executor.submit(TopicAnalyzer.classify_topic, recent_for_topic)
            
            # Task 2: Complexity assessment
            futures['complexity'] = executor.submit(
                ContextWindowManager.assess_complexity,
                ' '.join(message_texts[-20:])
            )
            
            # Task 3: Semantic clustering (run in parallel)
            futures['clusters'] = executor.submit(
                SemanticClusterer.cluster_messages,
                all_messages[-50:]
            )
            
            # Wait for topic analysis (needed for window sizing)
            try:
                topic, confidence, keywords = futures['topic'].result()
                print(f"🔍 ENHANCED CONNECT CHAT: Topic detected - {topic} (confidence: {confidence:.2f}) from {len(recent_for_topic)} recent messages")
            except Exception as e:
                print(f"⚠️ ENHANCED CONNECT CHAT: Error in topic analysis: {e}")
                topic, confidence, keywords = 'general', 0.5, []
            
            # Wait for complexity assessment
            try:
                complexity = futures['complexity'].result()
            except Exception as e:
                print(f"⚠️ ENHANCED CONNECT CHAT: Error in complexity assessment: {e}")
                complexity = 0.5
            
            # Calculate optimal window size
            optimal_size = ContextWindowManager.calculate_optimal_window_size(
                all_messages[-50:],
                topic_continuity=(topic != 'general'),
                complexity_score=complexity
            )
            max_context_messages = min(optimal_size, 50)  # Cap at 50 for performance
            print(f"📏 ENHANCED CONNECT CHAT: Dynamic window size: {optimal_size} → {max_context_messages} (complexity: {complexity:.2f})")
            
            # Wait for semantic clustering
            try:
                clusters = futures['clusters'].result()
                print(f"🔗 ENHANCED CONNECT CHAT: Found {len(clusters)} semantic clusters")
            except Exception as e:
                print(f"⚠️ ENHANCED CONNECT CHAT: Error in semantic clustering: {e}")
                clusters = []
        
        # Entity extraction (sequential - depends on max_context_messages)
        all_entities = {}
        total_entities = 0
        try:
            for msg in all_messages[-max_context_messages:]:
                text = msg['data'].get('voiceText', msg['data'].get('message', ''))
                entities = EntityExtractor.extract_entities(text)
                for entity_type, entity_list in entities.items():
                    for entity_name in entity_list:
                        EntityExtractor.track_entity(
                            session_id=session_id,
                            entity_type=entity_type,
                            entity_name=entity_name,
                            context=text[:100]
                        )
                        if entity_type not in all_entities:
                            all_entities[entity_type] = []
                        all_entities[entity_type].append(entity_name)
                        total_entities += 1
            
            if total_entities > 0:
                print(f"🎭 ENHANCED CONNECT CHAT: Extracted {total_entities} entities: {dict(all_entities)}")
        except Exception as e:
            print(f"⚠️ ENHANCED CONNECT CHAT: Error extracting entities: {e}")
            all_entities = {}
        
        # User profile tracking (fire and forget)
        try:
            if current_user_id:
                UserProfileManager.update_domain_interest(current_user_id, topic, 1.0)
                print(f"👤 ENHANCED CONNECT CHAT: Updated user {current_user_id} interest in {topic}")
        except Exception as e:
            print(f"⚠️ ENHANCED CONNECT CHAT: Error updating user profile: {e}")
        
        context_metadata = {
            'topic': topic,
            'topic_confidence': confidence,
            'keywords': keywords,
            'entities': all_entities,
            'clusters': clusters,
            'complexity': complexity,
            'window_size': max_context_messages
        }
    
    # Select messages for context
    context_messages = all_messages[-max_context_messages:] if len(all_messages) > max_context_messages else all_messages
    
    # Format context with speaker notation
    formatted_context = []
    for msg in context_messages:
        msg_data = msg['data']
        message_text = msg_data.get('voiceText', msg_data.get('message', ''))
        sender_id = msg_data.get('senderId', 'unknown')
        
        if sender_id == current_user_id:
            speaker_label = "Speaker A"
        elif sender_id == recipient_id:
            speaker_label = "Speaker B"
        else:
            speaker_label = "Speaker A" if len(formatted_context) % 2 == 0 else "Speaker B"
        
        formatted_context.append(f"{speaker_label}: {message_text}")
    
    print(f"✅ ENHANCED CONNECT CHAT: Returning {len(formatted_context)} messages with enhanced metadata")
    return formatted_context, context_metadata

def get_connect_chat_context(session_id, message_id, max_context_messages=25, current_user_id=None, recipient_id=None, session_start_time=None):
    """
    Original basic connect chat context (fallback)
    """
    print(f"⚡ BASIC CONNECT CHAT: Using simple context retrieval for session {session_id}")
    """
    Get previous messages from the connect chat to use as context for translation.
    Uses Speaker A and Speaker B notation where Speaker A is the current user.
    Only includes messages from the current session (after session_start_time).
    Enhanced to provide better topic awareness and entity recognition.
    """
    # Get reference to connect chat messages
    messages_ref = db.reference(f'connect_chats/{session_id}')

    # Get all messages ordered by timestamp
    messages_query = messages_ref.order_by_child('timestamp').get()

    if not messages_query:
        return []

    # Convert to list and sort by timestamp
    all_messages = []
    for msg_id, msg_data in messages_query.items():
        if 'timestamp' in msg_data and msg_id != message_id:  # Skip current message
            # If session_start_time is provided, only include messages from current session
            message_timestamp = msg_data.get('timestamp', 0)
            if session_start_time is None or message_timestamp >= session_start_time:
                all_messages.append({
                    'message_id': msg_id,
                    'data': msg_data
                })

    # Sort by timestamp (should already be sorted, but ensure it)
    all_messages.sort(key=lambda x: x['data'].get('timestamp', 0))

    # Get only the last N messages before the current one (up to 20)
    context_messages = all_messages[-max_context_messages:] if len(all_messages) > max_context_messages else all_messages

    # Format context for AI models with Speaker A/B notation
    formatted_context = []
    for msg in context_messages:
        msg_data = msg['data']

        # Get the message text (use voiceText for connect chat messages)
        message_text = msg_data.get('voiceText', msg_data.get('message', ''))

        # Get the sender ID
        sender_id = msg_data.get('senderId', 'unknown')

        # Determine if this is Speaker A (current user) or Speaker B (other user)
        if sender_id == current_user_id:
            speaker_label = "Speaker A"
        elif sender_id == recipient_id:
            speaker_label = "Speaker B"
        else:
            # Fallback for edge cases
            speaker_label = "Speaker A" if len(formatted_context) % 2 == 0 else "Speaker B"

        formatted_context.append(f"{speaker_label}: {message_text}")

    return formatted_context

# ============================================================================
# TRANSLATION FUNCTIONS (Enhanced and Basic)
# ============================================================================

def translate_with_enhanced_context(text, source_language, target_language, context, model, translation_mode="casual", context_metadata=None, user_id=None):
    """
    Enhanced translation with advanced context awareness
    """
    print(f"🚀 ENHANCED TRANSLATION: Processing '{text[:50]}...' with topic={context_metadata.get('topic') if context_metadata else 'none'}")
    # Check translation memory first
    if context_metadata:
        cached_translation = TranslationMemoryManager.retrieve_translation(
            source_text=text,
            source_lang=source_language,
            target_lang=target_language,
            context=context,
            topic=context_metadata.get('topic')
        )
        if cached_translation:
            print(f"💾 ENHANCED TRANSLATION: Using cached translation from memory")
            return cached_translation
    
    # Get user preferences if available
    user_preferences = {}
    try:
        if user_id:
            user_preferences = UserProfileManager.get_user_preferences(
                user_id, 
                context_type=context_metadata.get('topic') if context_metadata else None
            )
            print(f"👤 ENHANCED TRANSLATION: Loaded user preferences for {user_id}")
    except Exception as e:
        print(f"⚠️ ENHANCED TRANSLATION: Error loading user preferences: {e}")
        user_preferences = {'formality': 'casual', 'glossary': {}}
    
    # Prepare enhanced context instruction
    base_instruction = get_translation_instruction(source_language, target_language, 'single', translation_mode)
    
    # Get domain-specific prompt if topic is identified
    domain_prompt = ""
    if context_metadata and context_metadata.get('topic'):
        try:
            topic = context_metadata['topic']
            print(f"📋 ENHANCED TRANSLATION: AI Detected Topic: '{topic}'")
            
            # 1. First inject the dynamic topic directly
            domain_prompt = f"CONTEXT: The current conversation topic is '{topic}'. Adjust tone and vocabulary accordingly."
            
            # 2. Check if this dynamic topic maps to any of our specialized domain prompts
            # This allows us to still use the detailed guidelines for broad categories
            matched_domain = 'general'
            topic_lower = topic.lower()
            
            # Map dynamic topics to broad domains
            if any(k in topic_lower for k in ['anime', 'manga', 'character', 'episode']):
                matched_domain = 'anime'
            elif any(k in topic_lower for k in ['code', 'tech', 'programming', 'app', 'software']):
                matched_domain = 'technology'
            elif any(k in topic_lower for k in ['game', 'gaming', 'play']):
                matched_domain = 'gaming'
            elif any(k in topic_lower for k in ['business', 'meeting', 'work', 'job']):
                matched_domain = 'business'
            elif any(k in topic_lower for k in ['school', 'study', 'class', 'student']):
                matched_domain = 'academic'
            elif any(k in topic_lower for k in ['hi', 'hello', 'greet', 'kamusta', 'morning', 'evening']):
                matched_domain = 'casual'
            
            # If we found a specific domain match (other than general), append its guidelines
            if matched_domain != 'general':
                detailed_guidelines = DomainSpecificPromptManager.get_domain_prompt(matched_domain)
                domain_prompt += f"\n\n{detailed_guidelines}"
            
            # 3. Enhance with entities if available
            if context_metadata.get('entities'):
                print(f"🎭 ENHANCED TRANSLATION: Enhancing prompt with entities: {list(context_metadata['entities'].keys())}")
                domain_prompt = DomainSpecificPromptManager.enhance_prompt_with_context(
                    domain_prompt,
                    context_metadata['entities'],
                    user_preferences.get('glossary')
                )
        except Exception as e:
            print(f"⚠️ ENHANCED TRANSLATION: Error applying domain prompt: {e}")
            domain_prompt = ""  # Continue without domain-specific prompt
    
    # Create context text
    context_text = ""
    if context and len(context) > 0:
        # Use summarization for very long contexts
        if len(context) > 30:
            print(f"📄 ENHANCED TRANSLATION: Summarizing long context ({len(context)} messages)")
            context_text = ContextSummarizer.summarize_context(context)
        else:
            context_text = "\n".join(context)
    
    # Build the complete instruction
    context_instruction = f"{base_instruction}\n\n{domain_prompt}" if domain_prompt else base_instruction
    
    if context_text:
        entities_info = ""
        if context_metadata and context_metadata.get('entities'):
            entities_info = "\nKey entities mentioned:"
            for entity_type, entity_list in context_metadata['entities'].items():
                if entity_list:
                    entities_info += f"\n- {entity_type}: {', '.join(list(set(entity_list))[:5])}"
        
        context_instruction = (
            f"You are translating a conversation between speakers. "
            f"Analyze the context carefully to understand the topic, references, and maintain consistency.\n\n"
            f"CONVERSATION CONTEXT:\n{context_text}"
            f"{entities_info}\n\n"
            f"Translation Guidelines:\n"
            f"- Preserve proper names and specialized terms\n"
            f"- Consider the established topic when translating ambiguous references\n"
            f"- Maintain conversational tone and emotional context\n"
            f"- Apply domain-specific knowledge if relevant\n\n"
            f"{context_instruction}\n\n"
            f"Translate the following text from {source_language} to {target_language}:"
        )
    
    # Clean up text
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    
    print(f"Model: {model}, Topic: {context_metadata.get('topic') if context_metadata else 'general'}")
    
    try:
        # Get translation from AI model
        translated_text = perform_ai_translation(text, context_instruction, model, user_id, "", "translate_with_enhanced_context")
        
        # Store in translation memory
        try:
            if context_metadata:
                TranslationMemoryManager.store_translation(
                    source_text=text,
                    translated_text=translated_text,
                    source_lang=source_language,
                    target_lang=target_language,
                    context=context[-10:] if context else [],
                    topic=context_metadata.get('topic'),
                    entities=[item for sublist in context_metadata.get('entities', {}).values() for item in sublist][:10]
                )
                print(f"💾 ENHANCED TRANSLATION: Stored translation in memory")
        except Exception as e:
            print(f"⚠️ ENHANCED TRANSLATION: Error storing translation memory: {e}")
        
        return translated_text
        
    except Exception as e:
        print(f"Enhanced translation error: {str(e)}")
        # Fallback to regular translation
        return get_translation(text, source_language, target_language, 'single', translation_mode, 'claude', user_id or '', '', 'translate_with_enhanced_context')

def clean_translation_response(response, original_text):
    """Clean AI response to extract only the translation"""
    
    # Remove common system prompt indicators
    indicators_to_remove = [
        "You are a direct translator",
        "Human:",
        "# noobyco/test",
        "CONVERSATION CONTEXT:",
        "IMPORTANT TRANSLATION GUIDELINES:",
        "Now translate the following text",
        "Output ONLY the translation",
        "Speaker A:",
        "Speaker B:"
    ]
    
    # Split response into lines
    lines = response.split('\n')
    cleaned_lines = []
    
    skip_line = False
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
            
        # Skip lines that contain system prompt indicators
        if any(indicator in line for indicator in indicators_to_remove):
            skip_line = True
            continue
            
        # Skip lines that look like context (Speaker A/B format)
        if line.startswith(('Speaker A:', 'Speaker B:')):
            continue
            
        # Skip lines that are clearly system instructions
        if line.startswith(('- If', '- Consider', '- Maintain', '- Preserve')):
            continue
            
        # If we find what looks like the actual translation, keep it
        if not skip_line and line:
            cleaned_lines.append(line)
    
    # Join cleaned lines
    cleaned_response = ' '.join(cleaned_lines)
    
    # If the cleaned response is too long compared to original, it might still contain prompt
    if len(cleaned_response) > len(original_text) * 5:
        # Try to find the shortest meaningful line that could be the translation
        shortest_meaningful = min(
            [line for line in lines if line.strip() and len(line.strip()) > 3], 
            key=len, 
            default=cleaned_response
        )
        
        # Check if this shortest line doesn't contain system indicators
        if not any(indicator in shortest_meaningful for indicator in indicators_to_remove):
            cleaned_response = shortest_meaningful.strip()
    
    return cleaned_response if cleaned_response else response

def perform_ai_translation(text, context_instruction, model, user_id="", session_id="", endpoint="perform_ai_translation"):
    """Helper function to perform the actual AI translation"""
    from .translation_helpers import estimate_token_count, record_api_usage

    # Ensure None values are converted to empty strings for consistency
    user_id = user_id or ""
    session_id = session_id or ""
    endpoint = endpoint or ""

    if model == 'claude':
        message = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=8192,
            temperature=0.1,
            system=context_instruction,
            messages=[{"role": "user", "content": text}]
        )

        if message.content:
            response = message.content[0].text.strip()

            # Record API usage for Claude
            if hasattr(message, 'usage'):
                input_tokens = getattr(message.usage, 'input_tokens', 0)
                output_tokens = getattr(message.usage, 'output_tokens', 0)
                record_api_usage('claude', input_tokens, output_tokens, endpoint, user_id, session_id)

            # Clean up response - remove any system prompt leakage
            response = clean_translation_response(response, text)

            return response
        else:
            return "Translation failed."
    
    elif model == 'gemini':
        # Estimate input tokens
        input_tokens = estimate_token_count(text + context_instruction)

        generation_config = types.GenerateContentConfig(
            temperature=0.1,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
            system_instruction=context_instruction
        )

        last_error = None
        for client in gemini_clients:
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[text],
                    config=generation_config
                )
                if response and hasattr(response, 'text'):
                    result = response.text.strip()

                    # Record API usage for Gemini
                    output_tokens = estimate_token_count(result)
                    record_api_usage('gemini', input_tokens, output_tokens, endpoint, user_id, session_id)

                    result = clean_translation_response(result, text)
                    return result
            except Exception as e:
                last_error = str(e)
                continue

        raise Exception(f"All Gemini API keys failed. Last error: {last_error}")
    
    elif model == 'deepseek':
        # Estimate tokens for DeepSeek (we'll track it but DeepSeek doesn't provide exact counts)
        input_tokens = estimate_token_count(text + context_instruction)

        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": context_instruction},
                {"role": "user", "content": text}
            ],
            stream=False
        )
        content = response.choices[0].message.content.strip()
        content = content.replace("<think>", "").replace("</think>", "").strip()

        # Record API usage for DeepSeek (estimated)
        output_tokens = estimate_token_count(content)
        record_api_usage('deepseek', input_tokens, output_tokens, endpoint, user_id, session_id)

        content = clean_translation_response(content, text)
        return content
    
    else:
        raise ValueError(f"Unknown model: {model}")

def translate_with_context(text, source_language, target_language, context, model, translation_mode="casual", user_id="", session_id=""):
    """Helper function for translation with conversation context"""

    # Make sure we have text to translate
    if not text:
        return "Translation failed - empty text"

    # Clean up text if it has quotes
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]

    # Ensure None values are converted to empty strings for consistency
    user_id = user_id or ""
    session_id = session_id or ""

    # Construct the system instruction to include context
    context_text = ""
    if context and len(context) > 0:
        context_text = "\n".join(context)
        print(f"Context topic analyzed: {len(context)} messages processed")
    else:
        print("Context topic analyzed: No context provided")

    # Create base translation instruction
    base_instruction = get_translation_instruction(source_language, target_language, 'single', translation_mode)
    
    # Add enhanced context instruction for topic awareness
    context_instruction = base_instruction
    if context_text:
        context_instruction = (
            f"You are translating a conversation between Speaker A and Speaker B. "
            f"Before translating, carefully analyze the conversation context to understand:\n"
            f"1. The main topic being discussed\n"
            f"2. Any specific references, names, or entities mentioned\n"
            f"3. Cultural references, character names, or specialized terms\n"
            f"4. The conversational flow and relationship between speakers\n\n"
            f"CONVERSATION CONTEXT:\n{context_text}\n\n"
            f"IMPORTANT TRANSLATION GUIDELINES:\n"
            f"- If the conversation is about anime, movies, games, or other media, preserve character names and titles\n"
            f"- If proper names or specific entities are mentioned, keep them in their original form or use widely recognized translations\n"
            f"- Consider the ongoing topic when translating ambiguous references (like 'he', 'she', 'it', 'that character')\n"
            f"- Maintain the conversational tone and emotional context\n"
            f"- If slang or colloquial expressions relate to the topic, translate them appropriately while preserving meaning\n\n"
            f"Now translate the following text from {source_language} to {target_language}, "
            f"keeping in mind the established topic and context. "
            f"Only output the translation, no explanations or additional text."
        )
    
    print(f"Model used: {model}")
    
    try:
        # Choose which model to use
        if model == 'claude':
            system_message = [
                {
                    "type": "text",
                    "text": base_instruction,
                    "cache_control": {"type": "ephemeral"}
                }
            ]
            
            # Add context instruction if there is context
            if context_text:
                system_message.append({
                    "type": "text", 
                    "text": context_instruction
                })
            
            
            message = anthropic_client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=8192,
                temperature=0.1,
                system=system_message,
                messages=[{"role": "user", "content": text}]
            )

            if message.content:
                result = message.content[0].text.strip()

                # Record API usage for Claude
                from .translation_helpers import record_api_usage
                if hasattr(message, 'usage'):
                    input_tokens = getattr(message.usage, 'input_tokens', 0)
                    output_tokens = getattr(message.usage, 'output_tokens', 0)
                    record_api_usage('claude', input_tokens, output_tokens, 'translate_with_context', user_id, session_id)

                # Clean up response to remove any system prompt leakage
                result = clean_translation_response(result, text)
                print(f"Claude response: {result}")
                return result
            else:
                return "Translation failed."
            
        elif model == 'gemini':
            # Estimate input tokens
            from .translation_helpers import estimate_token_count, record_api_usage
            input_tokens = estimate_token_count(text + context_instruction)

            # Configure generation parameters
            generation_config = types.GenerateContentConfig(
                temperature=0.1,
                top_p=0.95,
                top_k=40,
                max_output_tokens=8192,
                system_instruction=context_instruction
            )


            # Try each client until successful
            last_error = None
            for client in gemini_clients:
                try:
                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[text],
                        config=generation_config
                    )

                    if response and hasattr(response, 'text'):
                        result = response.text.strip()

                        # Record API usage for Gemini
                        output_tokens = estimate_token_count(result)
                        record_api_usage('gemini', input_tokens, output_tokens, 'translate_with_context', user_id, session_id)

                        print(f"Gemini response: {result}")
                        return result
                    
                except Exception as e:
                    last_error = str(e)
                    print(f"Gemini API error: {last_error}")
                    continue  # Try next client if current one fails
            
            if last_error:
                raise Exception(f"All Gemini API keys failed. Last error: {last_error}")
            else:
                raise Exception("All Gemini API keys failed with unknown error")
                
        elif model == 'deepseek':
            
            try:
                response = deepseek_client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[
                        {"role": "system", "content": context_instruction},
                        {"role": "user", "content": text}
                    ],
                    stream=False
                )

                content = response.choices[0].message.content.strip()
                # Clean think tags if present
                content = content.replace("<think>", "").replace("</think>", "").strip()
                print(f"DeepSeek response: {content}")
                return content
            except Exception as e:
                raise Exception(f"DeepSeek API error: {str(e)}")
        else:
            # Fallback to normal translation if model not recognized
            print(f"Unrecognized model '{model}', falling back to regular translation")
            return get_translation(text, source_language, target_language, 'single', translation_mode, 'claude', '', '', 'translate_with_context')
    except Exception as e:
        print(f"Context-aware translation error: {str(e)}")
        # Fallback to regular translation if context-aware fails
        try:
            return get_translation(text, source_language, target_language, 'single', translation_mode, 'claude', '', '', 'translate_with_context')
        except:
            return f"Translation failed: {str(e)}"
