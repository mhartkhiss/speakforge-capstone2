package com.example.appdev;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.annotation.NonNull;
import android.widget.AdapterView;
import android.os.AsyncTask;
import android.os.Build;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.graphics.drawable.Drawable;
import androidx.core.content.ContextCompat;
import android.speech.RecognizerIntent;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.BackgroundColorSpan;
import android.widget.ImageView;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.os.Handler;
import android.view.animation.Interpolator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.appdev.models.ConversationalMessage;
import com.example.appdev.models.Languages;
import com.example.appdev.utils.SpeechRecognitionDialog;
import com.example.appdev.utils.SpeechRecognitionHelper;
import com.example.appdev.utils.CustomNotification;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.example.appdev.utils.ConversationalSpeechRecognizer;
import com.example.appdev.utils.LoadingDotsView;
import com.example.appdev.utils.TranslationApiService;
import com.example.appdev.adapters.ConversationalAdapter;

import androidx.annotation.Nullable;

import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;

public class ConversationalActivity extends AppCompatActivity implements ConversationalAdapter.OnRegenerateListener {
    
    // User 1 (Bottom) Views
    private RecyclerView user1RecyclerView;
    private TextView user1InputText;
    private Spinner user1LanguageSpinner;
    private FloatingActionButton user1SpeakButton;
    private FloatingActionButton user1ClearButton;
    private ConversationalAdapter user1Adapter; // Displays messages from User 2
    
    // User 2 (Top) Views
    private RecyclerView user2RecyclerView;
    private TextView user2InputText;
    private Spinner user2LanguageSpinner;
    private FloatingActionButton user2SpeakButton;
    private FloatingActionButton user2ClearButton;
    private ConversationalAdapter user2Adapter; // Displays messages from User 1

    // Speech Recognition
    private ConversationalSpeechRecognizer speechRecognizer;
    private static final int PERMISSION_REQUEST_CODE = 123;

    private boolean isUser1Speaking = false;
    private boolean isUser2Speaking = false;
    private Drawable micIcon;
    private Drawable stopIcon;

    // Session ID for API calls
    private String sessionId;
    
    // User IDs for context tracking
    private String user1Id;
    private String user2Id;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Generate a random session ID for this conversation
        sessionId = UUID.randomUUID().toString();
        
        // Initialize User IDs
        if (Variables.userUID != null && !Variables.userUID.isEmpty()) {
            user1Id = Variables.userUID;
        } else {
            user1Id = "user1_" + sessionId;
        }
        user2Id = "user2_" + sessionId;
        
        // Make the window background light
        getWindow().setBackgroundDrawableResource(android.R.color.white);
        
        // Add full screen flags
        getWindow().setFlags(
            android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN,
            android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        // Hide system bars
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);
        
        setContentView(R.layout.activity_conversational);

        // Get references to the top and bottom sections
        View topSection = findViewById(R.id.user2Section);
        View bottomSection = findViewById(R.id.user1Section);
        View centerDivider = findViewById(R.id.centerDivider);

        // Initially hide the sections
        topSection.setVisibility(View.INVISIBLE);
        bottomSection.setVisibility(View.INVISIBLE);
        centerDivider.setAlpha(0f);

        // Load animations
        Animation slideInTop = AnimationUtils.loadAnimation(this, R.anim.slide_fade_in_top);
        Animation slideInBottom = AnimationUtils.loadAnimation(this, R.anim.slide_fade_in_bottom);

        // Post the animations to ensure views are properly laid out
        topSection.post(() -> {
            // Show and animate top section
            topSection.setVisibility(View.VISIBLE);
            topSection.startAnimation(slideInTop);
        });

        bottomSection.post(() -> {
            // Show and animate bottom section
            bottomSection.setVisibility(View.VISIBLE);
            bottomSection.startAnimation(slideInBottom);
        });

        // Fade in the center divider
        centerDivider.animate()
            .alpha(1f)
            .setDuration(800)
            .setStartDelay(400)
            .start();

        // Initialize User 1 (Bottom) Views
        user1RecyclerView = findViewById(R.id.user1RecyclerView);
        user1InputText = findViewById(R.id.user1InputText);
        user1LanguageSpinner = findViewById(R.id.user1LanguageSpinner);
        user1SpeakButton = findViewById(R.id.user1SpeakButton);
        user1ClearButton = findViewById(R.id.user1ClearButton);

