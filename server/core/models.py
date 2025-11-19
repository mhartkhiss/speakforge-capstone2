from django.db import models
from django.contrib.postgres.fields import JSONField
import json

# Create your models here.

class TranslationCache(models.Model):
    source_text = models.TextField()
    source_language = models.CharField(max_length=50)
    target_language = models.CharField(max_length=50)
    translated_text = models.TextField()
    model = models.CharField(max_length=20)  # claude, gemini, or deepseek
    mode = models.CharField(max_length=10)  # single or multiple
    created_at = models.DateTimeField(auto_now_add=True)
    used_count = models.IntegerField(default=1)
    
    class Meta:
        indexes = [
            models.Index(fields=['source_text', 'source_language', 'target_language', 'model', 'mode']),
        ]

    def __str__(self):
        return f"{self.source_language} -> {self.target_language}: {self.source_text[:50]}"

# Removed GroupTranslationMemory - not needed for ConnectChat


# Enhanced Context Models for Improved Translation

class EntityTracking(models.Model):
    """Track entities mentioned in conversations for better context understanding"""
    session_id = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)  # person, place, product, media, etc.
    entity_name = models.CharField(max_length=255)
    entity_context = models.TextField(blank=True)  # Additional context about the entity
    first_mentioned = models.DateTimeField(auto_now_add=True)
    last_mentioned = models.DateTimeField(auto_now=True)
    mention_count = models.IntegerField(default=1)
    metadata = models.JSONField(default=dict, blank=True)  # Store additional info
    
    class Meta:
        unique_together = ('session_id', 'entity_type', 'entity_name')
        indexes = [
            models.Index(fields=['session_id', 'entity_type']),
            models.Index(fields=['entity_name']),
        ]
    
    def __str__(self):
        return f"{self.session_id}: {self.entity_type} - {self.entity_name}"


class UserTranslationProfile(models.Model):
    """Store user-specific translation preferences and patterns"""
    user_id = models.CharField(max_length=100, unique=True)
    preferred_formality = models.CharField(max_length=20, default='casual')  # formal/casual
    domains_of_interest = models.JSONField(default=list)  # ['anime', 'technology', 'sports']
    personal_glossary = models.JSONField(default=dict)  # {'original': 'preferred_translation'}
    language_pairs = models.JSONField(default=dict)  # Track frequently used language pairs
    style_preferences = models.JSONField(default=dict)  # Style preferences per context
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id']),
        ]
    
    def __str__(self):
        return f"Profile for user: {self.user_id}"


class ConversationTopic(models.Model):
    """Track conversation topics for better context understanding"""
    session_id = models.CharField(max_length=100)
    topic_category = models.CharField(max_length=100)  # anime, tech, casual, business, etc.
    confidence_score = models.FloatField(default=0.5)
    keywords = models.JSONField(default=list)  # Key terms identifying the topic
    start_timestamp = models.DateTimeField()
    end_timestamp = models.DateTimeField(null=True, blank=True)
    message_count = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('session_id', 'topic_category', 'start_timestamp')
        indexes = [
            models.Index(fields=['session_id', 'topic_category']),
        ]
    
    def __str__(self):
        return f"{self.session_id}: {self.topic_category} ({self.confidence_score:.2f})"


class ContextualTranslationMemory(models.Model):
    """Enhanced translation memory with context awareness"""
    source_text = models.TextField()
    translated_text = models.TextField()
    source_language = models.CharField(max_length=50)
    target_language = models.CharField(max_length=50)
    context_hash = models.CharField(max_length=255)  # Hash of the context for matching
    context_summary = models.TextField(blank=True)  # Human-readable context description
    topic_category = models.CharField(max_length=100, blank=True)
    entities_involved = models.JSONField(default=list)  # List of entities in context
    confidence_score = models.FloatField(default=1.0)
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('source_text', 'source_language', 'target_language', 'context_hash')
        indexes = [
            models.Index(fields=['context_hash']),
            models.Index(fields=['topic_category']),
            models.Index(fields=['source_language', 'target_language']),
        ]
    
    def __str__(self):
        return f"{self.source_text[:50]} -> {self.translated_text[:50]} (Context: {self.context_summary[:30]})"


class TranslationFeedback(models.Model):
    """Track user feedback and corrections on translations"""
    user_id = models.CharField(max_length=100)
    original_text = models.TextField()
    original_translation = models.TextField()
    corrected_translation = models.TextField()
    source_language = models.CharField(max_length=50)
    target_language = models.CharField(max_length=50)
    context_provided = models.TextField(blank=True)
    feedback_type = models.CharField(max_length=50)  # correction, preference, style
    session_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['session_id']),
            models.Index(fields=['feedback_type']),
        ]
    
    def __str__(self):
        return f"Feedback from {self.user_id}: {self.feedback_type}"


class MessageCluster(models.Model):
    """Group related messages for semantic clustering"""
    session_id = models.CharField(max_length=100)
    cluster_id = models.CharField(max_length=100)
    message_ids = models.JSONField(default=list)  # List of message IDs in this cluster
    cluster_type = models.CharField(max_length=50)  # thread, qa_pair, topic_segment
    cluster_summary = models.TextField(blank=True)
    start_timestamp = models.DateTimeField()
    end_timestamp = models.DateTimeField()
    coherence_score = models.FloatField(default=0.5)

    class Meta:
        unique_together = ('session_id', 'cluster_id')
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['cluster_type']),
        ]

    def __str__(self):
        return f"{self.session_id} - Cluster {self.cluster_id}: {self.cluster_type}"


class APIUsageStats(models.Model):
    """Track API usage statistics for translation services"""
    model_name = models.CharField(max_length=50)  # 'claude' or 'gemini'
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    input_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.000000)
    output_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.000000)
    total_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.000000)
    request_timestamp = models.DateTimeField(auto_now_add=True)
    endpoint = models.CharField(max_length=100, blank=True)  # API endpoint used
    user_id = models.CharField(max_length=100, blank=True)  # Optional user tracking
    session_id = models.CharField(max_length=100, blank=True)  # Optional session tracking

    class Meta:
        indexes = [
            models.Index(fields=['model_name', 'request_timestamp']),
            models.Index(fields=['request_timestamp']),
            models.Index(fields=['user_id']),
        ]

    def save(self, *args, **kwargs):
        """Calculate costs based on token usage and model pricing"""
        self.total_tokens = self.input_tokens + self.output_tokens

        # Claude 3.5 Sonnet pricing: $3.00 per input token, $15.00 per output token
        # Gemini 2.5 Flash pricing: ~$0.10 per input token, ~$0.40 per output token
        # Note: These are per million tokens, so we need to convert
        if self.model_name.lower() == 'claude':
            self.input_cost = (self.input_tokens / 1000000) * 3.00
            self.output_cost = (self.output_tokens / 1000000) * 15.00
        elif self.model_name.lower() == 'gemini':
            self.input_cost = (self.input_tokens / 1000000) * 0.10
            self.output_cost = (self.output_tokens / 1000000) * 0.40

        self.total_cost = self.input_cost + self.output_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.model_name}: {self.total_tokens} tokens (${self.total_cost:.6f}) - {self.request_timestamp}"