"""
Enhanced Context Analysis for Improved Translation
This module provides advanced context awareness features for AI translation
"""

import re
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Set
from collections import Counter, defaultdict
import json
from firebase_admin import db

# Import Django models
from ..models import (
    EntityTracking, 
    UserTranslationProfile, 
    ConversationTopic,
    ContextualTranslationMemory,
    TranslationFeedback,
    MessageCluster
)


class EntityExtractor:
    """Extract and track entities from conversations"""
    
    # Common patterns for entity detection (simplified to avoid over-extraction)
    PATTERNS = {
        'anime_character': [
            r'\b(?:tanjiro|giyu|akaza|shinobu|doma|rengoku|tengen|mitsuri|obanai|sanemi|gyomei)\b',  # Demon Slayer characters
            r'\b(?:naruto|sasuke|sakura|kakashi|goku|vegeta|luffy|zoro|ichigo|rukia|eren|mikasa|levi)\b',  # Popular anime characters
        ],
        'media_title': [
            r'\b(?:demon slayer|naruto|one piece|attack on titan|my hero academia|jujutsu kaisen)\b',  # Anime titles
            r'"[^"]+"|\'[^\']+\'',  # Quoted titles
        ],
        'place': [
            r'\b(?:japan|tokyo|school|university|office|home|theater|cinema|sinehan)\b',  # Actual places
        ],
        'tech_term': [
            r'\b(?:api|database|server|code|programming|software|app|algorithm|ai|ml)\b',  # Tech terms only
        ]
    }
    
    # Domain-specific entity lists (expanded for better detection)
    ANIME_CHARACTERS = {
        # Demon Slayer characters
        'tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'giyu', 'shinobu', 'rengoku', 
        'tengen', 'mitsuri', 'obanai', 'sanemi', 'gyomei', 'akaza', 'doma', 'kokushibo',
        'muzan', 'hashira', 'pillar',
        # Popular anime characters
        'naruto', 'sasuke', 'sakura', 'kakashi', 'goku', 'vegeta', 'luffy', 
        'zoro', 'ichigo', 'rukia', 'eren', 'mikasa', 'levi', 'edward', 'alphonse'
    }
    
    ANIME_TITLES = {
        'demon slayer', 'kimetsu no yaiba', 'naruto', 'one piece', 'attack on titan',
        'my hero academia', 'jujutsu kaisen', 'bleach', 'dragon ball', 'fullmetal alchemist'
    }
    
    TECH_TERMS = {
        'api', 'database', 'server', 'client', 'frontend', 'backend', 'algorithm',
        'machine learning', 'ai', 'neural network', 'blockchain', 'cloud'
    }
    
    @classmethod
    def extract_entities(cls, text: str, context: List[str] = None) -> Dict[str, List[str]]:
        """Optimized entity extraction - fast pattern matching with AI fallback"""
        if not text or len(text.strip()) < 3:
            return {}
        
        # Use fast pattern matching first, AI only when needed
        return cls.extract_entities_optimized(text, context)
    
    @classmethod
    def extract_entities_optimized(cls, text: str, context: List[str] = None) -> Dict[str, List[str]]:
        """Fast entity extraction using simple patterns - no AI calls"""
        entities = defaultdict(list)
        text_lower = text.lower()
        
        # Quick check for anime characters (most common case)
        anime_chars = []
        for character in cls.ANIME_CHARACTERS:
            if character.lower() in text_lower:
                anime_chars.append(character.title())
        if anime_chars:
            entities['anime_character'] = anime_chars[:3]
        
        # Quick check for anime titles
        anime_titles = []
        for title in cls.ANIME_TITLES:
            if title.lower() in text_lower:
                anime_titles.append(title.title())
        if anime_titles:
            entities['anime_title'] = anime_titles[:2]
        
        # Quick check for tech terms (only obvious ones)
        tech_terms = []
        for term in ['ai', 'api', 'code', 'app', 'software', 'database']:
            if term.lower() in text_lower:
                tech_terms.append(term)
        if tech_terms:
            entities['tech_term'] = tech_terms[:2]
        
        # Only use AI for complex entity extraction if:
        # 1. Text is longer than 50 characters AND
        # 2. No entities found with simple matching AND  
        # 3. Text contains potential entity indicators
        if (len(text) > 50 and 
            not entities and 
            any(indicator in text_lower for indicator in ['name', 'character', 'called', 'titled'])):
            
            print(f"🤖 USING AI: Complex entity extraction for: {text[:30]}...")
            ai_entities = cls.extract_entities_with_ai(text, context)
            entities.update(ai_entities)
        
        return dict(entities)
    
    @classmethod
    def extract_entities_with_ai(cls, text: str, context: List[str] = None) -> Dict[str, List[str]]:
        """Use AI to extract relevant entities from text"""
        try:
            from .translation_helpers import anthropic_client
            
            entity_prompt = f"""
Extract important entities from this message. Focus on names, places, products, or specific terms that are relevant for translation context.

MESSAGE: {text}

Extract entities in these categories:
- anime_character: Anime character names (Tanjiro, Giyu, Akaza, Shinobu, Doma, Naruto, etc.)
- anime_title: Anime/manga titles (Demon Slayer, Naruto, One Piece, etc.)
- person: Real person names or references
- place: Locations, venues, countries, cities
- tech_term: Technical terms, programming concepts, technology
- product: Brands, products, games, apps

Respond with ONLY the entities in this format:
category:entity1,entity2|category:entity1,entity2

If no relevant entities found, respond with: none

Example: anime_character:Shinobu,Doma|anime_title:Demon Slayer
"""

            message = anthropic_client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=150,
                temperature=0.1,
                system="You are an entity extractor. Extract only relevant entities, not full sentences.",
                messages=[{"role": "user", "content": entity_prompt}]
            )
            
            if message.content:
                response = message.content[0].text.strip()
                print(f"🎭 AI ENTITY RESPONSE: {response}")
                
                if response.lower() == 'none':
                    return {}
                
                # Parse response: "anime_character:Shinobu,Doma|anime_title:Demon Slayer"
                entities = {}
                if '|' in response:
                    categories = response.split('|')
                else:
                    categories = [response]
                
                for category_data in categories:
                    if ':' in category_data:
                        category, entity_list = category_data.split(':', 1)
                        category = category.strip()
                        entity_names = [e.strip() for e in entity_list.split(',') if e.strip()]
                        if entity_names:
                            entities[category] = entity_names[:3]  # Limit to 3 per category
                
                print(f"🎯 AI ENTITIES EXTRACTED: {entities}")
                return entities
                
        except Exception as e:
            print(f"⚠️ AI entity extraction failed: {e}")
        
        # Simple fallback - extract obvious anime characters
        entities = {}
        text_lower = text.lower()
        
        # Quick check for common anime characters
        anime_chars = []
        for character in ['tanjiro', 'giyu', 'akaza', 'shinobu', 'doma', 'naruto', 'goku']:
            if character in text_lower:
                anime_chars.append(character.title())
        
        if anime_chars:
            entities['anime_character'] = anime_chars
        
        return entities
    
    @classmethod
    def track_entity(cls, session_id: str, entity_type: str, entity_name: str, context: str = ""):
        """Store or update entity tracking in database"""
        try:
            # Try to import the model, if it fails, skip storing
            from ..models import EntityTracking
            entity, created = EntityTracking.objects.get_or_create(
                session_id=session_id,
                entity_type=entity_type,
                entity_name=entity_name,
                defaults={'entity_context': context}
            )
            if not created:
                entity.mention_count += 1
                entity.entity_context = f"{entity.entity_context}\n{context}" if context else entity.entity_context
                entity.save()
            return entity
        except Exception as e:
            print(f"Error tracking entity (models may not be migrated yet): {e}")
            return None


