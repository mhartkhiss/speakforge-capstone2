package com.example.appdev;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.content.Intent;
import android.os.Bundle;
import com.example.appdev.utils.SpeechRecognitionHelper;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;


import com.bumptech.glide.Glide;
import com.example.appdev.adapters.ChatAdapter;
import com.example.appdev.adapters.ConnectChatAdapter;
import com.example.appdev.models.Message;
import com.example.appdev.utils.CustomNotification;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import android.os.AsyncTask;

import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class ConnectChatActivity extends AppCompatActivity {

    private RecyclerView recyclerViewChat;
    private ImageButton buttonVoiceIcon;
    private LinearLayout languageSelectionCard;
    private TextView buttonLanguageSelection;
    private ImageButton buttonChangeTranslatorNew;
    private ImageButton buttonChatToggle;
    private com.google.android.material.textfield.TextInputEditText textInputMessage;
    private ImageButton buttonSendText;
    private LinearLayout textInputContainer;
    private ChatAdapter chatAdapter;
    private DatabaseReference messagesRef;
    private String sessionId, recipientLanguage;
    private static final int SPEECH_REQUEST_CODE = 1;
    private DatabaseReference contactSettingsRef;
    private boolean translateEnabled = false;
    private int previousMessageCount = 0;
    private String recipientId;
    private long sessionStartTime;
    private boolean sessionEnded = false;
    private boolean historyEnabled = false;
    private ImageButton buttonHistory;
    private Button buttonChangeLanguage;
    private ImageButton buttonChangeTranslator;
    private ValueEventListener sessionEndListener;
    private SpeechRecognitionHelper speechHelper;

    // Reply UI elements
    private LinearLayout replyContainer;
    private TextView replyToSenderName;
    private TextView replyToMessageText;
    private ImageButton buttonCancelReply;


    //Establish Connection
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Add this line to adjust resize mode
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        setContentView(R.layout.activity_connect_chat);

        // Retrieve recipient information from intent extras
        String recipientName = getIntent().getStringExtra("username");
        recipientLanguage = getIntent().getStringExtra("recipientLanguage");
        String profileImageUrl = getIntent().getStringExtra("profileImageUrl");

        // Store recipientId as class field
        recipientId = getIntent().getStringExtra("userId");

        // Set session start time
        sessionStartTime = System.currentTimeMillis();

        // Check if sessionId is provided (from connection request)
        String providedSessionId = getIntent().getStringExtra("sessionId");
        if (providedSessionId != null) {
            sessionId = providedSessionId;
            Variables.connectSessionId = sessionId;

            // Set this session as active to prevent duplicate openings
            com.example.appdev.utils.ConnectionRequestManager.getInstance().setActiveSessionId(sessionId);
        }


        // Generate a unique session ID for the conversation using the sender and recipient IDs
        String senderId = FirebaseAuth.getInstance().getCurrentUser().getUid();
        sessionId = generateSessionId(senderId, recipientId);
        Variables.connectSessionId = sessionId;

        // Initialize Firebase Database
        FirebaseDatabase database = FirebaseDatabase.getInstance();
        messagesRef = database.getReference("connect_chats");

        // Initialize views
        recyclerViewChat = findViewById(R.id.recyclerViewChat);
        buttonVoiceIcon = findViewById(R.id.buttonVoiceIcon);
        languageSelectionCard = findViewById(R.id.languageSelectionCard);
        buttonLanguageSelection = findViewById(R.id.buttonLanguageSelection);
        buttonChangeTranslatorNew = findViewById(R.id.buttonChangeTranslatorNew);
        buttonChatToggle = findViewById(R.id.buttonChatToggle);

        // Initialize text input elements (for testing)
        textInputMessage = findViewById(R.id.textInputMessage);
        buttonSendText = findViewById(R.id.buttonSendText);
        textInputContainer = findViewById(R.id.textInputContainer);

        // Initialize reply UI elements
        replyContainer = findViewById(R.id.replyContainer);
        replyToSenderName = findViewById(R.id.replyToSenderName);
        replyToMessageText = findViewById(R.id.replyToMessageText);
        buttonCancelReply = findViewById(R.id.buttonCancelReply);

        // Initialize history button from the included layout
        View includeUser = findViewById(R.id.includeUser);
        buttonHistory = includeUser.findViewById(R.id.buttonHistory);

        // Set up cancel reply button
        if (buttonCancelReply != null) {
            buttonCancelReply.setOnClickListener(v -> cancelReply());
        }

        // Set up history button
        if (buttonHistory != null) {
            buttonHistory.setOnClickListener(v -> toggleHistory());
        }


        // Initialize RecyclerView
        chatAdapter = new ConnectChatAdapter(messagesRef, sessionId, this);

        recyclerViewChat.setAdapter(chatAdapter);

        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        layoutManager.setStackFromEnd(true);
        recyclerViewChat.setLayoutManager(layoutManager);
        recyclerViewChat.setAdapter(chatAdapter);

        // Set click listener for voice icon button
        buttonVoiceIcon.setOnClickListener(v -> startSpeechRecognition());

        // Set click listener for language selection card
        languageSelectionCard.setOnClickListener(v -> showLanguageSelectionDialog());

        // Set click listener for new translator button
        buttonChangeTranslatorNew.setOnClickListener(v -> showTranslatorSelectionDialog());

        // Set click listener for chat toggle button
        buttonChatToggle.setOnClickListener(v -> {
            if (textInputContainer.getVisibility() == View.GONE) {
                // Show text input
                textInputContainer.setVisibility(View.VISIBLE);
                buttonChatToggle.setImageResource(R.drawable.ic_close);
            } else {
                // Hide text input
                textInputContainer.setVisibility(View.GONE);
                buttonChatToggle.setImageResource(R.drawable.ic_chat);
                // Hide keyboard if showing
                android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager)
                    getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
                if (imm != null && getCurrentFocus() != null) {
                    imm.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), 0);
                }
            }
        });

        // Set click listener for text send button
        if (buttonSendText != null) {
            buttonSendText.setOnClickListener(v -> sendTextMessage());
        }

        // Set up text input enter key handling
        if (textInputMessage != null) {
            textInputMessage.setOnEditorActionListener((v, actionId, event) -> {
                if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEND) {
                    sendTextMessage();
                    return true;
                }
                return false;
            });
        }

        // Back button removed - no longer needed

        // Set up real-time listener for messages (shows current session messages)
        setupRealtimeListener();

        DatabaseReference recipientLanguageRef = FirebaseDatabase.getInstance().getReference("users").child(recipientId).child("language");
        recipientLanguageRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                recipientLanguage = dataSnapshot.getValue(String.class);
            }
            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
            }
        });

        de.hdodenhof.circleimageview.CircleImageView imageViewUserPicture = findViewById(R.id.imageViewUserPicture);

        if (profileImageUrl != null && !profileImageUrl.equals("none")) {
            Glide.with(this)
                    .load(profileImageUrl) // Replace with the URL or URI of the user's image
                    .into(imageViewUserPicture);
        } else {
            imageViewUserPicture.setImageResource(R.drawable.default_userpic);
        }

        TextView textViewUsername = findViewById(R.id.textViewUsername);
        textViewUsername.setText(recipientName);

        // Update button icons with current language and translator
        updateLanguageButtonIcon();
        updateTranslatorButtonIcon();
        updateLanguageSelectionButton();

        // Set click listener for end session button
        ImageView buttonEndSession = findViewById(R.id.buttonEndSession);
        buttonEndSession.setOnClickListener(v -> {
            endSession();
        });

        // Initialize speech helper
        speechHelper = new SpeechRecognitionHelper(this);

        // Initialize contact settings reference - check recipient's settings for the current user
        contactSettingsRef = FirebaseDatabase.getInstance().getReference()
                .child("users")
                .child(recipientId);  // Changed from senderId to recipientId

        // Listen for session end messages
        listenForSessionEnd();

        contactSettingsRef = FirebaseDatabase.getInstance().getReference()
                .child("users")
                .child(recipientId)
                .child("contactsettings")
                .child(senderId)
                .child("translateMessages");

        // Listen for translation setting changes
        contactSettingsRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                if (dataSnapshot.exists()) {
                    translateEnabled = dataSnapshot.getValue(Boolean.class);
                } else {
                    translateEnabled = false; // Default to false if setting doesn't exist
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                translateEnabled = false;
            }
        });
    }

    private String generateSessionId(String senderId, String recipientId) {
        // Sort sender and recipient IDs alphabetically to ensure consistency
        String[] ids = {senderId, recipientId};
        Arrays.sort(ids);

        // Concatenate sender and recipient IDs to create the session ID
        return ids[0] + "_" + ids[1];
    }

    public void sendMessage(String message, String targetLanguage) {
        if (message.trim().isEmpty()) {
            return;
        }

        String senderId = FirebaseAuth.getInstance().getCurrentUser().getUid();
        String messageId = messagesRef.child(sessionId).push().getKey();
        long timestamp = System.currentTimeMillis();

        // Save message data to Firebase
        if (messageId != null) {
            // Create a map for the initial message data without translations
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("messageId", messageId);
            messageData.put("message", message); // Original message text
            messageData.put("timestamp", timestamp);
            messageData.put("senderId", senderId);
            messageData.put("senderLanguage", Variables.userLanguage); // Store sender's language
            messageData.put("translationMode", Variables.isFormalTranslationMode ? "formal" : "casual"); // Store translation mode (formal/casual)
            messageData.put("translationState", "TRANSLATING"); // Set initial state to TRANSLATING
            messageData.put("isVoiceMessage", true); // Mark as voice message
            messageData.put("voiceText", message); // Store the transcribed voice text

            // Add reply information if replying to a message
            Message replyingToMessage = chatAdapter.getReplyingToMessage();
            if (replyingToMessage != null) {
                messageData.put("replyToMessageId", replyingToMessage.getMessageId());
                messageData.put("replyToSenderId", replyingToMessage.getSenderId());
                messageData.put("replyToMessage", replyingToMessage.getMessage());
            }

            // Save the message to Firebase
            messagesRef.child(sessionId).child(messageId).setValue(messageData)
                .addOnSuccessListener(aVoid -> {
                    // Message saved successfully, now translate it
                    translateMessage(targetLanguage, message, messageId);
                })
                .addOnFailureListener(e -> {
                    Log.e("ConnectChatActivity", "Failed to save message: " + e.getMessage());
                });
        }
    }

    private void translateMessage(String targetLanguage, String messageTextOG, String messageId) {
        Variables.openAiPrompt = 1; // Use standard translation setting for initial messages

        // Prepare the request body
        JSONObject requestBody = new JSONObject();
        try {
            requestBody.put("text", messageTextOG);
            requestBody.put("source_language", Variables.userLanguage);
            requestBody.put("target_language", targetLanguage);
            requestBody.put("translation_mode", Variables.isFormalTranslationMode ? "formal" : "casual");
            requestBody.put("variants", "single"); // Add variants parameter explicitly
            requestBody.put("model", Variables.userTranslator);
            requestBody.put("room_id", sessionId);
            requestBody.put("message_id", messageId);
            requestBody.put("current_user_id", FirebaseAuth.getInstance().getCurrentUser().getUid());
            requestBody.put("recipient_id", recipientId);
            requestBody.put("context_depth", 25); // Up to 25 messages for context for better topic awareness
            requestBody.put("use_context", true); // Enable context-aware translation
            requestBody.put("session_start_time", sessionStartTime); // Only use messages from current session

            String apiUrl = Variables.API_TRANSLATE_DB_CONTEXT_URL;

            new AsyncTask<Void, Void, Boolean>() {
                @Override
                protected Boolean doInBackground(Void... voids) {
                    try {
                        URL url = new URL(apiUrl);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setDoOutput(true);

                        try (OutputStream os = conn.getOutputStream()) {
                            byte[] input = requestBody.toString().getBytes("utf-8");
                            os.write(input, 0, input.length);
                        }

                        if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                            StringBuilder response = new StringBuilder();
                            try (BufferedReader br = new BufferedReader(
                                    new InputStreamReader(conn.getInputStream(), "utf-8"))) {
                                String responseLine;
                                while ((responseLine = br.readLine()) != null) {
                                    response.append(responseLine.trim());
                                }

                                // With API_TRANSLATE_DB_CONTEXT_URL, Firebase is updated directly by the server
                                return true;
                            }
                        } else {
                            // If translation fails, set state back to null
                            DatabaseReference messageRef = messagesRef.child(sessionId).child(messageId);
                            messageRef.child("translationState").setValue(null);
                            return false;
                        }
                    } catch (Exception e) {
                        Log.e("ConnectChatActivity", "Error translating message: " + e.getMessage());
                        // If translation fails, set state back to null
                        DatabaseReference messageRef = messagesRef.child(sessionId).child(messageId);
                        messageRef.child("translationState").setValue(null);
                        return false;
                    }
                }

                @Override
                protected void onPostExecute(Boolean success) {
                    if (!success) {
                        Log.e("ConnectChatActivity", "Failed to translate message");
                    }
                }
            }.execute();
        } catch (Exception e) {
            Log.e("ConnectChatActivity", "Error creating JSON request: " + e.getMessage());
            // If JSON creation fails, set state back to null
            DatabaseReference messageRef = messagesRef.child(sessionId).child(messageId);
            messageRef.child("translationState").setValue(null);
        }
    }

    /**
     * Send a text message (for testing purposes when voice input is not available)
     */
    private void sendTextMessage() {
        if (textInputMessage == null) return;

        String messageText = textInputMessage.getText().toString().trim();
        if (messageText.isEmpty()) {
            return;
        }

        // Clear the input field
        textInputMessage.setText("");

        // Send the message using the same logic as voice messages
        sendMessage(messageText, recipientLanguage);

        // Hide keyboard
        android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager)
            getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
        if (imm != null && getCurrentFocus() != null) {
            imm.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), 0);
        }
    }

    private String removeQuotationMarks(String text) {
        if (text.startsWith("\"") && text.endsWith("\"")) {
            text = text.substring(1, text.length() - 1);
        }
        if (text.startsWith("&quot;") && text.endsWith("&quot;")) {
            text = text.substring(6, text.length() - 6);
        }
        return text;
    }

    /**
     * Shows the reply UI when a user chooses to reply to a message
     * @param message The message being replied to
     */
    public void showReplyingToUI(Message message) {
        if (replyContainer == null) return;

        // Show the reply container
        replyContainer.setVisibility(View.VISIBLE);

        // Set the sender name
        String senderId = message.getSenderId();
        String currentUserId = FirebaseAuth.getInstance().getCurrentUser().getUid();

        if (senderId.equals(currentUserId)) {
            replyToSenderName.setText("You");
        } else {
            // Look up the username from Firebase
            DatabaseReference userRef = FirebaseDatabase.getInstance().getReference("users").child(senderId);
            userRef.child("username").addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot snapshot) {
                    String username = snapshot.getValue(String.class);
                    if (username != null && !username.isEmpty()) {
                        replyToSenderName.setText(username);
                    } else {
                        replyToSenderName.setText("User");
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError error) {
                    replyToSenderName.setText("User");
                }
            });
        }

        // Set the message text (truncate if too long)
        String messageText = message.getMessage();
        if (messageText != null) {
            if (messageText.length() > 50) {
                messageText = messageText.substring(0, 47) + "...";
            }
            replyToMessageText.setText(messageText);
        } else {
            replyToMessageText.setText("[Message unavailable]");
        }

        // Focus on the voice icon button
        buttonVoiceIcon.requestFocus();
    }

    /**
     * Cancels the current reply action
     */
    private void cancelReply() {
        if (replyContainer != null) {
            replyContainer.setVisibility(View.GONE);
        }

        // Clear the replying to message in the adapter
        if (chatAdapter != null) {
            chatAdapter.clearReplyingToMessage();
        }
    }

    private void toggleHistory() {
        historyEnabled = !historyEnabled;

        if (historyEnabled) {
            // Enable history - load all messages
            buttonHistory.setImageTintList(android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("#FF5722")));
            loadAllMessages();
        } else {
            // Disable history - filter to show only current session messages
            buttonHistory.setImageTintList(android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("#666666")));
            filterToCurrentSession();
        }
    }

    private void loadAllMessages() {
        if (sessionId != null) {
            messagesRef.child(sessionId).orderByChild("timestamp").addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    List<Message> messages = new ArrayList<>();
                    for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                        Message message = snapshot.getValue(Message.class);
                        if (message != null) {
                            // Mark this message as a voice message for the ConnectChatActivity
                            message.setIsVoiceMessage(true);
                            message.setVoiceText(message.getMessage());
                            messages.add(message);
                        }
                    }
                    chatAdapter.setMessages(messages);

                    // Scroll to bottom when loading history
                    if (messages.size() > 0) {
                        recyclerViewChat.scrollToPosition(messages.size() - 1);
                    }
                    previousMessageCount = messages.size();
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                    Log.e("ConnectChatActivity", "Error loading message history: " + databaseError.getMessage());
                }
            });
        }
    }

    private void setupRealtimeListener() {
        if (sessionId != null) {
            messagesRef.child(sessionId).orderByChild("timestamp").addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    List<Message> messages = new ArrayList<>();
                    for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                        Message message = snapshot.getValue(Message.class);
                        if (message != null) {
                            // Mark this message as a voice message for the ConnectChatActivity
                            message.setIsVoiceMessage(true);
                            message.setVoiceText(message.getMessage());
                            messages.add(message);
                        }
                    }

                    // Always show current session messages, but hide history if disabled
                    List<Message> messagesToShow = new ArrayList<>();
                    long sessionStartTime = ConnectChatActivity.this.sessionStartTime;

                    for (Message message : messages) {
                        // Show messages from current session or if history is enabled
                        if (message.getTimestamp() >= sessionStartTime || historyEnabled) {
                            messagesToShow.add(message);
                        }
                    }

                    chatAdapter.setMessages(messagesToShow);

                    // Scroll if new messages are added
                    int newSize = messagesToShow.size();
                    if (newSize > previousMessageCount) {
                        recyclerViewChat.scrollToPosition(newSize - 1);
                    }
                    previousMessageCount = newSize;
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                    Log.e("ConnectChatActivity", "Error in realtime listener: " + databaseError.getMessage());
                }
            });
        }
    }

    private void clearMessages() {
        chatAdapter.setMessages(new ArrayList<>());
        previousMessageCount = 0;
    }

    private void filterToCurrentSession() {
        if (sessionId != null) {
            messagesRef.child(sessionId).orderByChild("timestamp").addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    List<Message> messagesToShow = new ArrayList<>();
                    long currentSessionStartTime = ConnectChatActivity.this.sessionStartTime;

                    for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                        Message message = snapshot.getValue(Message.class);
                        if (message != null) {
                            // Mark this message as a voice message for the ConnectChatActivity
                            message.setIsVoiceMessage(true);
                            message.setVoiceText(message.getMessage());

                            // Only show messages from the current session
                            if (message.getTimestamp() >= currentSessionStartTime) {
                                messagesToShow.add(message);
                            }
                        }
                    }

                    chatAdapter.setMessages(messagesToShow);

                    // Scroll to bottom when filtering to current session
                    if (messagesToShow.size() > 0) {
                        recyclerViewChat.scrollToPosition(messagesToShow.size() - 1);
                    }
                    previousMessageCount = messagesToShow.size();
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                    Log.e("ConnectChatActivity", "Error filtering to current session: " + databaseError.getMessage());
                }
            });
        }
    }

    private void startSpeechRecognition() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            int permissionResult = checkSelfPermission(android.Manifest.permission.RECORD_AUDIO);
            if (permissionResult == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                startListening();
            } else {
                requestPermissions(new String[]{android.Manifest.permission.RECORD_AUDIO}, SPEECH_REQUEST_CODE);
            }
        } else {
            startListening();
        }
    }

    private void startListening() {
        if (speechHelper != null) {
            speechHelper.startSpeechRecognition(text -> {
                // Send the transcribed voice message
                sendMessage(text, recipientLanguage);
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == SPEECH_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                startListening();
            } else {
                CustomNotification.showNotification(this,
                    "Microphone permission is required for speech recognition", false);
            }
        }
    }



    /**
     * End the current session
     */
    private void endSession() {
        // Show custom confirmation dialog
        com.example.appdev.utils.CustomDialog confirmDialog = new com.example.appdev.utils.CustomDialog(this);
        confirmDialog.setTitle("End Session");
        confirmDialog.setMessage("Are you sure you want to end this session? The other user will be notified.");
        confirmDialog.setButtonText("End Session");
        confirmDialog.setIcon(R.drawable.ic_warning);
        confirmDialog.setIconTint(getResources().getColor(R.color.app_orange));

        confirmDialog.setButtonClickListener(v -> {
            confirmDialog.dismiss();
            // Send session end message and finish
            performEndSession(true);
        });

        confirmDialog.show();
    }

    /**
     * End the session directly without confirmation dialog
     * @param sendMessage Whether to send a session end message to the other user
     */
    private void endSessionDirectly(boolean sendMessage) {
        performEndSession(sendMessage);
    }

    /**
     * Common method to perform session ending logic
     * @param sendMessage Whether to send a session end message to the other user
     */
    private void performEndSession(boolean sendMessage) {
        // Send session end message only if requested
        if (sendMessage) {
            sendSessionEndMessage();
        }

        // Remove session end listener to prevent crashes
        if (sessionEndListener != null && sessionId != null) {
            messagesRef.child(sessionId).removeEventListener(sessionEndListener);
            sessionEndListener = null;
        }

        // Clear active session
        if (sessionId != null) {
            com.example.appdev.utils.ConnectionRequestManager.getInstance().clearActiveSessionId();
        }

        // Finish activity
        finish();
    }

    /**
     * Send a message indicating the session has ended
     */
    private void sendSessionEndMessage() {
        String currentUserId = FirebaseAuth.getInstance().getCurrentUser().getUid();
        String messageText = "has left the session";
        String messageId = messagesRef.child(sessionId).push().getKey();

        // Create session end message
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("messageId", messageId);
        messageData.put("senderId", currentUserId);
        messageData.put("messageText", messageText);
        messageData.put("timestamp", System.currentTimeMillis());
        messageData.put("isVoiceMessage", false);
        messageData.put("isSessionEnd", true); // Special flag for session end messages

        // Add to Firebase in the specific session
        messagesRef.child(sessionId).child(messageId).setValue(messageData);
    }

    /**
     * Listen for session end messages from the other user (only for this session)
     */
    private void listenForSessionEnd() {
        sessionEndListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                for (DataSnapshot messageSnapshot : dataSnapshot.getChildren()) {
                    String senderId = messageSnapshot.child("senderId").getValue(String.class);
                    Boolean isSessionEnd = messageSnapshot.child("isSessionEnd").getValue(Boolean.class);
                    Long messageTimestamp = messageSnapshot.child("timestamp").getValue(Long.class);

                    // Check if this is a session end message from the other user
                    if (senderId != null && !senderId.equals(FirebaseAuth.getInstance().getCurrentUser().getUid()) &&
                        isSessionEnd != null && isSessionEnd) {

                        // Check if it's from the current session (newer than session start time)
                        // Add a 2-second buffer to account for timing differences
                        if (messageTimestamp != null && messageTimestamp > (sessionStartTime - 2000)) {
                            Log.d("ConnectChatActivity", "Found session end message from current session: sender=" + senderId +
                                  ", timestamp=" + messageTimestamp + ", sessionStart=" + sessionStartTime);

                            // Check if session has already ended to prevent duplicate notifications
                            if (!sessionEnded) {
                                sessionEnded = true;
                                Log.d("ConnectChatActivity", "Processing session end message from current session");

                                // The other user has ended the current session
                                runOnUiThread(() -> {
                                    // Show dialog that other user left the session
                                    com.example.appdev.utils.CustomDialog sessionEndDialog = new com.example.appdev.utils.CustomDialog(ConnectChatActivity.this);
                                    sessionEndDialog.setTitle("Session Ended");
                                    sessionEndDialog.setMessage("The other user has left the session. Click OK to leave the session as well.");
                                    sessionEndDialog.setButtonText("OK");

                                    // Set icon and color for session ended
                                    sessionEndDialog.setIcon(R.drawable.ic_info);
                                    sessionEndDialog.setIconTint(getResources().getColor(R.color.app_blue));

                                    // Set OK button to end the current user's session directly
                                    sessionEndDialog.setButtonClickListener(v -> {
                                        sessionEndDialog.dismiss();
                                        // End session but don't send a message since the session is already ended by the other user
                                        endSessionDirectly(false);
                                    });

                                    sessionEndDialog.show();

                                    // Disable voice input
                                    if (buttonVoiceIcon != null) {
                                        buttonVoiceIcon.setEnabled(false);
                                        buttonVoiceIcon.setAlpha(0.5f);
                                    }
                                    if (buttonChatToggle != null) {
                                        buttonChatToggle.setEnabled(false);
                                        buttonChatToggle.setAlpha(0.5f);
                                    }

                                    // Disable text input
                                    if (textInputMessage != null) {
                                        textInputMessage.setEnabled(false);
                                        textInputMessage.setHint("Session ended");
                                    }
                                    if (buttonSendText != null) {
                                        buttonSendText.setEnabled(false);
                                        buttonSendText.setAlpha(0.5f);
                                    }

                                    // Optionally show a message in the chat
                                    showSessionEndedMessage();
                                });
                            }
                            break; // Only need to handle the first session end message for this session
                        } else {
                            Log.d("ConnectChatActivity", "Ignoring old session end message: sender=" + senderId +
                                  ", timestamp=" + messageTimestamp + ", sessionStart=" + sessionStartTime);
                        }
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
                Log.e("ConnectChatActivity", "Error listening for session end messages", databaseError.toException());
            }
        };

        // Listen only for messages in the current session
        messagesRef.child(sessionId).addValueEventListener(sessionEndListener);
    }

    /**
     * Show a message indicating the session has ended
     */
    private void showSessionEndedMessage() {
        // This message will be shown through the normal message flow via the adapter
        // The session end message sent by the other user will be displayed in the chat
    }

    /**
     * Show language selection dialog for changing the target language
     */
    private void showLanguageSelectionDialog() {
        android.app.Dialog languageDialog = new android.app.Dialog(this);
        languageDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        languageDialog.setContentView(R.layout.language_selection_dialog);

        android.view.Window window = languageDialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            window.setLayout(android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                            android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
            window.setDimAmount(0.8f);
        }

        // Get container for language buttons
        android.widget.LinearLayout container = languageDialog.findViewById(R.id.languageButtonsContainer);

        // Setup language buttons
        java.util.List<String> languages = com.example.appdev.models.Languages.getAllLanguages();
        for (String language : languages) {
            android.view.View languageButton = android.view.LayoutInflater.from(this).inflate(R.layout.language_button, container, false);
            ((android.widget.TextView) languageButton.findViewById(R.id.languageText)).setText(language);
            languageButton.setOnClickListener(v -> {
                // Update the user's language preference (like in ProfileFragment)
                updateUserLanguage(language);
                languageDialog.dismiss();
            });
            container.addView(languageButton);
        }

        languageDialog.show();
    }

    /**
     * Show translator selection dialog for changing the translator
     */
    private void showTranslatorSelectionDialog() {
        android.app.Dialog translatorDialog = new android.app.Dialog(this);
        translatorDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        translatorDialog.setContentView(R.layout.translator_selection_dialog);

        // Get dialog window and set properties
        android.view.Window window = translatorDialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            window.setLayout(android.view.ViewGroup.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
            window.setDimAmount(0.8f);
        }

        // Get container for translator buttons
        android.widget.LinearLayout container = translatorDialog.findViewById(R.id.translatorButtonsContainer);

        // Setup translator buttons manually since ChangeTranslatorControl expects Fragment
        setupTranslatorButtons(container, translatorDialog);

        translatorDialog.show();
    }

    /**
     * Setup translator buttons for the dialog
     */
    private void setupTranslatorButtons(android.widget.LinearLayout container, android.app.Dialog dialog) {
        com.example.appdev.translators.TranslatorType[] translatorTypes = com.example.appdev.translators.TranslatorType.values();

        for (com.example.appdev.translators.TranslatorType type : translatorTypes) {
            com.google.android.material.button.MaterialButton button =
                (com.google.android.material.button.MaterialButton) android.view.LayoutInflater.from(this)
                .inflate(R.layout.translator_button, container, false);

            button.setText(type.getDisplayName());
            button.setIcon(androidx.core.content.ContextCompat.getDrawable(this, type.getIconResourceId()));
            button.setOnClickListener(v -> {
                checkPremiumAndUpdateTranslator(type.getId(), type.getDisplayName(), dialog);
            });

            container.addView(button);
        }
    }

    /**
     * Check if user is premium and update translator
     */
    private void checkPremiumAndUpdateTranslator(String translatorType, String displayName, android.app.Dialog dialog) {
        String userId = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser().getUid();
        com.google.firebase.database.DatabaseReference userRef =
            com.google.firebase.database.FirebaseDatabase.getInstance().getReference("users").child(userId);

        userRef.child("accountType").addListenerForSingleValueEvent(new com.google.firebase.database.ValueEventListener() {
            @Override
            public void onDataChange(@androidx.annotation.NonNull com.google.firebase.database.DataSnapshot snapshot) {
                String accountType = snapshot.getValue(String.class);

                if (accountType != null && accountType.equals("premium")) {
                    // User is premium, allow translator change
                    updateTranslator(translatorType, displayName);
                    dialog.dismiss();
                } else {
                    // User is not premium, show notification
                    com.example.appdev.utils.CustomNotification.showNotification(ConnectChatActivity.this,
                        "Premium subscription required to change translator", false);
                    dialog.dismiss();
                }
            }

            @Override
            public void onCancelled(@androidx.annotation.NonNull com.google.firebase.database.DatabaseError error) {
                com.example.appdev.utils.CustomNotification.showNotification(ConnectChatActivity.this,
                    "Failed to check account status", false);
                dialog.dismiss();
            }
        });
    }

    /**
     * Update the user's translator preference
     */
    private void updateTranslator(String translatorType, String displayName) {
        com.google.firebase.database.DatabaseReference userRef =
            com.google.firebase.database.FirebaseDatabase.getInstance().getReference("users")
            .child(com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser().getUid());

        userRef.child("translator").setValue(translatorType)
                .addOnSuccessListener(aVoid -> {
                    // Update Variables.userTranslator
                    Variables.userTranslator = translatorType;
                    // Update the button icon
                    updateTranslatorButtonIcon();
                    com.example.appdev.utils.CustomNotification.showNotification(ConnectChatActivity.this,
                        "Switched to " + displayName, true);
                })
                .addOnFailureListener(e -> {
                    com.example.appdev.utils.CustomNotification.showNotification(ConnectChatActivity.this,
                        "Failed to change translator", false);
                });
    }

    /**
     * Update the language button to show the first letter of current user language
     */
    private void updateLanguageButtonIcon() {
        if (buttonChangeLanguage != null && Variables.userLanguage != null && !Variables.userLanguage.isEmpty()) {
            String firstLetter = Variables.userLanguage.substring(0, 1).toUpperCase();
            buttonChangeLanguage.setText(firstLetter);
        }
    }

    /**
     * Update the language selection button to show the current user language
     */
    private void updateLanguageSelectionButton() {
        if (buttonLanguageSelection != null && Variables.userLanguage != null && !Variables.userLanguage.isEmpty()) {
            buttonLanguageSelection.setText(Variables.userLanguage);
        }
    }

    /**
     * Update the translator button to show the icon of user's selected translator
     */
    private void updateTranslatorButtonIcon() {
        if (Variables.userTranslator != null) {
            com.example.appdev.translators.TranslatorType translatorType =
                com.example.appdev.translators.TranslatorType.fromId(Variables.userTranslator);

            int iconResource = (translatorType != null) ? translatorType.getIconResourceId() : R.drawable.ic_translate;
            
            // Update old translator button if it exists
            if (buttonChangeTranslator != null) {
                buttonChangeTranslator.setImageResource(iconResource);
            }
            
            // Update new translator button
            if (buttonChangeTranslatorNew != null) {
                buttonChangeTranslatorNew.setImageResource(iconResource);
            }
        }
    }

    /**
     * Update the user's language preference in Firebase
     */
    private void updateUserLanguage(String selectedLanguage) {
        com.google.firebase.auth.FirebaseUser currentUser = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) {
            com.google.firebase.database.DatabaseReference userRef = com.google.firebase.database.FirebaseDatabase.getInstance()
                    .getReference("users")
                    .child(currentUser.getUid());

            userRef.child("language").setValue(selectedLanguage)
                    .addOnSuccessListener(aVoid -> {
                        // Update Variables.userLanguage
                        Variables.userLanguage = selectedLanguage;
                        // Update the button icon and selection button
                        updateLanguageButtonIcon();
                        updateLanguageSelectionButton();
                        // Show confirmation
                        com.example.appdev.utils.CustomNotification.showNotification(ConnectChatActivity.this,
                            "Language updated to " + selectedLanguage, true);
                    })
                    .addOnFailureListener(e -> {
                        com.example.appdev.utils.CustomNotification.showNotification(ConnectChatActivity.this,
                            "Failed to update language", false);
                    });
        }
    }

    /**
     * Gets the RecyclerView for scrolling to messages
     * @return The RecyclerView instance
     */
    public RecyclerView getRecyclerView() {
        return recyclerViewChat;
    }

    @Override
    public void onBackPressed() {
        // Show the end session confirmation dialog instead of finishing directly
        endSession();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (speechHelper != null) {
            speechHelper.destroy();
        }

        // Remove session end listener if it exists
        if (sessionEndListener != null && sessionId != null && messagesRef != null) {
            messagesRef.child(sessionId).removeEventListener(sessionEndListener);
        }

        // Clear the active session ID when the activity is destroyed
        if (sessionId != null) {
            com.example.appdev.utils.ConnectionRequestManager.getInstance().clearActiveSessionId();
        }
    }
}