        // Initialize User 2 (Top) Views
        user2RecyclerView = findViewById(R.id.user2RecyclerView);
        user2InputText = findViewById(R.id.user2InputText);
        user2LanguageSpinner = findViewById(R.id.user2LanguageSpinner);
        user2SpeakButton = findViewById(R.id.user2SpeakButton);
        user2ClearButton = findViewById(R.id.user2ClearButton);

        // Setup RecyclerViews
        setupRecyclerViews();

        // Initialize Speech Recognition
        speechRecognizer = new ConversationalSpeechRecognizer(this);

        // Initialize icons
        micIcon = ContextCompat.getDrawable(this, R.drawable.ic_mic);
        stopIcon = ContextCompat.getDrawable(this, R.drawable.ic_stop);

        // Initialize conversational icon
        ImageView conversationalIcon = findViewById(R.id.conversationalIcon);
        conversationalIcon.setOnClickListener(v -> {
            finish(); // This will close the activity
        });

        // Setup language spinners
        setupLanguageSpinners();

        // Setup click listeners
        setupClickListeners();
    }

    private void setupRecyclerViews() {
        // User 1 RecyclerView (Bottom) - shows messages from User 2
        user1Adapter = new ConversationalAdapter(this);
        LinearLayoutManager layoutManager1 = new LinearLayoutManager(this);
        layoutManager1.setStackFromEnd(true); // Start from bottom
        user1RecyclerView.setLayoutManager(layoutManager1);
        user1RecyclerView.setAdapter(user1Adapter);

        // User 2 RecyclerView (Top) - shows messages from User 1
        user2Adapter = new ConversationalAdapter(this);
        LinearLayoutManager layoutManager2 = new LinearLayoutManager(this);
        layoutManager2.setStackFromEnd(true);
        user2RecyclerView.setLayoutManager(layoutManager2);
        user2RecyclerView.setAdapter(user2Adapter);
    }

    private void setupLanguageSpinners() {
        // Setup User 1 Spinner (Orange user)
        ArrayAdapter<String> user1Adapter = new ArrayAdapter<String>(this,
            R.layout.simple_spinner_item_custom, Languages.getUser1Languages()) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                TextView view = (TextView) super.getView(position, convertView, parent);
                view.setTextColor(ContextCompat.getColor(getContext(), R.color.user1_color));
                return view;
            }

            @Override
            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                TextView view = (TextView) super.getDropDownView(position, convertView, parent);
                view.setTextColor(ContextCompat.getColor(getContext(), R.color.user1_color));
                return view;
            }
        };
        user1Adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        user1LanguageSpinner.setAdapter(user1Adapter);
        
        // Set default selection for User 1
        int user1Position = user1Adapter.getPosition(Languages.getUser1Language());
        if (user1Position >= 0) {
            user1LanguageSpinner.setSelection(user1Position);
        }

        // Setup User 2 Spinner (Blue user)
        ArrayAdapter<String> user2Adapter = new ArrayAdapter<String>(this,
            R.layout.simple_spinner_item_custom, Languages.getUser2Languages()) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                TextView view = (TextView) super.getView(position, convertView, parent);
                view.setTextColor(ContextCompat.getColor(getContext(), R.color.user2_color));
                return view;
            }

            @Override
            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                TextView view = (TextView) super.getDropDownView(position, convertView, parent);
                view.setTextColor(ContextCompat.getColor(getContext(), R.color.user2_color));
                return view;
            }
        };
        user2Adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        user2LanguageSpinner.setAdapter(user2Adapter);
        
        // Set default selection for User 2
        int user2Position = user2Adapter.getPosition(Languages.getUser2Language());
        if (user2Position >= 0) {
            user2LanguageSpinner.setSelection(user2Position);
        }

        // Add listeners to update available languages when selections change
        user1LanguageSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selectedLanguage = parent.getItemAtPosition(position).toString();
                
                // If the selected language is same as User 2's language, swap them
                if (selectedLanguage.equals(Languages.getUser2Language())) {
                    String prevUser1 = Languages.getUser1Language();
                    
                    // Update static variables first to avoid recursion loop
                    Languages.setUser1Language(selectedLanguage);
                    Languages.setUser2Language(prevUser1);
                    
                    // Update User 2 spinner selection
                    int pos = user2Adapter.getPosition(prevUser1);
                    if (pos >= 0) user2LanguageSpinner.setSelection(pos);
                } else {
                    // Just update User 1
                    Languages.setUser1Language(selectedLanguage);
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        user2LanguageSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selectedLanguage = parent.getItemAtPosition(position).toString();
                
                // If the selected language is same as User 1's language, swap them
                if (selectedLanguage.equals(Languages.getUser1Language())) {
                    String prevUser2 = Languages.getUser2Language();
                    
                    // Update static variables first to avoid recursion loop
                    Languages.setUser2Language(selectedLanguage);
                    Languages.setUser1Language(prevUser2);
                    
                    // Update User 1 spinner selection
                    int pos = user1Adapter.getPosition(prevUser2);
                    if (pos >= 0) user1LanguageSpinner.setSelection(pos);
                } else {
                    // Just update User 2
                    Languages.setUser2Language(selectedLanguage);
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void setupClickListeners() {
        user1SpeakButton.setOnClickListener(v -> {
            if (!isUser1Speaking) {
                startSpeechRecognition(true);
            } else {
                stopSpeechRecognition(true);
            }
        });

        user2SpeakButton.setOnClickListener(v -> {
            if (!isUser2Speaking) {
                startSpeechRecognition(false);
            } else {
                stopSpeechRecognition(false);
            }
        });

        user1ClearButton.setOnClickListener(v -> {
             updateInputTextView(user1InputText, "");
             if (isUser1Speaking && speechRecognizer != null) {
                 speechRecognizer.clear();
             }
        });
        user2ClearButton.setOnClickListener(v -> {
             updateInputTextView(user2InputText, "");
             if (isUser2Speaking && speechRecognizer != null) {
                 speechRecognizer.clear();
             }
        });
    }

    private void startSpeechRecognition(boolean isUser1) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int permissionResult = checkSelfPermission(android.Manifest.permission.RECORD_AUDIO);
            if (permissionResult == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                startListening(isUser1);
            } else {
                requestPermissions(new String[]{android.Manifest.permission.RECORD_AUDIO}, PERMISSION_REQUEST_CODE);
            }
        } else {
            startListening(isUser1);
        }
    }

    private void startListening(boolean isUser1) {
        // Update UI state
        if (isUser1) {
            isUser1Speaking = true;
            user1SpeakButton.setImageDrawable(stopIcon);
            pulseAnimation(user1SpeakButton);
            updateInputTextView(user1InputText, "Listening...");
            
            // Show loading in User 2's list (User 1 is speaking)
            user2Adapter.setLoading(true, ContextCompat.getColor(this, R.color.user1_color));
            user2RecyclerView.smoothScrollToPosition(user2Adapter.getItemCount() - 1);
            
            // Disable User 2's controls
            user2SpeakButton.setEnabled(false);
            user2SpeakButton.setAlpha(0.5f);
            user2LanguageSpinner.setEnabled(false);
            user2LanguageSpinner.setAlpha(0.5f);
            user2ClearButton.setVisibility(View.GONE);
        } else {
            isUser2Speaking = true;
            user2SpeakButton.setImageDrawable(stopIcon);
            pulseAnimation(user2SpeakButton);
            updateInputTextView(user2InputText, "Listening...");
            
            // Show loading in User 1's list (User 2 is speaking)
            user1Adapter.setLoading(true, ContextCompat.getColor(this, R.color.user2_color));
            user1RecyclerView.smoothScrollToPosition(user1Adapter.getItemCount() - 1);
            
            // Disable User 1's controls
            user1SpeakButton.setEnabled(false);
            user1SpeakButton.setAlpha(0.5f);
            user1LanguageSpinner.setEnabled(false);
            user1LanguageSpinner.setAlpha(0.5f);
            user1ClearButton.setVisibility(View.GONE);
        }

        // Get selected language for speech recognition
        String language = isUser1 ? 
            user1LanguageSpinner.getSelectedItem().toString() : 
            user2LanguageSpinner.getSelectedItem().toString();

        speechRecognizer.startListening(language, new ConversationalSpeechRecognizer.OnSpeechResultListener() {
            @Override
            public void onPartialResult(String text) {
                runOnUiThread(() -> {
                    if (isUser1) {
                        updateInputTextView(user1InputText, text);
                    } else {
                        updateInputTextView(user2InputText, text);
                    }
                });
            }

            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> {
                    CustomNotification.showNotification(ConversationalActivity.this, errorMessage, false);
                    stopSpeechRecognition(isUser1);
                });
            }
        });
    }

    private void stopSpeechRecognition(boolean isUser1) {
        speechRecognizer.stopListening();

        if (isUser1) {
            isUser1Speaking = false;
            user1SpeakButton.setImageDrawable(micIcon);
            user1SpeakButton.clearAnimation();
            
            // Re-enable User 2's controls
            user2SpeakButton.setEnabled(true);
            user2SpeakButton.setAlpha(1.0f);
            user2LanguageSpinner.setEnabled(true);
            user2LanguageSpinner.setAlpha(1.0f);
            
            String text = user1InputText.getText().toString();
            // Don't translate "Listening..."
            if (!text.isEmpty() && !text.equals("Listening...")) {
                String targetLanguage = user2LanguageSpinner.getSelectedItem().toString();
                translateAndDisplay(text, targetLanguage, true, null, -1);
            } else {
                // If nothing was spoken, hide loading
                user2Adapter.setLoading(false, 0);
            }
            // Clear input after sending
            updateInputTextView(user1InputText, "");
        } else {
            isUser2Speaking = false;
            user2SpeakButton.setImageDrawable(micIcon);
            user2SpeakButton.clearAnimation();
            
            // Re-enable User 1's controls
            user1SpeakButton.setEnabled(true);
            user1SpeakButton.setAlpha(1.0f);
            user1LanguageSpinner.setEnabled(true);
            user1LanguageSpinner.setAlpha(1.0f);
            
            String text = user2InputText.getText().toString();
             // Don't translate "Listening..."
            if (!text.isEmpty() && !text.equals("Listening...")) {
                String targetLanguage = user1LanguageSpinner.getSelectedItem().toString();
                translateAndDisplay(text, targetLanguage, false, null, -1);
            } else {
                // If nothing was spoken, hide loading
                user1Adapter.setLoading(false, 0);
            }
            // Clear input after sending
            updateInputTextView(user2InputText, "");
        }
    }

    private void pulseAnimation(View view) {
        ObjectAnimator scaleX = ObjectAnimator.ofFloat(view, "scaleX", 1f, 1.2f);
        ObjectAnimator scaleY = ObjectAnimator.ofFloat(view, "scaleY", 1f, 1.2f);
        
        scaleX.setRepeatCount(ObjectAnimator.INFINITE);
        scaleY.setRepeatCount(ObjectAnimator.INFINITE);
        scaleX.setRepeatMode(ObjectAnimator.REVERSE);
        scaleY.setRepeatMode(ObjectAnimator.REVERSE);
        
        AnimatorSet animatorSet = new AnimatorSet();
        animatorSet.playTogether(scaleX, scaleY);
        animatorSet.setDuration(1000);
        animatorSet.setInterpolator(new AccelerateDecelerateInterpolator());
        animatorSet.start();
    }

    // New helper for input text views
    private void updateInputTextView(TextView textView, String text) {
        boolean isUser1 = (textView == user1InputText);
        FloatingActionButton clearButton = isUser1 ? user1ClearButton : user2ClearButton;

        if (text.isEmpty()) {
            textView.setVisibility(View.GONE);
            clearButton.setVisibility(View.GONE);
        } else {
            textView.setVisibility(View.VISIBLE);
            // Hide clear button if it's just "Listening..."
            if (text.equals("Listening...")) {
                clearButton.setVisibility(View.GONE);
            } else {
                clearButton.setVisibility(View.VISIBLE);
            }
        }
        
        textView.setText(text);
    }

    // Helper method to convert dp to pixels
    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    private void translateAndDisplay(String text, String targetLanguage, boolean isUser1, @Nullable ConversationalMessage messageToUpdate, int updatePosition) {
        // Start translation UI state
        startTranslation(isUser1);

        // Get translation mode
        String translationMode = Variables.isFormalTranslationMode ? "formal" : "casual";
        
        // Get source language based on which user is speaking
        String sourceLanguage = isUser1 ? 
            user1LanguageSpinner.getSelectedItem().toString() : 
            user2LanguageSpinner.getSelectedItem().toString();
            
        // Generate message ID for context tracking
        final String messageId = (messageToUpdate != null) ? messageToUpdate.getMessageId() : UUID.randomUUID().toString();
        
        // Determine user IDs for this turn
        String currentUserId = isUser1 ? user1Id : user2Id;
        String recipientId = isUser1 ? user2Id : user1Id;
        
        // Use the API service for translation with context
        TranslationApiService.translateTextWithContext(
                text,
                sourceLanguage,
                targetLanguage,
                translationMode,
                Variables.userTranslator != null ? Variables.userTranslator : "gemini",
                currentUserId,
                recipientId,
                sessionId,
                messageId,
                new TranslationApiService.TranslationCallback() {
                    @Override
                    public void onSuccess(String translatedMessage) {
                        if (!isFinishing()) {
                            runOnUiThread(() -> {
                                if (isUser1) {
                                    // User 1 spoke, show on User 2's screen (user2Adapter)
                                    user2Adapter.setLoading(false, 0); // Hide loading
                                    
                                    if (messageToUpdate != null && updatePosition != -1) {
                                        // Update existing
                                        user2Adapter.updateMessage(updatePosition, translatedMessage);
                                    } else {
                                        // New message
                                        ConversationalMessage msg = new ConversationalMessage(messageId, text, translatedMessage, true, sourceLanguage, targetLanguage);
                                        user2Adapter.addMessage(msg);
                                        user2RecyclerView.smoothScrollToPosition(user2Adapter.getItemCount() - 1);
                                    }
                                } else {
                                    // User 2 spoke, show on User 1's screen (user1Adapter)
                                    user1Adapter.setLoading(false, 0); // Hide loading
                                    
                                    if (messageToUpdate != null && updatePosition != -1) {
                                        // Update existing
                                        user1Adapter.updateMessage(updatePosition, translatedMessage);
                                    } else {
                                        // New message
                                        ConversationalMessage msg = new ConversationalMessage(messageId, text, translatedMessage, false, sourceLanguage, targetLanguage);
                                        user1Adapter.addMessage(msg);
                                        user1RecyclerView.smoothScrollToPosition(user1Adapter.getItemCount() - 1);
                                    }
                                }
                                enableControls(isUser1);
                            });
                        }
                    }

                    @Override
                    public void onError(String errorMessage) {
                        if (!isFinishing()) {
                            runOnUiThread(() -> {
                                String errorText = "Translation failed: " + errorMessage;
                                if (isUser1) {
                                    user2Adapter.setLoading(false, 0);
                                    CustomNotification.showNotification(ConversationalActivity.this, errorText, false);
                                } else {
                                    user1Adapter.setLoading(false, 0);
                                    CustomNotification.showNotification(ConversationalActivity.this, errorText, false);
                                }
                                enableControls(isUser1);
                            });
                        }
                    }
                }
        );
    }
    
    @Override
    public void onRegenerate(ConversationalMessage message, int position) {
        // Check if we already have multiple variations
        if (message.getVariations() != null && message.getVariations().size() > 1) {
            // Cycle to the next variation
            String nextVariation = message.getNextVariation();
            boolean isUser1 = message.isFromUser1();
            
            if (isUser1) {
                user2Adapter.updateMessage(position, nextVariation);
            } else {
                user1Adapter.updateMessage(position, nextVariation);
            }
        } else {
            // Call API to get variations
            regenerateTranslationApi(message, position);
        }
    }
    
    private void regenerateTranslationApi(ConversationalMessage message, int position) {
        // Show loading state
        message.setRegenerating(true);
        if (message.isFromUser1()) {
            user2Adapter.notifyItemChanged(position);
        } else {
            user1Adapter.notifyItemChanged(position);
        }
        
        new AsyncTask<Void, Void, Boolean>() {
            String originalText = message.getOriginalText();
            String sourceLanguage = message.getSourceLanguage();
            String targetLanguage = message.getTargetLanguage();
            String messageId = message.getMessageId();
            boolean isUser1 = message.isFromUser1();
            Map<String, String> newVariations = new HashMap<>();

            @Override
            protected Boolean doInBackground(Void... voids) {
                try {
                    // Use API to regenerate with context
                    JSONObject requestBody = new JSONObject();
                    requestBody.put("text", originalText); // Although regenerate endpoint might fetch it, providing it doesn't hurt or maybe it ignores it? 
                    // Actually regenerate_translation endpoint in python fetches message from Firebase. 
                    // But for Connect Chat it expects message to be in Firebase. 
                    // Since we are using translate_db_context for the original translation, the message SHOULD be in Firebase.
                    
                    requestBody.put("room_id", sessionId);
                    requestBody.put("message_id", messageId);
                    requestBody.put("source_language", sourceLanguage);
                    requestBody.put("target_language", targetLanguage);
                    requestBody.put("variants", "multiple");
                    requestBody.put("model", Variables.userTranslator != null ? Variables.userTranslator.toLowerCase() : "gemini");
                    requestBody.put("translation_mode", Variables.isFormalTranslationMode ? "formal" : "casual");
                    
                    // Add context parameters
                    requestBody.put("current_user_id", isUser1 ? user1Id : user2Id);
                    requestBody.put("recipient_id", isUser1 ? user2Id : user1Id);
                    requestBody.put("use_context", Variables.isContextAwareTranslation);
                    requestBody.put("context_depth", Variables.contextDepth);
                    
                    // Don't save variations to DB for split screen, just use locally
                    requestBody.put("save_to_db", false);

                    String apiUrl = Variables.API_REGENERATE_TRANSLATION_URL;
                    URL url = new URL(apiUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; utf-8");
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(15000);

                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = requestBody.toString().getBytes("utf-8");
                        os.write(input, 0, input.length);
                    }

                    int responseCode = conn.getResponseCode();
                    if (responseCode >= 200 && responseCode < 300) {
                        BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));
                        StringBuilder response = new StringBuilder();
                        String responseLine;
                        while ((responseLine = br.readLine()) != null) {
                            response.append(responseLine.trim());
                        }
                        
                        JSONObject jsonResponse = new JSONObject(response.toString());
                        if (jsonResponse.has("translations")) {
                            JSONObject translations = jsonResponse.getJSONObject("translations");
                            Iterator<String> keys = translations.keys();
                            while (keys.hasNext()) {
                                String key = keys.next();
                                newVariations.put(key, translations.getString(key));
                            }
                            return true;
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
                return false;
            }

            @Override
            protected void onPostExecute(Boolean success) {
                // Clear regenerating state
                message.setRegenerating(false);
                
                if (success && !newVariations.isEmpty()) {
                    // Update message with new variations
                    message.getVariations().clear(); // Clear initial single translation
                    
                    // Add variations in order (translation1, translation2, etc.)
                    // Map might not be ordered, but we can try to extract known keys or just add all
                    if (newVariations.containsKey("translation1")) message.addVariation(newVariations.get("translation1"));
                    if (newVariations.containsKey("translation2")) message.addVariation(newVariations.get("translation2"));
                    if (newVariations.containsKey("translation3")) message.addVariation(newVariations.get("translation3"));
                    
                    // If map had other keys or we just want to ensure we have content
                    if (message.getVariations().isEmpty()) {
                        for (String val : newVariations.values()) {
                            message.addVariation(val);
                        }
                    }
                    
                    // Cycle to the next one (which effectively shows the first variation or next if we had one)
                    // If we just fetched, we probably want to show the SECOND one if the first one was what we already had.
                    // But usually API returns translation1 as best/similar.
                    // Let's just cycle.
                    String nextText = message.getNextVariation();
                    
                    if (isUser1) {
                        user2Adapter.updateMessage(position, nextText);
                    } else {
                        user1Adapter.updateMessage(position, nextText);
                    }
                    // CustomNotification.showNotification(ConversationalActivity.this, "Regeneration successful", true);
                } else {
                    // Just notify adapter to restore original text and enable button
                    if (isUser1) {
                        user2Adapter.notifyItemChanged(position);
                    } else {
                        user1Adapter.notifyItemChanged(position);
                    }
                    CustomNotification.showNotification(ConversationalActivity.this, "Regeneration failed", false);
                }
            }
        }.execute();
    }

    private void startTranslation(boolean isUser1) {
        float disabledAlpha = 0.5f;
        
        // Disable and fade the active user's controls
        if (isUser1) {
            user1SpeakButton.setEnabled(false);
            user1SpeakButton.animate().alpha(disabledAlpha).setDuration(300);
            user1LanguageSpinner.setEnabled(false);
            user1LanguageSpinner.animate().alpha(disabledAlpha).setDuration(300);
            user1ClearButton.setEnabled(false);
            user1ClearButton.animate().alpha(disabledAlpha).setDuration(300);
        } else {
            user2SpeakButton.setEnabled(false);
            user2SpeakButton.animate().alpha(disabledAlpha).setDuration(300);
            user2LanguageSpinner.setEnabled(false);
            user2LanguageSpinner.animate().alpha(disabledAlpha).setDuration(300);
            user2ClearButton.setEnabled(false);
            user2ClearButton.animate().alpha(disabledAlpha).setDuration(300);
        }
    }

    private void enableControls(boolean isUser1) {
        // Re-enable and restore opacity of the active user's controls
        if (isUser1) {
            user1SpeakButton.setEnabled(true);
            user1SpeakButton.animate().alpha(1f).setDuration(300);
            user1LanguageSpinner.setEnabled(true);
            user1LanguageSpinner.animate().alpha(1f).setDuration(300);
            user1ClearButton.setEnabled(true);
            user1ClearButton.animate().alpha(1f).setDuration(300);
        } else {
            user2SpeakButton.setEnabled(true);
            user2SpeakButton.animate().alpha(1f).setDuration(300);
            user2LanguageSpinner.setEnabled(true);
            user2LanguageSpinner.animate().alpha(1f).setDuration(300);
            user2ClearButton.setEnabled(true);
            user2ClearButton.animate().alpha(1f).setDuration(300);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                // Since we don't know which user triggered the permission request,
                // we'll show a notification to try again
                CustomNotification.showNotification(this, 
                    "Permission granted! Please try speaking again.", true);
            } else {
                CustomNotification.showNotification(this, 
                    "Microphone permission is required for speech recognition", false);
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
        }
        user1SpeakButton.clearAnimation();
        user2SpeakButton.clearAnimation();
        // Remove direct usage of loading dots since they are now in adapter
        // user1LoadingDots.stopAnimation(); 
        // user2LoadingDots.stopAnimation();
    }

    @Override
    public void finish() {
        super.finish();
        // Disable default animation when going back
        overridePendingTransition(0, 0);
    }

    @Override
    public void onBackPressed() {
        // Get references to views
        View topSection = findViewById(R.id.user2Section);
        View bottomSection = findViewById(R.id.user1Section);
        View centerDivider = findViewById(R.id.centerDivider);

        // Create and start exit animations
        Animation slideOutTop = AnimationUtils.loadAnimation(this, R.anim.slide_fade_in_top);
        slideOutTop.setDuration(400);
        slideOutTop.setInterpolator(new ReverseInterpolator());
        
        Animation slideOutBottom = AnimationUtils.loadAnimation(this, R.anim.slide_fade_in_bottom);
        slideOutBottom.setDuration(400);
        slideOutBottom.setInterpolator(new ReverseInterpolator());

        // Start animations
        topSection.startAnimation(slideOutTop);
        bottomSection.startAnimation(slideOutBottom);
        
        // Fade out center divider
        centerDivider.animate()
            .alpha(0f)
            .setDuration(300)
            .start();

        // Finish activity after animation
        new Handler().postDelayed(this::finish, 350);
    }

    // Custom interpolator to reverse animations
    private static class ReverseInterpolator implements Interpolator {
        @Override
        public float getInterpolation(float input) {
            return Math.abs(input - 1f);
        }
    }
}