class TopicAnalyzer:
    """Analyze and classify conversation topics with advanced features"""
    
    # Keywords for topic classification with weights and synonyms
    TOPIC_KEYWORDS = {
        'anime': {
            'primary': ['anime', 'manga', 'otaku', 'demon slayer', 'hashira'],  # High weight keywords
            'secondary': ['episode', 'season', 'character', 'arc', 'shonen', 'seinen', 'kawaii', 'fight', 'epic'],  # Medium weight
            'context': ['watch', 'read', 'favorite', 'recommend', 'tanaw', 'makakita'],  # Context-dependent (including Bisaya)
            'entities': ['naruto', 'goku', 'luffy', 'ichigo', 'eren', 'tanjiro', 'giyu', 'akaza', 'shinobu', 'doma', 'rengoku'],  # Character names
            'synonyms': {'cartoon': 'anime', 'comic': 'manga', 'chapter': 'episode'}
        },
        'technology': {
            'primary': ['code', 'programming', 'software', 'api'],
            'secondary': ['app', 'database', 'server', 'algorithm', 'debug', 'deploy'],
            'context': ['develop', 'build', 'fix', 'implement'],
            'entities': ['python', 'javascript', 'react', 'nodejs', 'github'],
            'synonyms': {'coding': 'programming', 'bug': 'debug', 'repo': 'repository'}
        },
        'gaming': {
            'primary': ['game', 'gaming', 'gamer'],
            'secondary': ['play', 'level', 'quest', 'boss', 'multiplayer', 'console', 'pc', 'fps', 'rpg'],
            'context': ['stream', 'speedrun', 'competitive'],
            'entities': ['minecraft', 'fortnite', 'valorant', 'lol', 'dota'],
            'synonyms': {'pvp': 'multiplayer', 'mmo': 'multiplayer', 'npc': 'character'}
        },
        'sports': {
            'primary': ['sport', 'sports', 'match', 'game'],
            'secondary': ['team', 'player', 'score', 'goal', 'win', 'championship', 'league', 'tournament', 'coach'],
            'context': ['training', 'practice', 'season'],
            'entities': ['football', 'basketball', 'soccer', 'tennis', 'baseball'],
            'synonyms': {'soccer': 'football', 'hoops': 'basketball'}
        },
        'food': {
            'primary': ['food', 'eat', 'cooking', 'recipe'],
            'secondary': ['cook', 'restaurant', 'dish', 'meal', 'taste', 'flavor', 'ingredient', 'cuisine'],
            'context': ['hungry', 'delicious', 'spicy', 'sweet'],
            'entities': ['pizza', 'sushi', 'burger', 'pasta', 'ramen'],
            'synonyms': {'yummy': 'delicious', 'spice': 'spicy'}
        },
        'travel': {
            'primary': ['travel', 'trip', 'vacation'],
            'secondary': ['visit', 'flight', 'hotel', 'tourist', 'destination', 'journey', 'explore', 'adventure'],
            'context': ['passport', 'luggage', 'sightseeing'],
            'entities': ['japan', 'paris', 'tokyo', 'london', 'newyork'],
            'synonyms': {'holiday': 'vacation', 'tour': 'trip'}
        },
        'business': {
            'primary': ['business', 'work', 'job'],
            'secondary': ['meeting', 'project', 'deadline', 'client', 'report', 'presentation', 'budget', 'strategy', 'revenue', 'profit'],
            'context': ['office', 'company', 'corporate'],
            'entities': ['microsoft', 'google', 'apple', 'amazon'],
            'synonyms': {'corp': 'corporate', 'biz': 'business'}
        },
        'education': {
            'primary': ['education', 'school', 'university', 'college', 'capstone', 'project'],
            'secondary': ['study', 'learn', 'class', 'teacher', 'student', 'exam', 'homework', 'course', 'degree', 'deadline', 'submit'],
            'context': ['grade', 'assignment', 'lecture', 'scores', 'deductions'],
            'entities': ['harvard', 'mit', 'stanford', 'oxford'],
            'synonyms': {'uni': 'university', 'prof': 'professor'}
        },
        'finance': {
            'primary': ['money', 'borrow', 'loan', 'finance', 'broke'],
            'secondary': ['payment', 'cash', 'bank', 'budget', 'cost', 'price', 'expensive', 'cheap'],
            'context': ['pay', 'spend', 'save', 'afford'],
            'entities': ['paypal', 'visa', 'mastercard', 'gcash'],
            'synonyms': {'kwarta': 'money', 'utang': 'borrow'}
        },
        'health': {
            'primary': ['health', 'medical', 'doctor'],
            'secondary': ['medicine', 'hospital', 'symptom', 'treatment', 'exercise', 'diet', 'wellness', 'therapy'],
            'context': ['sick', 'pain', 'healthy', 'fitness'],
            'entities': ['covid', 'flu', 'diabetes', 'cancer'],
            'synonyms': {'doc': 'doctor', 'meds': 'medicine'}
        },
        'music': {
            'primary': ['music', 'song', 'artist', 'band'],
            'secondary': ['album', 'concert', 'melody', 'lyrics', 'genre', 'playlist'],
            'context': ['listen', 'sing', 'dance', 'beat'],
            'entities': ['spotify', 'youtube', 'beatles', 'taylor swift'],
            'synonyms': {'track': 'song', 'gig': 'concert'}
        },
    }
    
    # Learned keywords from conversations (dynamic learning)
    LEARNED_KEYWORDS = {}
    
    # Context patterns that indicate topics
    CONTEXT_PATTERNS = {
        'anime': [
            r'what.*anime.*watch',
            r'favorite.*character',
            r'episode.*\d+',
            r'season.*\d+'
        ],
        'technology': [
            r'how.*code',
            r'error.*\w+',
            r'function.*\w+',
            r'install.*\w+'
        ],
        'gaming': [
            r'play.*game',
            r'level.*\d+',
            r'beat.*boss',
            r'rank.*\w+'
        ]
    }
    
    @classmethod
    def classify_topic(cls, messages: List[str]) -> Tuple[str, float, List[str]]:
        """
        Pure AI-powered topic classification - flexible and context-aware
        Returns: (topic_category, confidence_score, keywords_found)
        """
        if not messages:
            return ('general', 0.5, [])
        
        # Use pure AI classification - no hardcoded keywords needed
        return cls.classify_topic_pure_ai(messages)
    
    @classmethod
    def classify_topic_pure_ai(cls, messages: List[str]) -> Tuple[str, float, List[str]]:
        """
        Optimized AI-based topic classification with smart caching
        """
        if not messages:
            return ('general', 0.5, [])
        
        # Only analyze if we have meaningful content
        conversation = "\n".join(messages)
        if len(conversation.strip()) < 10:
            return ('general', 0.5, [])
        
        # REMOVED: Hardcoded topic_shift_indicators and periodic checks.
        # We now allow the AI to analyze every message sequence to ensure 
        # dynamic topic shifts are detected immediately without manual keyword maintenance.
        
        print(f"🤖 AI TOPIC: Using AI classification (Always Active for Dynamic Awareness)")
        
        # Prepare conversation context (limit for performance)
        recent_context = "\n".join(messages[-5:])  # Only last 5 messages for speed
        
        # Create a focused prompt for quick topic detection
        classification_prompt = f"""
Analyze this conversation and identify the current main topic or intent.
Do NOT pick from a predefined list. Generate a concise, natural description of the topic (2-5 words).

Examples:
- Casual Greeting
- Making Weekend Plans
- Discussing Anime Characters
- Debugging Python Code
- Asking for Directions
- Ordering Food

RECENT CONVERSATION:
{recent_context}

Respond with ONLY: topic,confidence
Example: Casual Greeting,0.95
"""

        try:
            # Use Claude for intelligent classification
            from .translation_helpers import anthropic_client
            
            message = anthropic_client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=50,  # Keep it short for speed
                temperature=0.1,
                system="You are a fast topic classifier. Focus on recent messages and topic shifts.",
                messages=[{"role": "user", "content": classification_prompt}]
            )
            
            if message.content:
                response = message.content[0].text.strip()
                print(f"🤖 AI TOPIC RESPONSE: {response}")
                
                # Parse response: "anime,0.85"
                if ',' in response:
                    topic, confidence_str = response.split(',', 1)
                    topic = topic.strip() # Preserve original casing (e.g., "Casual Greeting")
                    
                    try:
                        confidence = float(confidence_str.strip())
                        confidence = max(0.0, min(1.0, confidence))  # Clamp 0-1
                        
                        # Extract simple keywords from the recent context
                        keywords = cls._extract_simple_keywords(recent_context, topic)
                        
                        print(f"🎯 AI TOPIC RESULT: {topic} (confidence: {confidence:.2f})")
                        return (topic, confidence, keywords)
                    except ValueError:
                        print(f"⚠️ AI TOPIC: Failed to parse confidence: {confidence_str}")
                        pass
            
        except Exception as e:
            print(f"⚠️ AI topic classification failed: {e}")
        
        # Simple fallback - just return general
        print(f"🔄 FALLBACK: Using general topic classification")
        return ('general', 0.5, [])
    
    @classmethod
    def _extract_simple_keywords(cls, text: str, topic: str) -> List[str]:
        """Extract simple keywords from text based on topic"""
        words = text.lower().split()
        topic_lower = topic.lower()
        
        # Topic-specific keyword extraction
        if 'anime' in topic_lower:
            keywords = [w for w in words if w in ['anime', 'character', 'episode', 'watch', 'tanaw', 'demon', 'slayer', 'naruto']]
        elif 'education' in topic_lower or 'school' in topic_lower:
            keywords = [w for w in words if w in ['project', 'capstone', 'deadline', 'submit', 'school', 'university']]
        elif 'finance' in topic_lower or 'money' in topic_lower:
            keywords = [w for w in words if w in ['money', 'borrow', 'broke', 'utang', 'kwarta', 'payment']]
        else:
            keywords = [w for w in words if len(w) > 4][:3]  # General keywords
        
        return keywords[:5]
    
    @classmethod
    def classify_topic_advanced(cls, messages: List[str]) -> Tuple[str, float, List[str]]:
        """
        FUTURE ENHANCEMENT 1: Advanced topic classification with weighted scoring,
        context awareness, synonym handling, and pattern matching
        """
        if not messages:
            return ('general', 0.5, [])
        
        # Combine all messages for analysis
        combined_text = ' '.join(messages).lower()
        
        # ENHANCEMENT: Apply synonym replacement for better matching
        processed_text = cls._apply_synonyms(combined_text)
        
        # Calculate scores for each topic using multiple techniques
        topic_scores = {}
        topic_keywords_found = {}
        
        for topic, keyword_data in cls.TOPIC_KEYWORDS.items():
            total_score = 0
            found_keywords = []
            
            # ENHANCEMENT 1: Weighted keyword scoring
            # Primary keywords get 3x weight, secondary 2x, context 1x
            for keyword in keyword_data['primary']:
                count = processed_text.count(keyword.lower())
                if count > 0:
                    total_score += count * 3  # High weight
                    found_keywords.append(f"{keyword}(primary)")
            
            for keyword in keyword_data['secondary']:
                count = processed_text.count(keyword.lower())
                if count > 0:
                    total_score += count * 2  # Medium weight
                    found_keywords.append(f"{keyword}(secondary)")
            
            for keyword in keyword_data['context']:
                count = processed_text.count(keyword.lower())
                if count > 0:
                    total_score += count * 1  # Low weight
                    found_keywords.append(f"{keyword}(context)")
            
            # ENHANCEMENT 2: Entity recognition bonus
            for entity in keyword_data['entities']:
                if entity.lower() in processed_text:
                    total_score += 2  # Entity bonus
                    found_keywords.append(f"{entity}(entity)")
            
            # ENHANCEMENT 3: Context pattern matching
            pattern_score = cls._check_context_patterns(combined_text, topic)
            total_score += pattern_score
            if pattern_score > 0:
                found_keywords.append(f"pattern_match({pattern_score})")
            
            # ENHANCEMENT 4: Semantic similarity (simplified version)
            semantic_score = cls._calculate_semantic_similarity(combined_text, topic)
            total_score += semantic_score
            if semantic_score > 0:
                found_keywords.append(f"semantic({semantic_score:.1f})")
            
            topic_scores[topic] = total_score
            topic_keywords_found[topic] = found_keywords
        
        # ENHANCEMENT 5: Multi-topic support - check if multiple topics are present
        sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
        
        if not sorted_topics or sorted_topics[0][1] == 0:
            return ('general', 0.5, [])
        
        best_topic, best_score = sorted_topics[0]
        
        # ENHANCEMENT 6: Improved confidence calculation
        confidence = cls._calculate_advanced_confidence(
            best_score, combined_text, topic_keywords_found[best_topic]
        )
        
        # ENHANCEMENT 7: Multi-topic detection
        if len(sorted_topics) > 1 and sorted_topics[1][1] > best_score * 0.7:
            # Multiple strong topics detected
            second_topic = sorted_topics[1][0]
            hybrid_topic = f"{best_topic}+{second_topic}"
            return (hybrid_topic, confidence * 0.9, topic_keywords_found[best_topic])
        
        return (best_topic, confidence, topic_keywords_found[best_topic])
    
    @classmethod
    def _apply_synonyms(cls, text: str) -> str:
        """ENHANCEMENT: Apply synonym replacement to improve matching"""
        processed_text = text
        for topic_data in cls.TOPIC_KEYWORDS.values():
            for original, replacement in topic_data.get('synonyms', {}).items():
                processed_text = processed_text.replace(original.lower(), replacement.lower())
        return processed_text
    
    @classmethod
    def _check_context_patterns(cls, text: str, topic: str) -> float:
        """ENHANCEMENT: Check for context patterns using regex"""
        import re
        
        patterns = cls.CONTEXT_PATTERNS.get(topic, [])
        score = 0
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            score += len(matches) * 2  # Pattern match bonus
        
        return score
    
    @classmethod
    def _calculate_semantic_similarity(cls, text: str, topic: str) -> float:
        """
        ENHANCEMENT: Simplified semantic similarity calculation
        In a real implementation, this would use word embeddings or ML models
        """
        # This is a simplified version - real implementation would use:
        # - Word2Vec, GloVe, or BERT embeddings
        # - Cosine similarity between text and topic representations
        # - Pre-trained topic classification models
        
        topic_data = cls.TOPIC_KEYWORDS.get(topic, {})
        all_topic_words = (
            topic_data.get('primary', []) + 
            topic_data.get('secondary', []) + 
            topic_data.get('context', []) + 
            topic_data.get('entities', [])
        )
        
        text_words = set(text.lower().split())
        topic_words = set(word.lower() for word in all_topic_words)
        
        # Jaccard similarity as a proxy for semantic similarity
        if text_words and topic_words:
            intersection = len(text_words & topic_words)
            union = len(text_words | topic_words)
            similarity = intersection / union if union > 0 else 0
            return similarity * 3  # Scale for scoring
        
        return 0
    
    @classmethod
    def _calculate_advanced_confidence(cls, score: float, text: str, keywords_found: List[str]) -> float:
        """ENHANCEMENT: Advanced confidence calculation"""
        if score == 0:
            return 0.5
        
        # Base confidence from score density
        total_words = len(text.split())
        base_confidence = min(score / (total_words * 0.03), 1.0)
        
        # Bonus for diverse keyword types
        keyword_types = set()
        for keyword in keywords_found:
            if '(' in keyword:
                keyword_type = keyword.split('(')[1].rstrip(')')
                keyword_types.add(keyword_type)
        
        diversity_bonus = len(keyword_types) * 0.1
        
        # Bonus for pattern matches
        pattern_bonus = 0.2 if any('pattern' in k for k in keywords_found) else 0
        
        # Final confidence
        confidence = min(base_confidence + diversity_bonus + pattern_bonus, 1.0)
        return max(confidence, 0.1)  # Minimum confidence
    
    @classmethod
    def learn_from_feedback(cls, text: str, correct_topic: str, confidence: float):
        """
        ENHANCEMENT: Dynamic keyword learning from user feedback
        This would learn new keywords associated with topics
        """
        if confidence > 0.8:  # Only learn from high-confidence corrections
            words = text.lower().split()
            
            # Extract potential new keywords (nouns, adjectives)
            # In real implementation, would use NLP libraries like spaCy
            potential_keywords = [word for word in words if len(word) > 3]
            
            if correct_topic not in cls.LEARNED_KEYWORDS:
                cls.LEARNED_KEYWORDS[correct_topic] = []
            
            for keyword in potential_keywords[:3]:  # Limit learning
                if keyword not in cls.LEARNED_KEYWORDS[correct_topic]:
                    cls.LEARNED_KEYWORDS[correct_topic].append(keyword)
                    print(f"Learned new keyword '{keyword}' for topic '{correct_topic}'")
    
    @classmethod
    def classify_topic_simple(cls, messages: List[str]) -> Tuple[str, float, List[str]]:
        """Original simple classification method for comparison"""
        if not messages:
            return ('general', 0.5, [])
        
        combined_text = ' '.join(messages).lower()
        topic_scores = {}
        topic_keywords_found = {}
        
        # Use old flat keyword structure for comparison
        old_keywords = {
            'anime': ['anime', 'manga', 'episode', 'season', 'character'],
            'technology': ['code', 'programming', 'software', 'app', 'api'],
            'gaming': ['game', 'play', 'level', 'quest', 'boss'],
        }
        
        for topic, keywords in old_keywords.items():
            score = 0
            found_keywords = []
            for keyword in keywords:
                count = combined_text.count(keyword.lower())
                if count > 0:
                    score += count
                    found_keywords.append(keyword)
            topic_scores[topic] = score
            topic_keywords_found[topic] = found_keywords
        
        if topic_scores:
            best_topic = max(topic_scores, key=topic_scores.get)
            if topic_scores[best_topic] > 0:
                total_words = len(combined_text.split())
                confidence = min(topic_scores[best_topic] / (total_words * 0.05), 1.0)
                return (best_topic, confidence, topic_keywords_found[best_topic])
        
        return ('general', 0.5, [])
    
    @classmethod
    def classify_topic_with_ai(cls, messages: List[str]) -> Tuple[str, float, List[str]]:
        """
        ENHANCED: Use AI models to classify topics in any language
        This leverages the same AI that's doing translation
        """
        if not messages:
            return ('general', 0.5, [])
        
        # Limit context for API efficiency
        recent_messages = messages[-10:] if len(messages) > 10 else messages
        context_text = "\n".join(recent_messages)
        
        # Create a focused prompt for topic classification with recent message emphasis
        recent_context = "\n".join(recent_messages[-3:]) if len(recent_messages) > 3 else context_text
        
        classification_prompt = f"""
Analyze this conversation and identify the CURRENT main topic based on the most recent messages. The messages may be in different languages.

RECENT CONVERSATION (focus on these):
{recent_context}

FULL CONTEXT (for reference):
{context_text}

Classify the CURRENT topic as ONE of these categories:
- anime (Japanese animation, manga, characters like Tanjiro/Giyu/Akaza/Shinobu/Doma, episodes, otaku culture, Demon Slayer, Naruto, etc.)
- technology (programming, software, apps, coding, tech products, AI, databases, servers)
- gaming (video games, gaming, esports, game characters, gaming platforms)
- sports (any sports, teams, matches, athletes, competitions)
- food (cooking, restaurants, recipes, cuisine, eating)
- travel (trips, vacation, destinations, tourism, flights)
- business (work, meetings, projects, corporate, professional)
- education (school, university, studying, learning, academics, capstone, projects, deadlines)
- health (medical, fitness, wellness, healthcare, exercise)
- music (songs, artists, concerts, instruments, genres)
- finance (money, borrowing, loans, payments, broke, financial discussions)
- general (casual conversation, greetings, or mixed topics)

IMPORTANT: Focus on the MOST RECENT messages to detect topic shifts. If recent messages mention anime characters, choose 'anime' even if earlier messages were about other topics.

Respond with ONLY the topic name and confidence (0.0-1.0), separated by a comma.
Example: anime,0.85
"""

        try:
            # Use Claude for classification (fast and multilingual)
            from .translation_helpers import anthropic_client
            
            print(f"🤖 AI TOPIC CLASSIFICATION: Analyzing recent messages: {recent_context[:100]}...")
            
            message = anthropic_client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=50,  # Very short response needed
                temperature=0.1,
                system="You are a topic classifier. Respond only with: topic,confidence",
                messages=[{"role": "user", "content": classification_prompt}]
            )
            
            if message.content:
                response = message.content[0].text.strip()
                print(f"🤖 AI TOPIC RESPONSE: {response}")
                
                # Parse response: "anime,0.85"
                if ',' in response:
                    topic, confidence_str = response.split(',', 1)
                    topic = topic.strip().lower()
                    
                    try:
                        confidence = float(confidence_str.strip())
                        confidence = max(0.0, min(1.0, confidence))  # Clamp 0-1
                        
                        # Extract keywords mentioned in the conversation
                        keywords = cls._extract_topic_keywords_ai(context_text, topic)
                        
                        print(f"🎯 AI TOPIC RESULT: {topic} (confidence: {confidence:.2f})")
                        return (topic, confidence, keywords)
                    except ValueError:
                        print(f"⚠️ AI TOPIC: Failed to parse confidence from: {confidence_str}")
                        pass
            
        except Exception as e:
            print(f"AI topic classification failed: {e}")
        
        # Fallback to keyword-based for reliability
        return cls.classify_topic_simple(messages)
    
    @classmethod
    def _extract_topic_keywords_ai(cls, text: str, topic: str) -> List[str]:
        """Extract relevant keywords that led to the topic classification"""
        # This could also use AI, but for now use simple extraction
        words = text.lower().split()
        
        # Get topic-relevant words (simplified)
        topic_indicators = {
            'anime': ['anime', 'manga', 'episode', 'character', 'season', 'otaku'],
            'technology': ['code', 'programming', 'software', 'app', 'api', 'tech'],
            'gaming': ['game', 'play', 'level', 'gaming', 'player', 'console'],
            'sports': ['sport', 'team', 'match', 'game', 'player', 'score'],
            'food': ['food', 'eat', 'cook', 'restaurant', 'recipe', 'meal'],
            'travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'visit'],
            'business': ['work', 'business', 'meeting', 'project', 'office', 'job'],
            'education': ['school', 'study', 'university', 'learn', 'student', 'class'],
            'health': ['health', 'doctor', 'medical', 'exercise', 'fitness', 'hospital'],
            'music': ['music', 'song', 'artist', 'band', 'concert', 'album']
        }
        
        indicators = topic_indicators.get(topic, [])
        found_keywords = []
        
        for word in words:
            if any(indicator in word.lower() for indicator in indicators):
                found_keywords.append(word)
        
        return found_keywords[:5]  # Limit to 5 keywords
    
    @classmethod
    def compare_classification_methods(cls, messages: List[str]) -> Dict:
        """
        Compare different topic classification methods
        Useful for testing and demonstrating improvements
        """
        simple_result = cls.classify_topic_simple(messages)
        advanced_result = cls.classify_topic_advanced(messages)
        ai_result = cls.classify_topic_with_ai(messages)
        
        return {
            'messages': messages,
            'simple': {
                'topic': simple_result[0],
                'confidence': simple_result[1],
                'keywords': simple_result[2],
                'method': 'keyword_counting',
                'limitations': 'English keywords only, equal weights'
            },
            'advanced': {
                'topic': advanced_result[0],
                'confidence': advanced_result[1],
                'keywords': advanced_result[2],
                'method': 'weighted_semantic_patterns',
                'limitations': 'Still English-centric, complex maintenance'
            },
            'ai_powered': {
                'topic': ai_result[0],
                'confidence': ai_result[1],
                'keywords': ai_result[2],
                'method': 'ai_multilingual_classification',
                'advantages': 'Works with any language, contextual understanding'
            },
            'recommendation': {
                'best_method': 'ai_powered',
                'reason': 'Handles multilingual conversations, leverages existing AI infrastructure',
                'cost': 'Minimal - uses same AI already processing translations'
            }
        }
    
    @classmethod
    def store_topic(cls, session_id: str, topic_category: str, confidence: float, 
                   keywords: List[str], timestamp: datetime) -> Optional[ConversationTopic]:
        """Store conversation topic in database"""
        try:
            # Try to import the model, if it fails, skip storing
            from ..models import ConversationTopic
            topic = ConversationTopic.objects.create(
                session_id=session_id,
                topic_category=topic_category,
                confidence_score=confidence,
                keywords=keywords,
                start_timestamp=timestamp
            )
            return topic
        except Exception as e:
            print(f"Error storing topic (models may not be migrated yet): {e}")
            return None


