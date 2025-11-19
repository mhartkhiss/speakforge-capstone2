from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from firebase_admin import db
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import helpers from the new location
from .translation_helpers import get_translation, process_translations, update_firebase_message
from .context_helpers import (
    get_connect_chat_context,
    get_enhanced_connect_chat_context,
    translate_with_context,
    translate_with_enhanced_context,
)
from .enhanced_context import (
    FeedbackProcessor,
    UserProfileManager
)

@api_view(['POST'])
@permission_classes([AllowAny])
def translate_db_context(request):
    """
    Endpoint for translating text with conversation context and storing results in Firebase.
    Specifically designed for connect chats with Speaker A/B context.
    Only uses messages from the current session to avoid cross-session context.
    """
    text_to_translate = request.data.get('text', '')
    source_language = request.data.get('source_language', 'auto')
    target_language = request.data.get('target_language', 'en')
    variants = request.data.get('variants', 'single')
    model = request.data.get('model', 'gemini').lower()
    room_id = request.data.get('room_id')
    message_id = request.data.get('message_id')
    current_user_id = request.data.get('current_user_id')
    recipient_id = request.data.get('recipient_id')
    translation_mode = request.data.get('translation_mode', 'casual')
    context_depth = request.data.get('context_depth', 25)  # Default to 25 for connect chats for better topic awareness
    use_context = request.data.get('use_context', True)
    session_start_time = request.data.get('session_start_time')  # Timestamp when current session started
    use_enhanced = request.data.get('use_enhanced', True)  # Enable enhanced features by default

    if not all([text_to_translate, room_id, message_id, current_user_id, recipient_id]):
        return Response({
            "error": "Missing required fields: text, room_id, message_id, current_user_id, or recipient_id"
        }, status=400)

    # OPTIMIZATION: Skip enhanced context for very short messages (< 10 words)
    word_count = len(text_to_translate.split())
    if word_count < 5 and use_enhanced:
        use_enhanced = False
        print(f"⚡ OPTIMIZATION: Skipping enhanced features for short message ({word_count} words)")

    try:
        # PARALLEL PROCESSING: Run independent tasks simultaneously
        context = []
        context_metadata = {}
        user_profile = None
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {}
            
            # Task 1: Get context (if enabled)
            if use_context:
                futures['context'] = executor.submit(
                    get_enhanced_connect_chat_context,
                    room_id, message_id, context_depth,
                    current_user_id, recipient_id,
                    session_start_time, use_enhanced
                )
            
            # Task 2: Get user preferences (runs in parallel with context retrieval)
            if use_enhanced and current_user_id:
                futures['profile'] = executor.submit(
                    UserProfileManager.get_user_preferences,
                    current_user_id
                )
            
            # Wait for context retrieval
            if 'context' in futures:
                try:
                    context, context_metadata = futures['context'].result()
                    print(f"Retrieved {len(context)} context messages with topic: {context_metadata.get('topic', 'general')}")
                except Exception as e:
                    print(f"Error getting enhanced connect chat context: {str(e)}")
                    # Fallback to basic context
                    try:
                        context = get_connect_chat_context(room_id, message_id, context_depth, current_user_id, recipient_id, session_start_time)
                    except:
                        pass  # Continue without context
            
            # Wait for user profile (if requested)
            if 'profile' in futures:
                try:
                    user_profile = futures['profile'].result()
                    print(f"✅ PARALLEL: Retrieved user profile in parallel")
                except Exception as e:
                    print(f"⚠️ PARALLEL: Error getting user profile: {str(e)}")

        # Get translation with enhanced context
        if context and len(context) > 0 and use_enhanced:
            print(f"🎯 TRANSLATION METHOD: Enhanced context translation (topic: {context_metadata.get('topic', 'unknown')})")
            try:
                translated_text = translate_with_enhanced_context(
                    text_to_translate, source_language, target_language, 
                    context, model, translation_mode, 
                    context_metadata, current_user_id
                )
            except Exception as e:
                print(f"⚠️ ENHANCED TRANSLATION FAILED: {e}")
                print(f"📝 FALLBACK: Using basic context translation instead")
                translated_text = translate_with_context(text_to_translate, source_language, target_language, context, model, translation_mode, current_user_id, room_id)
        elif context and len(context) > 0:
            print(f"📝 TRANSLATION METHOD: Basic context translation ({len(context)} messages)")
            translated_text = translate_with_context(text_to_translate, source_language, target_language, context, model, translation_mode, current_user_id, room_id)
        else:
            print(f"⚡ TRANSLATION METHOD: No context translation (fallback)")
            # Fallback to regular translation if no context
            translated_text = get_translation(text_to_translate, source_language, target_language, variants, translation_mode, model, current_user_id, room_id, 'translate_db_context')

        # Process translations and store in Firebase
        translations = process_translations(translated_text, variants)

        # Determine the correct Firebase reference path (should be connect_chats for connect chat sessions)
        ref_path = 'connect_chats'  # Always connect_chats for this endpoint

        # Update Firebase
        update_firebase_message(ref_path, room_id, message_id, translations, source_language, translation_mode, False, target_language)

        response_data = {
            'original_text': text_to_translate,
            'translations': translations,
            'source_language': source_language,
            'target_language': target_language,
            'variants': variants,
            'model': model,
            'translation_mode': translation_mode,
            'context_used': len(context) > 0,
            'context_messages': len(context),
            'speaker_identification': True
        }
        
        # Add enhanced metadata if available
        if context_metadata:
            response_data['context_metadata'] = {
                'topic': context_metadata.get('topic'),
                'topic_confidence': context_metadata.get('topic_confidence'),
                'entities_detected': bool(context_metadata.get('entities')),
                'complexity': context_metadata.get('complexity'),
                'optimized_window_size': context_metadata.get('window_size')
            }
        
        return Response(response_data)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": f"Context-aware translation failed: {str(e)}"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def regenerate_translation(request):
    """
    Regenerate translation for an existing message with different parameters.
    Works for connect chat messages.
    """
    room_id = request.data.get('room_id')
    message_id = request.data.get('message_id')
    source_language = request.data.get('source_language', 'auto')
    target_language = request.data.get('target_language', 'en')
    variants = request.data.get('variants', 'multiple')
    model = request.data.get('model', 'gemini').lower()
    translation_mode = request.data.get('translation_mode', 'casual')
    current_user_id = request.data.get('current_user_id')
    recipient_id = request.data.get('recipient_id')
    use_context = request.data.get('use_context', True)
    context_depth = request.data.get('context_depth', 25)
    session_start_time = request.data.get('session_start_time')
    use_enhanced = request.data.get('use_enhanced', True)  # Enable enhanced features

    if not all([room_id, message_id]):
        return Response({
            "error": "Missing required fields: room_id or message_id"
        }, status=400)

    try:
        # PARALLEL PROCESSING: Fetch message and context simultaneously
        ref_path = 'connect_chats'
        context = []
        context_metadata = {}
        user_profile = None
        message_data = None
        
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {}
            
            # Task 1: Get the message to regenerate
            futures['message'] = executor.submit(
                lambda: db.reference(f'{ref_path}/{room_id}/{message_id}').get()
            )
            
            # Task 2: Get conversation context (if enabled)
            if use_context and current_user_id and recipient_id:
                futures['context'] = executor.submit(
                    get_enhanced_connect_chat_context,
                    room_id, message_id, context_depth,
                    current_user_id, recipient_id,
                    session_start_time, use_enhanced
                )
            
            # Task 3: Get user preferences (if enabled)
            if use_enhanced and current_user_id:
                futures['profile'] = executor.submit(
                    UserProfileManager.get_user_preferences,
                    current_user_id
                )
            
            # Wait for message data
            message_data = futures['message'].result()
            if not message_data:
                return Response({"error": "Message not found"}, status=404)
            
            # Wait for context (if requested)
            if 'context' in futures:
                try:
                    context, context_metadata = futures['context'].result()
                    print(f"Regeneration: Retrieved {len(context)} context messages")
                except Exception as e:
                    print(f"Error getting context for regeneration: {str(e)}")
                    # Fallback to basic context
                    try:
                        context = get_connect_chat_context(room_id, message_id, context_depth, current_user_id, recipient_id, session_start_time)
                    except:
                        pass  # Continue without context
            
            # Wait for user profile (if requested)
            if 'profile' in futures:
                try:
                    user_profile = futures['profile'].result()
                    print(f"✅ PARALLEL REGEN: Retrieved user profile in parallel")
                except Exception as e:
                    print(f"⚠️ PARALLEL REGEN: Error getting user profile: {str(e)}")
        
        # Get the text to translate (use voiceText for connect chats)
        text_to_translate = message_data.get('voiceText', message_data.get('message', ''))
        
        if not text_to_translate:
            return Response({"error": "No text found to translate"}, status=400)

        # Get new translation with context
        if context and len(context) > 0 and use_enhanced:
            print(f"🎯 REGENERATION: Enhanced context translation")
            translated_text = translate_with_enhanced_context(
                text_to_translate, source_language, target_language, 
                context, model, translation_mode, 
                context_metadata, current_user_id
            )
        elif context and len(context) > 0:
            print(f"📝 REGENERATION: Basic context translation")
            translated_text = translate_with_context(text_to_translate, source_language, target_language, context, model, translation_mode, current_user_id, room_id)
        else:
            print(f"⚡ REGENERATION: No context translation")
            # Fallback to regular translation
            translated_text = get_translation(text_to_translate, source_language, target_language, variants, translation_mode, model, current_user_id, room_id, 'regenerate_translation')

        # Process translations
        translations = process_translations(translated_text, variants)

        # Update Firebase with new translations
        update_firebase_message(ref_path, room_id, message_id, translations, source_language, translation_mode, False, target_language)

        response_data = {
            'original_text': text_to_translate,
            'translations': translations,
            'source_language': source_language,
            'target_language': target_language,
            'variants': variants,
            'model': model,
            'translation_mode': translation_mode,
            'context_used': len(context) > 0,
            'context_messages': len(context),
            'regenerated': True
        }
        
        # Add enhanced metadata if available
        if context_metadata:
            response_data['context_metadata'] = {
                'topic': context_metadata.get('topic'),
                'topic_confidence': context_metadata.get('topic_confidence'),
                'entities_detected': bool(context_metadata.get('entities')),
                'complexity': context_metadata.get('complexity'),
                'optimized_window_size': context_metadata.get('window_size')
            }

        return Response(response_data)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Regeneration failed: {str(e)}")
        # Reset translation state on error
        try:
            ref_path = 'connect_chats'
            message_ref = db.reference(f'{ref_path}/{room_id}/{message_id}')
            message_ref.update({'translationState': None})
        except:
            pass
        return Response({"error": f"Translation regeneration failed: {str(e)}"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_translation_feedback(request):
    """
    Submit feedback on a translation for learning and improvement
    """
    user_id = request.data.get('user_id')
    original_text = request.data.get('original_text')
    original_translation = request.data.get('original_translation')
    corrected_translation = request.data.get('corrected_translation')
    source_language = request.data.get('source_language')
    target_language = request.data.get('target_language')
    session_id = request.data.get('session_id')
    context = request.data.get('context', '')
    
    if not all([user_id, original_text, original_translation, corrected_translation, source_language, target_language]):
        return Response({
            "error": "Missing required fields: user_id, original_text, original_translation, corrected_translation, source_language, target_language"
        }, status=400)
    
    try:
        # Record the feedback
        feedback = FeedbackProcessor.record_feedback(
            user_id=user_id,
            original_text=original_text,
            original_translation=original_translation,
            corrected_translation=corrected_translation,
            source_lang=source_language,
            target_lang=target_language,
            context=context,
            session_id=session_id
        )
        
        if feedback:
            return Response({
                'status': 'success',
                'message': 'Feedback recorded successfully',
                'feedback_id': feedback.id if hasattr(feedback, 'id') else 'mock',
                'glossary_updated': True if abs(len(original_translation) - len(corrected_translation)) > 3 else False
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Failed to record feedback'
            }, status=500)
            
    except Exception as e:
        print(f"Error recording feedback: {str(e)}")
        return Response({"error": f"Failed to record feedback: {str(e)}"}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_preferences(request):
    """
    Get user's translation preferences and profile
    """
    user_id = request.query_params.get('user_id')
    
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)
    
    try:
        preferences = UserProfileManager.get_user_preferences(user_id)
        profile = UserProfileManager.get_or_create_profile(user_id)
        
        return Response({
            'user_id': user_id,
            'preferences': preferences,
            'profile': {
                'preferred_formality': getattr(profile, 'preferred_formality', 'casual'),
                'domains_of_interest': getattr(profile, 'domains_of_interest', []),
                'glossary_entries': len(getattr(profile, 'personal_glossary', {})),
                'language_pairs': getattr(profile, 'language_pairs', {})
            }
        })
        
    except Exception as e:
        print(f"Error getting user preferences: {str(e)}")
        return Response({"error": f"Failed to get user preferences: {str(e)}"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def translate_simple(request):
    """
    Simple translation endpoint for basic and conversational translation modes.
    This endpoint is designed for mobile app basic translation and conversational activities.
    """
    text_to_translate = request.data.get('text', '')
    source_language = request.data.get('source_language', 'auto')
    target_language = request.data.get('target_language', 'en')
    variants = request.data.get('variants', 'single')
    model = request.data.get('model', 'gemini').lower()
    translation_mode = request.data.get('translation_mode', 'casual')
    user_id = request.data.get('user_id', '')
    
    if not text_to_translate:
        return Response({
            "error": "Missing required field: text"
        }, status=400)
    
    try:
        # Use the simple translation helper without context
        translated_text = get_translation(
            text_to_translate, 
            source_language, 
            target_language, 
            variants, 
            translation_mode, 
            model, 
            user_id, 
            '', # No room_id for simple translation
            'translate_simple'
        )
        
        # Process translations
        translations = process_translations(translated_text, variants)
        
        response_data = {
            'original_text': text_to_translate,
            'translations': translations,
            'source_language': source_language,
            'target_language': target_language,
            'variants': variants,
            'model': model,
            'translation_mode': translation_mode,
            'context_used': False,
            'endpoint': 'simple'
        }
        
        return Response(response_data)
        
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": f"Translation failed: {str(e)}"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_topic_classification(request):
    """
    Test endpoint to demonstrate advanced topic classification enhancements
    """
    messages = request.data.get('messages', [])
    
    if not messages:
        return Response({"error": "messages array is required"}, status=400)
    
    try:
        from .enhanced_context import TopicAnalyzer
        
        # Compare simple vs advanced classification
        comparison = TopicAnalyzer.compare_classification_methods(messages)
        
        return Response({
            'status': 'success',
            'comparison': comparison,
            'explanation': {
                'simple_method': 'Basic keyword counting with equal weights',
                'advanced_method': 'Weighted keywords + synonyms + patterns + semantic similarity',
                'ai_method': 'AI-powered multilingual topic classification',
                'enhancements_used': [
                    'AI-powered multilingual classification',
                    'Weighted keyword scoring (primary=3x, secondary=2x, context=1x)',
                    'Synonym replacement (cartoon→anime, coding→programming)',
                    'Context pattern matching (regex patterns)',
                    'Entity recognition bonus',
                    'Semantic similarity calculation',
                    'Multi-topic detection',
                    'Advanced confidence scoring'
                ]
            }
        })
        
    except Exception as e:
        return Response({"error": f"Topic classification test failed: {str(e)}"}, status=500)
