package com.example.appdev.subcontrollers;

import android.content.Context;
import android.os.AsyncTask;
import android.text.TextUtils;
import android.util.Log;

import com.example.appdev.Variables;
// Remove unused translator imports if regeneration always goes through the server
// import com.example.appdev.translators.Translation_OpenAI;
// import com.example.appdev.translators.Translation_DeepSeekV3;
// import com.example.appdev.translators.Translation_GPT4;
// import com.example.appdev.translators.Translation_Gemini;
// import com.example.appdev.translators.Translation_Claude;
import com.example.appdev.utils.CustomDialog;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
// Remove unused factory imports if regeneration always goes through the server
// import com.example.appdev.translators.TranslatorFactory;
// import com.example.appdev.translators.TranslatorType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import org.json.JSONObject;

public class RegenerateMessageTranslation {
    private static final String TAG = "RegenerateTranslation";
    private FirebaseDatabase database = FirebaseDatabase.getInstance();
    private DatabaseReference messagesRef;
    // Remove old listener
    // private OnTranslationRegeneratedListener listener;
    private Context context;
    private RegenerationCallback callback; // Add callback member

    // Remove old listener interface
    // public interface OnTranslationRegeneratedListener {
    //     void onTranslationRegenerated(String newTranslation);
    // }

    // Define the new callback interface
    public interface RegenerationCallback {
        void onComplete(boolean success);
    }

    // Update constructor to accept the callback
    public RegenerateMessageTranslation(Context context, RegenerationCallback callback) {
        this.context = context;
        this.callback = callback;
    }

    // Remove old listener setter
    // public void setOnTranslationRegeneratedListener(OnTranslationRegeneratedListener listener) {
    //     this.listener = listener;
    // }

    public void regenerate(String message, String messageId, String targetLanguage) {
        // Always set to variation mode for regeneration
        Variables.openAiPrompt = 2;

        // Determine the correct Firebase reference and room ID
        String roomId;
        if (!TextUtils.isEmpty(Variables.connectSessionId)) {
            // This is a connect chat
            roomId = Variables.connectSessionId;
            messagesRef = database.getReference("connect_chats");
        } else if (!TextUtils.isEmpty(Variables.roomId)) {
            // This is a regular chat
            roomId = Variables.roomId;
            messagesRef = database.getReference("messages");
        } else {
            Log.e(TAG, "No valid room ID found for regeneration");
            if (callback != null) {
                callback.onComplete(false);
            }
            return;
        }

        // First check if all 3 translation variations already exist for cycling
        messagesRef.child(roomId).child(messageId).child("translations")
            .get().addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null && task.getResult().exists()) {
                    Map<String, Object> translations = (Map<String, Object>) task.getResult().getValue();
                    
                    String translation1 = translations != null ? (String) translations.get("translation1") : null;
                    String translation2 = translations != null ? (String) translations.get("translation2") : null;
                    String translation3 = translations != null ? (String) translations.get("translation3") : null;

                    Log.d(TAG, "Checking variations: T1=" + (translation1 != null ? "exists" : "null") + 
                              ", T2=" + (translation2 != null ? "exists" : "null") + 
                              ", T3=" + (translation3 != null ? "exists" : "null"));

                    boolean hasAllVariations = translation1 != null && !translation1.isEmpty() &&
                                             translation2 != null && !translation2.isEmpty() &&
                                             translation3 != null && !translation3.isEmpty();

                    if (hasAllVariations) {
                        // Perform rotational swap of translation values (same as ChatAdapter)
                        Log.d(TAG, "Found all 3 variations, cycling them instead of API call");
                        
                        Map<String, Object> updatesMap = new HashMap<>();
                        updatesMap.put("translation1", translation2); // T1 gets old T2
                        updatesMap.put("translation2", translation3); // T2 gets old T3
                        updatesMap.put("translation3", translation1); // T3 gets old T1

                        messagesRef.child(roomId).child(messageId).child("translations")
                            .updateChildren(updatesMap)
                            .addOnCompleteListener(updateTask -> {
                                if (callback != null) {
                                    callback.onComplete(updateTask.isSuccessful());
                                }
                                if (!updateTask.isSuccessful()) {
                                    Log.e(TAG, "Failed to rotate translation variations.", updateTask.getException());
                                } else {
                                    Log.d(TAG, "Successfully cycled variations");
                                }
                            });
                        return; // Exit early, no need for API call
                    } else {
                        Log.d(TAG, "Not all variations exist, proceeding with API call");
                    }
                }
                