class ContextWindowManager:
    """Manage dynamic context window sizing based on conversation complexity"""
    
    @classmethod
    def calculate_optimal_window_size(cls, messages: List[Dict], 
                                     topic_continuity: bool = True,
                                     complexity_score: float = 0.5) -> int:
        """
        Calculate optimal context window size based on various factors
        """
        base_size = 10  # Base context window
        
        # Adjust based on topic continuity
        if topic_continuity:
            base_size += 5  # Add more context if topic is continuous
        
        # Adjust based on complexity
        if complexity_score > 0.7:
            base_size += 10  # More context for complex discussions
        elif complexity_score > 0.5:
            base_size += 5
        
        # Check for Q&A patterns (need both question and answer)
        qa_pairs = cls._detect_qa_pairs(messages)
        if qa_pairs:
            base_size = max(base_size, len(qa_pairs) * 2)
        
        # Cap at maximum for performance
        return min(base_size, 50)
    
    @classmethod
    def _detect_qa_pairs(cls, messages: List[Dict]) -> List[Tuple[int, int]]:
        """Detect question-answer pairs in messages"""
        qa_pairs = []
        for i, msg in enumerate(messages[:-1]):
            text = msg.get('data', {}).get('message', '').lower()
            if any(q in text for q in ['?', 'what', 'how', 'why', 'when', 'where', 'who']):
                # This might be a question, pair it with the next message
                qa_pairs.append((i, i+1))
        return qa_pairs
    
    @classmethod
    def assess_complexity(cls, text: str) -> float:
        """Assess the complexity of text content"""
        complexity_indicators = {
            'technical_terms': len(re.findall(r'\b[A-Z]{2,}\b', text)),  # Acronyms
            'long_words': len([w for w in text.split() if len(w) > 10]),
            'numbers': len(re.findall(r'\b\d+\b', text)),
            'special_chars': len(re.findall(r'[^a-zA-Z0-9\s]', text)),
            'sentence_length': len(text.split('.'))
        }
        
        # Calculate complexity score (0-1)
        total_indicators = sum(complexity_indicators.values())
        word_count = len(text.split())
        
        if word_count > 0:
            complexity = min(total_indicators / (word_count * 0.2), 1.0)
        else:
            complexity = 0.5
        
        return complexity


