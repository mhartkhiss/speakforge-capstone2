package com.example.appdev.activities;

import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.appdev.R;
import com.example.appdev.Variables;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.button.MaterialButton;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class SurveyActivity extends AppCompatActivity {

    private static final String TAG = "SurveyActivity";
    private LinearLayout questionsContainer;
    private MaterialButton btnSubmitSurvey;
    private View loadingOverlay;
    private DatabaseReference mDatabase;
    
    // Structure to hold question data
    private List<Map<String, Object>> surveyQuestions = new ArrayList<>();
    // Map to store question IDs to their answer views/data
    private Map<String, Object> questionViews = new HashMap<>();
    // Store existing response data for preview mode
    private Map<String, Object> existingResponse = null;
    private boolean isPreviewMode = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_survey);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());

        questionsContainer = findViewById(R.id.questionsContainer);
        btnSubmitSurvey = findViewById(R.id.btnSubmitSurvey);
        loadingOverlay = findViewById(R.id.loadingOverlay);
        
        mDatabase = FirebaseDatabase.getInstance().getReference();

        btnSubmitSurvey.setOnClickListener(v -> submitSurvey());

        loadSurvey();
    }

    private void loadSurvey() {
        showLoading(true);

        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        String userId = user != null ? user.getUid() : Variables.userUID;

        if (userId == null || userId.isEmpty()) {
            userId = "anonymous_" + System.currentTimeMillis();
        }

        // First check if user has already submitted a response
        checkExistingResponse(userId);
    }

    private void checkExistingResponse(String userId) {
        mDatabase.child("survey_responses").orderByChild("userId").equalTo(userId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists() && snapshot.getChildrenCount() > 0) {
                    // User has already submitted a response, show preview
                    for (DataSnapshot responseSnapshot : snapshot.getChildren()) {
                        existingResponse = (Map<String, Object>) responseSnapshot.getValue();
                        if (existingResponse != null) {
                            break; // Use the first response found
                        }
                    }
                    loadSurveyForPreview();
                } else {
                    // User hasn't submitted, load survey for taking
                    loadSurveyForTaking();
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "Error checking existing responses: " + error.getMessage());
                // If error checking, allow taking survey anyway
                loadSurveyForTaking();
            }
        });
    }

    private void loadSurveyForTaking() {
        mDatabase.child("surveys").child("active_survey").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                showLoading(false);
                if (snapshot.exists()) {
                    // Load survey title and description if available
                    String title = snapshot.child("title").getValue(String.class);
                    String description = snapshot.child("description").getValue(String.class);

                    if (title != null) ((TextView) findViewById(R.id.tvSurveyTitle)).setText(title);
                    if (description != null) ((TextView) findViewById(R.id.tvSurveyDescription)).setText(description);

                    // Load sections and questions
                    questionsContainer.removeAllViews();
                    surveyQuestions.clear();
                    questionViews.clear();

                    if (snapshot.hasChild("sections")) {
                        for (DataSnapshot sectionSnapshot : snapshot.child("sections").getChildren()) {
                            String sectionTitle = sectionSnapshot.child("title").getValue(String.class);
                            addSectionTitle(sectionTitle);

                            for (DataSnapshot questionSnapshot : sectionSnapshot.child("questions").getChildren()) {
                                Map<String, Object> question = (Map<String, Object>) questionSnapshot.getValue();
                                if (question != null) {
                                    // PREFER EXISTING ID, IF AVAILABLE. Fallback to key only if ID is missing.
                                    if (!question.containsKey("id")) {
                                        question.put("id", questionSnapshot.getKey());
                                    }
                                    surveyQuestions.add(question);
                                    renderQuestion(question);
                                }
                            }
                        }
                    } else {
                        // Fallback or legacy structure support if needed
                        Toast.makeText(SurveyActivity.this, "Survey not configured correctly.", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    // Seed the survey if it doesn't exist (First run)
                    seedInitialSurvey();
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                showLoading(false);
                Toast.makeText(SurveyActivity.this, "Failed to load survey: " + error.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loadSurveyForPreview() {
        mDatabase.child("surveys").child("active_survey").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                showLoading(false);
                if (snapshot.exists()) {
                    isPreviewMode = true;

                    // Load survey title and description if available
                    String title = snapshot.child("title").getValue(String.class);
                    String description = snapshot.child("description").getValue(String.class);

                    if (title != null) ((TextView) findViewById(R.id.tvSurveyTitle)).setText(title + " - Your Response");
                    if (description != null) ((TextView) findViewById(R.id.tvSurveyDescription)).setText("You have already completed this survey. Here's your response:");

                    // Load sections and questions in preview mode
                    questionsContainer.removeAllViews();
                    surveyQuestions.clear();
                    questionViews.clear();

                    if (snapshot.hasChild("sections")) {
                        for (DataSnapshot sectionSnapshot : snapshot.child("sections").getChildren()) {
                            String sectionTitle = sectionSnapshot.child("title").getValue(String.class);
                            addSectionTitle(sectionTitle);

                            for (DataSnapshot questionSnapshot : sectionSnapshot.child("questions").getChildren()) {
                                Map<String, Object> question = (Map<String, Object>) questionSnapshot.getValue();
                                if (question != null) {
                                    // PREFER EXISTING ID, IF AVAILABLE. Fallback to key only if ID is missing.
                                    if (!question.containsKey("id")) {
                                        question.put("id", questionSnapshot.getKey());
                                    }
                                    surveyQuestions.add(question);
                                    renderQuestionPreview(question);
                                }
                            }
                        }
                    }

                    // Hide submit button in preview mode
                    btnSubmitSurvey.setVisibility(View.GONE);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                showLoading(false);
                Toast.makeText(SurveyActivity.this, "Failed to load survey: " + error.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void addSectionTitle(String title) {
        if (title == null || title.isEmpty()) return;
        
        TextView sectionView = new TextView(this);
        sectionView.setText(title);
        sectionView.setTextSize(18);
        sectionView.setTextColor(getResources().getColor(R.color.app_blue));
        // sectionView.setTypeface(getResources().getFont(R.font.poppins_semibold)); // Requires API 26+ for getFont in code context easily, or usage of ResourcesCompat
        // Simplified for now, relying on style if needed or just bold
        sectionView.setTypeface(null, android.graphics.Typeface.BOLD);
        
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 32, 0, 16);
        sectionView.setLayoutParams(params);
        
        questionsContainer.addView(sectionView);
    }

    private void renderQuestion(Map<String, Object> question) {
        String type = (String) question.get("type");
        String text = (String) question.get("text");
        String id = (String) question.get("id");
        List<String> options = (List<String>) question.get("options");

        // Question Text
        TextView questionText = new TextView(this);
        questionText.setText(text);
        questionText.setTextSize(16);
        questionText.setTextColor(getResources().getColor(R.color.black));
        questionText.setPadding(0, 0, 0, 16);
        questionsContainer.addView(questionText);

        if ("single_choice".equals(type) && options != null) {
            RadioGroup radioGroup = new RadioGroup(this);
            radioGroup.setOrientation(RadioGroup.VERTICAL);
            
            for (String option : options) {
                RadioButton rb = new RadioButton(this);
                rb.setText(option);
                radioGroup.addView(rb);
            }
            questionsContainer.addView(radioGroup);
            questionViews.put(id, radioGroup);
            
        } else if ("multiple_choice".equals(type) && options != null) {
            List<CheckBox> checkBoxes = new ArrayList<>();
            for (String option : options) {
                CheckBox cb = new CheckBox(this);
                cb.setText(option);
                questionsContainer.addView(cb);
                checkBoxes.add(cb);
            }
            questionViews.put(id, checkBoxes);
            
        } else if ("rating".equals(type)) {
            // Simple horizontal layout with 1-5 buttons or RadioButtons
            RadioGroup radioGroup = new RadioGroup(this);
            radioGroup.setOrientation(RadioGroup.HORIZONTAL);
            radioGroup.setWeightSum(5);
            
            for (int i = 1; i <= 5; i++) {
                RadioButton rb = new RadioButton(this);
                rb.setText(String.valueOf(i));
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                        0, 
                        LinearLayout.LayoutParams.WRAP_CONTENT, 
                        1.0f
                );
                rb.setLayoutParams(params);
                rb.setGravity(android.view.Gravity.CENTER);
                radioGroup.addView(rb);
            }
            questionsContainer.addView(radioGroup);
            questionViews.put(id, radioGroup);
            
            // Legend
            LinearLayout legendLayout = new LinearLayout(this);
            legendLayout.setOrientation(LinearLayout.HORIZONTAL);
            TextView low = new TextView(this);
            low.setText("Low/Poor");
            low.setTextSize(12);
            low.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f));
            
            TextView high = new TextView(this);
            high.setText("High/Good");
            high.setTextSize(12);
            high.setGravity(android.view.Gravity.END);
            high.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f));
            
            legendLayout.addView(low);
            legendLayout.addView(high);
            questionsContainer.addView(legendLayout);

        } else if ("text".equals(type)) {
            EditText editText = new EditText(this);
            editText.setHint("Type your answer here...");
            editText.setBackgroundResource(android.R.drawable.edit_text); // Default simple style
            editText.setPadding(16, 16, 16, 16);
            editText.setMinLines(3);
            editText.setGravity(android.view.Gravity.TOP | android.view.Gravity.START);
            
            questionsContainer.addView(editText);
            questionViews.put(id, editText);
        }

        // Add spacing after question
        View spacer = new View(this);
        spacer.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 32));
        questionsContainer.addView(spacer);
    }

    private void renderQuestionPreview(Map<String, Object> question) {
        String type = (String) question.get("type");
        String text = (String) question.get("text");
        String id = (String) question.get("id");
        List<String> options = (List<String>) question.get("options");

        // Question Text
        TextView questionText = new TextView(this);
        questionText.setText(text);
        questionText.setTextSize(16);
        questionText.setTextColor(getResources().getColor(R.color.black));
        questionText.setPadding(0, 0, 0, 16);
        questionsContainer.addView(questionText);

        // Get user's answer for this question
        Object userAnswer = null;
        if (existingResponse != null && existingResponse.containsKey("answers")) {
            Map<String, Object> answers = (Map<String, Object>) existingResponse.get("answers");
            userAnswer = answers != null ? answers.get(id) : null;
        }

        // Display answer based on question type
        if ("single_choice".equals(type) && options != null) {
            for (String option : options) {
                TextView optionView = new TextView(this);
                optionView.setText("○ " + option);
                optionView.setTextSize(14);
                optionView.setPadding(32, 4, 0, 4);

                if (option.equals(userAnswer)) {
                    optionView.setText("● " + option);
                    optionView.setTextColor(getResources().getColor(R.color.app_blue));
                    optionView.setTypeface(null, android.graphics.Typeface.BOLD);
                } else {
                    optionView.setTextColor(getResources().getColor(R.color.text_gray));
                }

                questionsContainer.addView(optionView);
            }

        } else if ("multiple_choice".equals(type) && options != null && userAnswer instanceof List) {
            List<String> selectedOptions = (List<String>) userAnswer;
            for (String option : options) {
                TextView optionView = new TextView(this);
                boolean isSelected = selectedOptions != null && selectedOptions.contains(option);

                if (isSelected) {
                    optionView.setText("☑ " + option);
                    optionView.setTextColor(getResources().getColor(R.color.app_blue));
                    optionView.setTypeface(null, android.graphics.Typeface.BOLD);
                } else {
                    optionView.setText("☐ " + option);
                    optionView.setTextColor(getResources().getColor(R.color.text_gray));
                }

                optionView.setTextSize(14);
                optionView.setPadding(32, 4, 0, 4);
                questionsContainer.addView(optionView);
            }

        } else if ("rating".equals(type)) {
            // Display rating stars
            LinearLayout ratingLayout = new LinearLayout(this);
            ratingLayout.setOrientation(LinearLayout.HORIZONTAL);

            String ratingStr = userAnswer != null ? userAnswer.toString() : "0";
            int rating = 0;
            try {
                rating = Integer.parseInt(ratingStr);
            } catch (NumberFormatException e) {
                rating = 0;
            }

            for (int i = 1; i <= 5; i++) {
                TextView starView = new TextView(this);
                if (i <= rating) {
                    starView.setText("★");
                    starView.setTextColor(getResources().getColor(R.color.app_blue));
                } else {
                    starView.setText("☆");
                    starView.setTextColor(getResources().getColor(R.color.text_gray));
                }
                starView.setTextSize(20);
                starView.setPadding(4, 0, 4, 0);
                ratingLayout.addView(starView);
            }

            TextView ratingText = new TextView(this);
            ratingText.setText(" (" + rating + "/5)");
            ratingText.setTextSize(14);
            ratingText.setTextColor(getResources().getColor(R.color.app_blue));
            ratingLayout.addView(ratingText);

            questionsContainer.addView(ratingLayout);

        } else if ("text".equals(type)) {
            TextView answerView = new TextView(this);
            String answer = userAnswer != null ? userAnswer.toString() : "No answer provided";
            answerView.setText(answer);
            answerView.setTextSize(14);
            answerView.setTextColor(getResources().getColor(R.color.app_blue));
            answerView.setBackgroundResource(android.R.drawable.edit_text);
            answerView.setPadding(16, 16, 16, 16);
            answerView.setMinLines(3);
            questionsContainer.addView(answerView);
        }

        // Add spacing after question
        View spacer = new View(this);
        spacer.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 32));
        questionsContainer.addView(spacer);
    }

    private void submitSurvey() {
        Map<String, Object> answers = new HashMap<>();
        List<String> missingQuestions = new ArrayList<>();

        for (Map<String, Object> question : surveyQuestions) {
            String id = (String) question.get("id");
            String questionText = (String) question.get("text");
            if (id == null) continue; // Skip questions with no ID

            String type = (String) question.get("type");
            Object view = questionViews.get(id);
            boolean hasAnswer = false;

            if (view == null) {
                missingQuestions.add(questionText != null ? questionText : "Question " + id);
                continue;
            }

            if ("single_choice".equals(type) || "rating".equals(type)) {
                if (!(view instanceof RadioGroup)) {
                    missingQuestions.add(questionText != null ? questionText : "Question " + id);
                    continue;
                }
                RadioGroup rg = (RadioGroup) view;
                int selectedId = rg.getCheckedRadioButtonId();
                if (selectedId != -1) {
                    RadioButton selectedRb = rg.findViewById(selectedId);
                    if (selectedRb != null) {
                        answers.put(id, selectedRb.getText().toString());
                        hasAnswer = true;
                    }
                }
            } else if ("multiple_choice".equals(type)) {
                if (!(view instanceof List)) {
                    missingQuestions.add(questionText != null ? questionText : "Question " + id);
                    continue;
                }
                try {
                    List<CheckBox> checkBoxes = (List<CheckBox>) view;
                    List<String> selectedOptions = new ArrayList<>();
                    for (CheckBox cb : checkBoxes) {
                        if (cb.isChecked()) {
                            selectedOptions.add(cb.getText().toString());
                        }
                    }
                    if (!selectedOptions.isEmpty()) {
                        answers.put(id, selectedOptions);
                        hasAnswer = true;
                    }
                } catch (ClassCastException e) {
                    Log.e(TAG, "Error casting checkbox list for question " + id, e);
                    missingQuestions.add(questionText != null ? questionText : "Question " + id);
                }
            } else if ("text".equals(type)) {
                if (!(view instanceof EditText)) {
                    missingQuestions.add(questionText != null ? questionText : "Question " + id);
                    continue;
                }
                EditText et = (EditText) view;
                String text = et.getText().toString().trim();
                if (!TextUtils.isEmpty(text)) {
                    answers.put(id, text);
                    hasAnswer = true;
                }
            }

            if (!hasAnswer) {
                missingQuestions.add(questionText != null ? questionText : "Question " + id);
            }
        }

        // Validation: Require ALL questions to be answered
        if (!missingQuestions.isEmpty()) {
            String message = "Please answer all required questions:\n\n";
            for (int i = 0; i < Math.min(missingQuestions.size(), 3); i++) {
                message += "• " + missingQuestions.get(i) + "\n";
            }
            if (missingQuestions.size() > 3) {
                message += "... and " + (missingQuestions.size() - 3) + " more";
            }
            Toast.makeText(this, message.trim(), Toast.LENGTH_LONG).show();
            return;
        }

        saveResponse(answers);
    }

    private void saveResponse(Map<String, Object> answers) {
        showLoading(true);
        
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        // Prioritize Firebase Auth UID over global variable to ensure accuracy
        String userId = user != null ? user.getUid() : Variables.userUID;
        String email = user != null ? user.getEmail() : (userId.equals("guest") ? "guest@speakforge.app" : "unknown");
        
        if (userId == null || userId.isEmpty()) {
            userId = "anonymous_" + System.currentTimeMillis();
        }

        // Create effectively final copies for use in inner class
        final String finalUserId = userId;
        final String finalEmail = email;

        // Fetch username if possible, or just store what we have
        DatabaseReference userRef = mDatabase.child("users").child(finalUserId);
        userRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                String username = snapshot.child("username").getValue(String.class);
                if (username == null) username = "User";

                Map<String, Object> responseData = new HashMap<>();
                responseData.put("userId", finalUserId);
                responseData.put("email", finalEmail);
                responseData.put("username", username);
                responseData.put("timestamp", System.currentTimeMillis());
                responseData.put("date", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
                responseData.put("answers", answers);

                String key = mDatabase.child("survey_responses").push().getKey();
                if (key != null) {
                    mDatabase.child("survey_responses").child(key).setValue(responseData)
                            .addOnSuccessListener(aVoid -> {
                                showLoading(false);
                                Toast.makeText(SurveyActivity.this, "Thank you for your feedback!", Toast.LENGTH_LONG).show();
                                finish();
                            })
                            .addOnFailureListener(e -> {
                                showLoading(false);
                                Toast.makeText(SurveyActivity.this, "Failed to submit survey: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                            });
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                showLoading(false);
                // Proceed with minimal info if user fetch fails
                submitWithMinimalInfo(finalUserId, finalEmail, answers);
            }
        });
    }
    
    private void submitWithMinimalInfo(String userId, String email, Map<String, Object> answers) {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("userId", userId);
        responseData.put("email", email);
        responseData.put("username", "Unknown");
        responseData.put("timestamp", System.currentTimeMillis());
        responseData.put("answers", answers);
        
        String key = mDatabase.child("survey_responses").push().getKey();
        if (key != null) {
            mDatabase.child("survey_responses").child(key).setValue(responseData)
                    .addOnSuccessListener(aVoid -> {
                        Toast.makeText(SurveyActivity.this, "Thank you for your feedback!", Toast.LENGTH_LONG).show();
                        finish();
                    });
        }
    }

    private void showLoading(boolean isLoading) {
        loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnSubmitSurvey.setEnabled(!isLoading);
    }
    
    // Initial seed function - normally this would be done via Admin, but helpful for first run
    private void seedInitialSurvey() {
        Map<String, Object> survey = new HashMap<>();
        survey.put("title", "SpeakForge Mobile App User Survey");
        survey.put("description", "Thank you for helping us improve SpeakForge! We are focusing on making English ↔ Bisaya translation seamless and accurate.");
        
        List<Map<String, Object>> sections = new ArrayList<>();
        
        // Section 1
        Map<String, Object> s1 = new HashMap<>();
        s1.put("title", "Section 1: General Usage");
        List<Map<String, Object>> q1List = new ArrayList<>();
        
        q1List.add(createQuestion("q1", "single_choice", "How often do you use SpeakForge?", 
                new String[]{"Daily", "Weekly", "Occasionally", "Just downloaded it"}));
        
        q1List.add(createQuestion("q2", "single_choice", "What is your primary reason for using the app?", 
                new String[]{"Communicating with family/friends", "Learning Bisaya or English", "Work / Professional", "Travel", "Testing technology"}));
        
        q1List.add(createQuestion("q3", "multiple_choice", "Which features do you use the most?", 
                new String[]{"Text-to-Text Translation", "Voice-to-Text (Single Screen)", "Split-Screen Conversation", "Connect Mode", "Translation History"}));
        
        s1.put("questions", q1List);
        sections.add(s1);
        
        // Section 2
        Map<String, Object> s2 = new HashMap<>();
        s2.put("title", "Section 2: Translation Quality & Speed");
        List<Map<String, Object>> q2List = new ArrayList<>();
        
        q2List.add(createQuestion("q4", "rating", "How accurate do you find the Bisaya ↔ English translations? (1=Poor, 5=Perfect)", null));
        q2List.add(createQuestion("q5", "rating", "How would you rate the SPEED of the translation generation? (1=Slow, 5=Instant)", null));
        q2List.add(createQuestion("q6", "single_choice", "Have you tried switching the 'Translation Mode' (Formal vs. Casual)?", 
                new String[]{"Yes, difference was helpful", "Yes, but no noticeable difference", "No, didn't know I could"}));
        q2List.add(createQuestion("q7", "single_choice", "Which AI Translator engine do you prefer?", 
                new String[]{"Default (Gemini)", "Claude", "DeepSeek", "Don't know"}));
                
        s2.put("questions", q2List);
        sections.add(s2);
        
        // Section 3
        Map<String, Object> s3 = new HashMap<>();
        s3.put("title", "Section 3: Problems Encountered");
        List<Map<String, Object>> q3List = new ArrayList<>();
        
        q3List.add(createQuestion("q8", "multiple_choice", "Have you experienced any of the following technical issues?", 
                new String[]{"Microphone Issues", "Connection Errors", "Translation Errors", "Scanning Issues", "App Crashes", "Audio Playback", "None"}));
        q3List.add(createQuestion("q9", "text", "If you selected an issue above, can you briefly describe what happened?", null));
        
        s3.put("questions", q3List);
        sections.add(s3);
        
        // Section 4
        Map<String, Object> s4 = new HashMap<>();
        s4.put("title", "Section 4: User Interface (UI)");
        List<Map<String, Object>> q4List = new ArrayList<>();
        
        q4List.add(createQuestion("q10", "rating", "How would you rate the new 'Welcome / Language Setup' screen?", null));
        q4List.add(createQuestion("q11", "single_choice", "For Split-Screen (Face-to-Face) mode, is the layout comfortable?", 
                new String[]{"Yes, works perfectly", "It's okay", "No, confusing"}));
        
        s4.put("questions", q4List);
        sections.add(s4);
        
        // Section 5
        Map<String, Object> s5 = new HashMap<>();
        s5.put("title", "Section 5: Final Thoughts");
        List<Map<String, Object>> q5List = new ArrayList<>();
        
        q5List.add(createQuestion("q12", "text", "Since the app focuses only on English and Bisaya, are there specific Bisaya words or phrases it struggles with?", null));
        q5List.add(createQuestion("q13", "rating", "How likely are you to recommend SpeakForge to a friend?", null));
        
        s5.put("questions", q5List);
        sections.add(s5);
        
        survey.put("sections", sections);
        
        mDatabase.child("surveys").child("active_survey").setValue(survey)
            .addOnSuccessListener(aVoid -> loadSurvey()); // Reload after seeding
    }
    
    private Map<String, Object> createQuestion(String id, String type, String text, String[] options) {
        Map<String, Object> q = new HashMap<>();
        q.put("id", id);
        q.put("type", type);
        q.put("text", text);
        if (options != null) {
            List<String> opts = new ArrayList<>();
            for(String s : options) opts.add(s);
            q.put("options", opts);
        }
        return q;
    }
}