                // If we reach here, we don't have all 3 variations, so proceed with API call
                proceedWithApiGeneration(message, messageId, targetLanguage, roomId);
            });
    }

    private void proceedWithApiGeneration(String message, String messageId, String targetLanguage, String roomId) {
        // Get the sender language for this message
        messagesRef.child(roomId).child(messageId).child("senderLanguage")
            .get().addOnCompleteListener(task -> {
                String senderLanguage;
                if (task.isSuccessful() && task.getResult() != null && task.getResult().getValue() != null) {
                    senderLanguage = task.getResult().getValue(String.class);
                } else {
                    // Fallback to current user language if senderLanguage not found
                    senderLanguage = Variables.userLanguage;
                    Log.w(TAG, "Sender language not found for message " + messageId + ", falling back to user language.");
                }

                // Use the server endpoint for regeneration instead of client-side translators
                try {
                    // Prepare the request body
                    JSONObject requestBody = new JSONObject();
                    requestBody.put("text", message);
                    requestBody.put("source_language", senderLanguage);
                    requestBody.put("target_language", targetLanguage);
                    requestBody.put("variants", "multiple"); // Always get multiple variants
                    requestBody.put("model", Variables.userTranslator.toLowerCase());
                    requestBody.put("translation_mode", Variables.isFormalTranslationMode ? "formal" : "casual");
                    requestBody.put("room_id", roomId);
                    requestBody.put("message_id", messageId);
                    requestBody.put("is_group", false); // This is for direct messages

                    String apiUrl = Variables.API_REGENERATE_TRANSLATION_URL;
                    
                    // Make API request in background
                    new AsyncTask<Void, Void, Boolean>() {
                        @Override
                        protected Boolean doInBackground(Void... voids) {
                            HttpURLConnection conn = null;
                            try {
                                URL url = new URL(apiUrl);
                                conn = (HttpURLConnection) url.openConnection();
                                conn.setRequestMethod("POST");
                                conn.setRequestProperty("Content-Type", "application/json; utf-8"); // Specify charset
                                conn.setRequestProperty("Accept", "application/json");
                                conn.setDoOutput(true);
                                conn.setConnectTimeout(15000); // 15 seconds
                                conn.setReadTimeout(15000); // 15 seconds

                                // Send request body
                                try (OutputStream os = conn.getOutputStream()) {
                                    byte[] input = requestBody.toString().getBytes("utf-8");
                                    os.write(input, 0, input.length);
                                }

                                // Check if request was successful
                                int responseCode = conn.getResponseCode();
                                Log.d(TAG, "API Response Code: " + responseCode);
                                // Consider 2xx responses as success
                                return responseCode >= 200 && responseCode < 300; 
                            } catch (Exception e) {
                                Log.e(TAG, "Error making API request: " + e.getMessage(), e);
                                return false;
                            } finally {
                                if (conn != null) {
                                    conn.disconnect();
                                }
                            }
                        }

                        @Override
                        protected void onPostExecute(Boolean success) {
                             // Call the callback with the success status
                            if (callback != null) {
                                callback.onComplete(success);
                            } else {
                                Log.w(TAG, "Callback is null in onPostExecute");
                            }
                            // Remove the old listener logic and Firebase fetch
                            /*
                            if (success) {
                                // On success, get the updated translation to display
                                messagesRef.child(Variables.roomId).child(messageId)
                                    .child("translations").child("translation1")
                                    .get().addOnCompleteListener(task -> {
                                        if (task.isSuccessful() && task.getResult() != null && 
                                            task.getResult().getValue() != null) {
                                            String newTranslation = task.getResult().getValue(String.class);
                                            if (listener != null) {
                                                listener.onTranslationRegenerated(newTranslation);
                                            }
                                        } else {
                                            // If we can't get the new translation, inform the user
                                            if (listener != null) {
                                                listener.onTranslationRegenerated("Translation regeneration failed");
                                            }
                                        }
                                    });
                            } else {
                                if (listener != null) {
                                    listener.onTranslationRegenerated("Translation regeneration failed");
                                }
                            }
                            */
                        }
                    }.execute();
                    
                } catch (Exception e) {
                    Log.e(TAG, "Error preparing regeneration request: " + e.getMessage(), e);
                     // Call callback with failure if preparation fails
                    if (callback != null) {
                         callback.onComplete(false);
                    }
                     /*
                    if (listener != null) {
                        listener.onTranslationRegenerated("Failed to regenerate translation");
                    }
                    */
                }
            }).addOnFailureListener(e -> {
                 Log.e(TAG, "Failed to get sender language: " + e.getMessage(), e);
                 // Call callback with failure if getting sender language fails
                 if (callback != null) {
                    callback.onComplete(false);
                 }
            });
    }

    // Keep storeTranslationVariations and storeTranslatedText if they are used elsewhere,
    // otherwise they could potentially be removed if regeneration always goes via server API.
    // For now, assume they might be needed. Add safety checks for the listener.

    private void storeTranslationVariations(String[] variations, String messageId) {
        // Clean up variations and handle the format
        List<String> cleanVariations = new ArrayList<>();
        
        // First, handle case where variations are combined in one string
        if (variations.length == 1) {
            String[] splitVariations = variations[0]
                .split("(?=\\d+\\.)"); // Split on number followed by dot
            
            for (String variation : splitVariations) {
                String cleanVar = cleanVariation(variation);
                if (!cleanVar.isEmpty()) {
                    cleanVariations.add(cleanVar);
                }
            }
        } else {
            // Handle normal case where variations are already split
            for (String variation : variations) {
                if (variation == null || variation.trim().isEmpty()) continue; // Add null check
                String cleanVar = cleanVariation(variation);
                if (!cleanVar.isEmpty()) {
                    cleanVariations.add(cleanVar);
                }
            }
        }

        // Ensure we have at least one variation
        if (cleanVariations.isEmpty()) {
            Log.w(TAG, "No clean variations found to store for messageId: " + messageId);
            // Decide if callback should be notified of failure here?
            // If this method is only called internally by a successful client-side translation (which isn't happening now)
            // then maybe no callback needed. If it could be called after server-side, maybe need callback.
            // For now, let's assume it's not called in the server-side flow.
            return;
        }

        // Create a map for the translations
        Map<String, Object> translationsMap = new HashMap<>();
        
        // Store variations in Firebase
        translationsMap.put("translation1", cleanVariations.get(0));
        if (cleanVariations.size() >= 2) {
            translationsMap.put("translation2", cleanVariations.get(1));
        }
         if (cleanVariations.size() >= 3) {
             translationsMap.put("translation3", cleanVariations.get(2));
         }
            
        // Update the translations node in Firebase
        String roomId = !TextUtils.isEmpty(Variables.connectSessionId) ? Variables.connectSessionId : Variables.roomId;
        messagesRef.child(roomId).child(messageId).child("translations")
            .updateChildren(translationsMap).addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                     Log.d(TAG, "Stored translation variations for messageId: " + messageId);
                     // Potentially call callback here if this path is used?
                     // if (callback != null) callback.onComplete(true);
                } else {
                     Log.e(TAG, "Failed to store translation variations for messageId: " + messageId, task.getException());
                     // if (callback != null) callback.onComplete(false);
                }
            });

        // Remove listener calls
        /*
        if (listener != null) {
            listener.onTranslationRegenerated(cleanVariations.get(0));
        }
        */
    }

    private void storeTranslatedText(String translatedText, String messageId) {
        String cleanText = cleanVariation(translatedText);
        
        // Store as translation1 in the translations map
        Map<String, Object> translationsMap = new HashMap<>();
        translationsMap.put("translation1", cleanText);
        
        String roomId = !TextUtils.isEmpty(Variables.connectSessionId) ? Variables.connectSessionId : Variables.roomId;
        messagesRef.child(roomId).child(messageId).child("translations")
            .updateChildren(translationsMap).addOnCompleteListener(task -> {
                 if (task.isSuccessful()) {
                     Log.d(TAG, "Stored single translation for messageId: " + messageId);
                     // Potentially call callback here if this path is used?
                     // if (callback != null) callback.onComplete(true);
                 } else {
                      Log.e(TAG, "Failed to store single translation for messageId: " + messageId, task.getException());
                      // if (callback != null) callback.onComplete(false);
                 }
            });
        
        // Remove listener call
        /*
        if (listener != null) {
            listener.onTranslationRegenerated(cleanText);
        }
        */
    }

    private String cleanVariation(String text) {
         if (text == null) return ""; // Add null check
        return text
            .replaceAll("^\\s*\\d+\\.\\s*", "") // Remove numbered prefixes
            .replaceAll("\\\\\\s*n", "") // Remove "\n" or "\ n"
            .replaceAll("^\"|\"$", "") // Remove surrounding quotes
            .trim();
    }
}