class SemanticClusterer:
    """Cluster messages based on semantic similarity"""
    
    @classmethod
    def cluster_messages(cls, messages: List[Dict]) -> List[Dict]:
        """
        Group messages into semantic clusters
        Returns list of clusters with message indices
        """
        clusters = []
        current_cluster = []
        current_topic = None
        
        for i, msg in enumerate(messages):
            msg_data = msg.get('data', {})
            text = msg_data.get('message', '')
            
            # Simple topic detection based on keywords
            detected_topic = cls._detect_message_topic(text)
            
            if detected_topic == current_topic or current_topic is None:
                current_cluster.append(i)
                current_topic = detected_topic
            else:
                # Topic changed, save current cluster and start new one
                if current_cluster:
                    clusters.append({
                        'indices': current_cluster,
                        'topic': current_topic,
                        'type': 'topic_segment'
                    })
                current_cluster = [i]
                current_topic = detected_topic
        
        # Add the last cluster
        if current_cluster:
            clusters.append({
                'indices': current_cluster,
                'topic': current_topic,
                'type': 'topic_segment'
            })
        
        return clusters
    
    @classmethod
    def _detect_message_topic(cls, text: str) -> str:
        """Simple topic detection for a single message"""
        text_lower = text.lower()
        
        # Quick topic detection based on keywords
        if any(word in text_lower for word in ['anime', 'episode', 'character']):
            return 'anime'
        elif any(word in text_lower for word in ['code', 'api', 'function']):
            return 'tech'
        elif '?' in text:
            return 'question'
        else:
            return 'general'
    
    @classmethod
    def find_related_messages(cls, current_message: str, 
                            all_messages: List[str], 
                            threshold: float = 0.5) -> List[int]:
        """Find messages semantically related to the current one"""
        related_indices = []
        current_words = set(current_message.lower().split())
        
        for i, msg in enumerate(all_messages):
            msg_words = set(msg.lower().split())
            
            # Calculate simple similarity (Jaccard similarity)
            if current_words and msg_words:
                similarity = len(current_words & msg_words) / len(current_words | msg_words)
                if similarity >= threshold:
                    related_indices.append(i)
        
        return related_indices


