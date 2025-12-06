package com.example.appdev.models;

import java.util.ArrayList;
import java.util.List;

public class ConversationalMessage {
    private String messageId;
    private String originalText;
    private String translatedText;
    private boolean isFromUser1; // true if User 1 spoke (so message appears on User 2's screen)
    private String targetLanguage;
    private String sourceLanguage;
    private List<String> variations;
    private int currentVariationIndex;
    private boolean isRegenerating;
    
    public ConversationalMessage(String messageId, String originalText, String translatedText, boolean isFromUser1, String sourceLanguage, String targetLanguage) {
        this.messageId = messageId;
        this.originalText = originalText;
        this.translatedText = translatedText;
        this.isFromUser1 = isFromUser1;
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
        this.variations = new ArrayList<>();
        this.variations.add(translatedText); // First variation is the initial translation
        this.currentVariationIndex = 0;
    }

    public String getMessageId() {
        return messageId;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getTranslatedText() {
        return translatedText;
    }

    public void setTranslatedText(String translatedText) {
        this.translatedText = translatedText;
    }

    public boolean isFromUser1() {
        return isFromUser1;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }
    
    public String getSourceLanguage() {
        return sourceLanguage;
    }

    public List<String> getVariations() {
        return variations;
    }

    public void setVariations(List<String> variations) {
        this.variations = variations;
    }
    
    public void addVariation(String variation) {
        if (this.variations == null) {
            this.variations = new ArrayList<>();
        }
        this.variations.add(variation);
    }

    public int getCurrentVariationIndex() {
        return currentVariationIndex;
    }

    public void setCurrentVariationIndex(int currentVariationIndex) {
        this.currentVariationIndex = currentVariationIndex;
    }
    
    public String getNextVariation() {
        if (variations == null || variations.isEmpty()) return translatedText;
        currentVariationIndex = (currentVariationIndex + 1) % variations.size();
        return variations.get(currentVariationIndex);
    }

    public boolean isRegenerating() {
        return isRegenerating;
    }

    public void setRegenerating(boolean regenerating) {
        isRegenerating = regenerating;
    }
}
