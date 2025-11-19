package com.example.appdev.utils;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import com.example.appdev.Variables;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Service class for handling translation API requests to the backend server.
 * This replaces the direct translation functionality with server-side translation.
 */
public class TranslationApiService {
    
    private static final String TAG = "TranslationApiService";
    
    /**
     * Interface for handling translation results
     */
    public interface TranslationCallback {
        void onSuccess(String translatedText);
        void onError(String errorMessage);
    }
    
    /**
     * Translate text using the backend API
     */
    public static void translateText(
            String text,
            String sourceLanguage,
            String targetLanguage,
            String translationMode,
            String model,
            String userId,
            TranslationCallback callback) {
        
        new TranslationTask(callback).execute(
            text, sourceLanguage, targetLanguage, translationMode, model, userId
        );
    }
    
    /**
     * AsyncTask to handle the API request in background thread
     */
    private static class TranslationTask extends AsyncTask<String, Void, String> {
        
        private final TranslationCallback callback;
        private String errorMessage = null;
        
        public TranslationTask(TranslationCallback callback) {
            this.callback = callback;
        }
        
        @Override
        protected String doInBackground(String... params) {
            String text = params[0];
            String sourceLanguage = params[1];
            String targetLanguage = params[2];
            String translationMode = params[3];
            String model = params[4];
            String userId = params[5];
            
            try {
                // Create the request JSON
                JSONObject requestBody = new JSONObject();
                requestBody.put("text", text);
                requestBody.put("source_language", sourceLanguage);
                requestBody.put("target_language", targetLanguage);
                requestBody.put("variants", "single");
                requestBody.put("translation_mode", translationMode);
                requestBody.put("model", model);
                requestBody.put("user_id", userId);
                
                // Make the HTTP request
                URL url = new URL(Variables.API_TRANSLATE_SIMPLE_URL);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                
                // Set request properties
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Accept", "application/json");
                connection.setDoOutput(true);
                connection.setConnectTimeout(30000); // 30 seconds
                connection.setReadTimeout(30000); // 30 seconds
                
                // Send the request body
                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }
                
                // Get the response
                int responseCode = connection.getResponseCode();
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    // Read successful response
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                        
                        StringBuilder response = new StringBuilder();
                        String responseLine;
                        while ((responseLine = br.readLine()) != null) {
                            response.append(responseLine.trim());
                        }
                        
                        // Parse the response JSON
                        String responseString = response.toString();
                        Log.d(TAG, "Backend response: " + responseString);
                        JSONObject responseJson = new JSONObject(responseString);
                        
                        if (responseJson.has("translations")) {
                            JSONObject translations = responseJson.getJSONObject("translations");
                            Log.d(TAG, "Translation keys: " + translations.keys().toString());
                            
                            // Try to get the main translation first
                            if (translations.has("main_translation")) {
                                String result = translations.getString("main_translation");
                                Log.d(TAG, "Found main_translation: " + result);
                                return result;
                            } else if (translations.has("var1")) {
                                String result = translations.getString("var1");
                                Log.d(TAG, "Found var1: " + result);
                                return result;
                            } else if (translations.has("single")) {
                                String result = translations.getString("single");
                                Log.d(TAG, "Found single: " + result);
                                return result;
                            } else if (translations.has("translation")) {
                                String result = translations.getString("translation");
                                Log.d(TAG, "Found translation: " + result);
                                return result;
                            }
                        }
                        
                        // Fallback: return the original text if no translation found
                        errorMessage = "No translation found in response";
                        return null;
                    }
                } else {
                    // Read error response
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                        
                        StringBuilder errorResponse = new StringBuilder();
                        String responseLine;
                        while ((responseLine = br.readLine()) != null) {
                            errorResponse.append(responseLine.trim());
                        }
                        
                        try {
                            JSONObject errorJson = new JSONObject(errorResponse.toString());
                            errorMessage = errorJson.optString("error", "Translation failed");
                        } catch (JSONException e) {
                            errorMessage = "HTTP " + responseCode + ": " + errorResponse.toString();
                        }
                    }
                }
                
            } catch (IOException e) {
                Log.e(TAG, "Network error during translation", e);
                errorMessage = "Network error: " + e.getMessage();
            } catch (JSONException e) {
                Log.e(TAG, "JSON parsing error", e);
                errorMessage = "Response parsing error: " + e.getMessage();
            } catch (Exception e) {
                Log.e(TAG, "Unexpected error during translation", e);
                errorMessage = "Translation error: " + e.getMessage();
            }
            
            return null;
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result != null) {
                callback.onSuccess(result);
            } else {
                callback.onError(errorMessage != null ? errorMessage : "Unknown translation error");
            }
        }
    }
}