class UserProfileManager:
    """Manage user-specific translation profiles and preferences"""
    
    @classmethod
    def get_or_create_profile(cls, user_id: str):
        """Get or create a user translation profile"""
        try:
            # Try to import the model, if it fails, return default profile
            from ..models import UserTranslationProfile
            profile, created = UserTranslationProfile.objects.get_or_create(
                user_id=user_id,
                defaults={
                    'preferred_formality': 'casual',
                    'domains_of_interest': [],
                    'personal_glossary': {},
                    'language_pairs': {},
                    'style_preferences': {}
                }
            )
            return profile
        except Exception as e:
            print(f"Error accessing user profile (models may not be migrated yet): {e}")
            # Return a mock profile object
            class MockProfile:
                def __init__(self):
                    self.preferred_formality = 'casual'
                    self.domains_of_interest = []
                    self.personal_glossary = {}
                    self.language_pairs = {}
                    self.style_preferences = {}
                def save(self):
                    pass
            return MockProfile()
    
    @classmethod
    def update_domain_interest(cls, user_id: str, domain: str, weight: float = 1.0):
        """Update user's domain interests based on conversation topics"""
        profile = cls.get_or_create_profile(user_id)
        
        domains = profile.domains_of_interest
        # Update domain weight
        domain_found = False
        for i, d in enumerate(domains):
            if isinstance(d, dict) and d.get('domain') == domain:
                domains[i]['weight'] = d.get('weight', 0) + weight
                domain_found = True
                break
        
        if not domain_found:
            domains.append({'domain': domain, 'weight': weight})
        
        # Sort by weight and keep top 10
        domains.sort(key=lambda x: x.get('weight', 0), reverse=True)
        profile.domains_of_interest = domains[:10]
        profile.save()
    
    @classmethod
    def add_glossary_term(cls, user_id: str, original: str, translation: str, 
                          language_pair: str = None):
        """Add a term to user's personal glossary"""
        profile = cls.get_or_create_profile(user_id)
        
        if language_pair:
            key = f"{original}|{language_pair}"
        else:
            key = original
        
        profile.personal_glossary[key] = translation
        profile.save()
    
    @classmethod
    def get_user_preferences(cls, user_id: str, context_type: str = None) -> Dict:
        """Get user's translation preferences for a given context"""
        profile = cls.get_or_create_profile(user_id)
        
        preferences = {
            'formality': profile.preferred_formality,
            'glossary': profile.personal_glossary,
            'domains': profile.domains_of_interest
        }
        
        # Get context-specific preferences if available
        if context_type and profile.style_preferences:
            context_prefs = profile.style_preferences.get(context_type, {})
            preferences.update(context_prefs)
        
        return preferences


class ContextSummarizer:
    """Create concise summaries of long conversations"""
    
    @classmethod
    def summarize_context(cls, messages: List[str], max_length: int = 500) -> str:
        """Create a summary of conversation context"""
        if not messages:
            return ""
        
        # For very long conversations, create a summary
        if len(messages) > 30:
            # Extract key information
            topics = TopicAnalyzer.classify_topic(messages)
            entities = cls._extract_all_entities(messages)
            
            summary_parts = []
            
            # Add topic information
            if topics[0] != 'general':
                summary_parts.append(f"Discussion about {topics[0]}")
            
            # Add key entities
            if entities:
                entity_summary = cls._format_entities(entities)
                if entity_summary:
                    summary_parts.append(f"Mentions: {entity_summary}")
            
            # Add recent context
            summary_parts.append("Recent messages:")
            
            # Include last 10 messages
            recent_messages = messages[-10:]
            summary = ". ".join(summary_parts) + "\n" + "\n".join(recent_messages)
            
            return summary[:max_length] if len(summary) > max_length else summary
        
        # For shorter conversations, return all messages
        return "\n".join(messages)
    
    @classmethod
    def _extract_all_entities(cls, messages: List[str]) -> Dict[str, Set[str]]:
        """Extract all entities from messages"""
        all_entities = defaultdict(set)
        
        for msg in messages:
            entities = EntityExtractor.extract_entities(msg)
            for entity_type, entity_list in entities.items():
                all_entities[entity_type].update(entity_list)
        
        return dict(all_entities)
    
    @classmethod
    def _format_entities(cls, entities: Dict[str, Set[str]]) -> str:
        """Format entities for summary"""
        formatted = []
        for entity_type, entity_set in entities.items():
            if entity_set:
                entity_list = list(entity_set)[:3]  # Limit to 3 per type
                formatted.append(f"{entity_type}: {', '.join(entity_list)}")
        return "; ".join(formatted)


class TranslationMemoryManager:
    """Manage contextual translation memory"""
    
    @classmethod
    def generate_context_hash(cls, context: List[str], topic: str = None) -> str:
        """Generate a hash for the given context"""
        context_str = "\n".join(context) if context else ""
        if topic:
            context_str += f"|TOPIC:{topic}"
        
        return hashlib.md5(context_str.encode()).hexdigest()
    
    @classmethod
    def store_translation(cls, source_text: str, translated_text: str,
                         source_lang: str, target_lang: str,
                         context: List[str], topic: str = None,
                         entities: List[str] = None):
        """Store a translation with its context"""
        try:
            # Try to import the model, if it fails, skip storing
            from ..models import ContextualTranslationMemory
            context_hash = cls.generate_context_hash(context, topic)
            context_summary = ContextSummarizer.summarize_context(context, max_length=200)
            
            memory, created = ContextualTranslationMemory.objects.get_or_create(
                source_text=source_text,
                source_language=source_lang,
                target_language=target_lang,
                context_hash=context_hash,
                defaults={
                    'translated_text': translated_text,
                    'context_summary': context_summary,
                    'topic_category': topic or 'general',
                    'entities_involved': entities or []
                }
            )
            
            if not created:
                # Update usage count
                memory.usage_count += 1
                memory.confidence_score = min(memory.confidence_score + 0.05, 1.0)
                memory.save()
            
            return memory
        except Exception as e:
            print(f"Error storing translation memory (models may not be migrated yet): {e}")
            return None
    
    @classmethod
    def retrieve_translation(cls, source_text: str, source_lang: str,
                           target_lang: str, context: List[str],
                           topic: str = None) -> Optional[str]:
        """Retrieve a translation from memory if available"""
        try:
            # Try to import the model, if it fails, skip retrieval
            from ..models import ContextualTranslationMemory
            context_hash = cls.generate_context_hash(context, topic)
            
            memory = ContextualTranslationMemory.objects.filter(
                source_text=source_text,
                source_language=source_lang,
                target_language=target_lang,
                context_hash=context_hash
            ).first()
            
            if memory and memory.confidence_score > 0.7:
                memory.usage_count += 1
                memory.save()
                return memory.translated_text
            
        except Exception as e:
            print(f"Error retrieving translation memory (models may not be migrated yet): {e}")
        
        return None


class DomainSpecificPromptManager:
    """Manage domain-specific translation prompts"""
    
    DOMAIN_PROMPTS = {
        'anime': """You are translating anime-related content. Key guidelines:
- Preserve Japanese honorifics (-san, -chan, -kun, -sama, -sensei, etc.)
- Keep commonly used anime terms untranslated (nakama, baka, kawaii, senpai, etc.)
- Maintain character names in their original form
- Preserve attack names and special techniques in romanized form
- Consider the emotional intensity typical in anime dialogue""",
        
        'technology': """You are translating technical content. Key guidelines:
- Maintain technical accuracy and precision
- Keep programming terms, APIs, and technical acronyms unchanged
- Preserve code snippets and command syntax exactly
- Use standard technical terminology in the target language
- Maintain consistency with established technical translations""",
        
        'business': """You are translating business communication. Key guidelines:
- Use formal, professional language
- Maintain proper titles and corporate terminology
- Ensure clarity and precision in financial or legal terms
- Preserve company names and brand references
- Use appropriate business etiquette for the target culture""",
        
        'gaming': """You are translating gaming content. Key guidelines:
- Keep game titles and character names unchanged
- Preserve gaming terminology and slang appropriately
- Maintain the excitement and energy of gaming dialogue
- Keep platform-specific terms (PC, console names, etc.)
- Consider the gaming culture of both languages""",
        
        'casual': """You are translating casual conversation. Key guidelines:
- Maintain the informal, friendly tone
- Translate idioms and slang to equivalent expressions
- Preserve the emotional context and humor
- Use natural, conversational language
- Adapt cultural references when necessary""",
        
        'academic': """You are translating academic content. Key guidelines:
- Use precise, scholarly language
- Maintain citations and references accurately
- Preserve technical terms specific to the field
- Use formal academic writing conventions
- Ensure conceptual accuracy over literal translation""",
        
        'general': """You are translating general conversation. Key guidelines:
- Maintain natural conversational tone
- Preserve the speaker's intent and emotion
- Use appropriate formality level for the context
- Keep proper names and specific references unchanged
- Translate idioms to culturally appropriate equivalents"""
    }
    
    @classmethod
    def get_domain_prompt(cls, domain: str) -> str:
        """Get the appropriate domain-specific prompt"""
        return cls.DOMAIN_PROMPTS.get(domain, cls.DOMAIN_PROMPTS['general'])
    
    @classmethod
    def enhance_prompt_with_context(cls, base_prompt: str, 
                                  entities: Dict[str, List[str]],
                                  user_glossary: Dict[str, str] = None) -> str:
        """Enhance prompt with specific context information"""
        enhanced_prompt = base_prompt
        
        # Add entity information
        if entities:
            entity_info = "\n\nImportant entities in this conversation:"
            for entity_type, entity_list in entities.items():
                if entity_list:
                    entity_info += f"\n- {entity_type.title()}: {', '.join(entity_list[:5])}"
            enhanced_prompt += entity_info
        
        # Add user glossary
        if user_glossary:
            glossary_info = "\n\nUser-specific translation preferences:"
            for original, preferred in list(user_glossary.items())[:10]:
                glossary_info += f'\n- "{original}" should be translated as "{preferred}"'
            enhanced_prompt += glossary_info
        
        return enhanced_prompt


class FeedbackProcessor:
    """Process and learn from user feedback on translations"""
    
    @classmethod
    def record_feedback(cls, user_id: str, original_text: str,
                       original_translation: str, corrected_translation: str,
                       source_lang: str, target_lang: str,
                       context: str = None, session_id: str = None):
        """Record user feedback on a translation"""
        try:
            # Try to import the model, if it fails, skip storing
            from ..models import TranslationFeedback
            feedback = TranslationFeedback.objects.create(
                user_id=user_id,
                original_text=original_text,
                original_translation=original_translation,
                corrected_translation=corrected_translation,
                source_language=source_lang,
                target_language=target_lang,
                context_provided=context or '',
                feedback_type='correction',
                session_id=session_id or ''
            )
            
            # Update user glossary if significant change
            if cls._is_significant_correction(original_translation, corrected_translation):
                UserProfileManager.add_glossary_term(
                    user_id, original_text, corrected_translation,
                    f"{source_lang}-{target_lang}"
                )
            
            return feedback
        except Exception as e:
            print(f"Error recording feedback (models may not be migrated yet): {e}")
            return None
    
    @classmethod
    def _is_significant_correction(cls, original: str, corrected: str) -> bool:
        """Determine if a correction is significant enough to store"""
        # Simple check: more than just capitalization or punctuation changes
        if original.lower().strip() == corrected.lower().strip():
            return False
        
        # Check for substantial difference
        original_words = set(original.lower().split())
        corrected_words = set(corrected.lower().split())
        
        # If more than 30% of words are different, it's significant
        if len(original_words) > 0:
            difference = len(original_words ^ corrected_words) / len(original_words)
            return difference > 0.3
        
        return True
    
    @classmethod
    def get_user_corrections(cls, user_id: str, limit: int = 10):
        """Get recent corrections from a user"""
        try:
            # Try to import the model, if it fails, return empty list
            from ..models import TranslationFeedback
            return TranslationFeedback.objects.filter(
                user_id=user_id
            ).order_by('-created_at')[:limit]
        except Exception as e:
            print(f"Error getting user corrections (models may not be migrated yet): {e}")
            return []
