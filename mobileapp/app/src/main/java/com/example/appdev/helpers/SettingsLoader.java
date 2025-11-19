package com.example.appdev.helpers;

import android.util.Log;
import com.example.appdev.Variables;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class SettingsLoader {

    private static final String TAG = "SettingsLoader";

    public interface SettingsCallback {
        void onSettingsLoaded();
        void onSettingsError(String error);
    }

    /**
     * Load settings from Firebase and update Variables class
     * This should be called during app initialization
     */
    public static void loadSettings(SettingsCallback callback) {
        DatabaseReference settingsRef = FirebaseDatabase.getInstance().getReference("settings");

        settingsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                try {
                    if (dataSnapshot.exists()) {
                        // Load backend URL
                        String backendUrl = dataSnapshot.child("backendUrl").getValue(String.class);
                        if (backendUrl != null && !backendUrl.isEmpty()) {
                            // Update Variables with Firebase value
                            updateBackendUrl(backendUrl);
                            Log.d(TAG, "Loaded backend URL from Firebase: " + backendUrl);
                        } else {
                            Log.w(TAG, "Backend URL not found in Firebase, using default");
                        }

                        // Load APK download URL
                        String apkDownloadUrl = dataSnapshot.child("apkDownloadUrl").getValue(String.class);
                        if (apkDownloadUrl != null && !apkDownloadUrl.isEmpty()) {
                            // Update Variables with Firebase value
                            updateApkDownloadUrl(apkDownloadUrl);
                            Log.d(TAG, "Loaded APK download URL from Firebase: " + apkDownloadUrl);
                        } else {
                            Log.w(TAG, "APK download URL not found in Firebase, using default");
                        }
                    } else {
                        Log.w(TAG, "Settings not found in Firebase, using default values");
                    }

                    if (callback != null) {
                        callback.onSettingsLoaded();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error loading settings: " + e.getMessage(), e);
                    if (callback != null) {
                        callback.onSettingsError("Error loading settings: " + e.getMessage());
                    }
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                Log.e(TAG, "Database error loading settings: " + databaseError.getMessage());
                if (callback != null) {
                    callback.onSettingsError("Database error: " + databaseError.getMessage());
                }
            }
        });
    }

    /**
     * Update backend URL in Variables class
     */
    private static void updateBackendUrl(String backendUrl) {
        // We need to reconstruct all the API URLs based on the new base URL
        Variables.API_BASE_URL = backendUrl;
        Variables.API_TRANSLATE_DB_URL = backendUrl + "translate-db/";
        Variables.API_TRANSLATE_DB_CONTEXT_URL = backendUrl + "translate-db-context/";
        Variables.API_TRANSLATE_GROUP_URL = backendUrl + "translate-group/";
        Variables.API_TRANSLATE_GROUP_CONTEXT_URL = backendUrl + "translate-group-context/";
        Variables.API_TRANSLATE_VOICE_URL = backendUrl + "translate-voice/";
        Variables.API_REGENERATE_TRANSLATION_URL = backendUrl + "regenerate-translation/";
        Variables.API_TRANSLATE_SIMPLE_URL = backendUrl + "translate-simple/";
    }

    /**
     * Update APK download URL in Variables class
     */
    private static void updateApkDownloadUrl(String apkDownloadUrl) {
        Variables.APK_DOWNLOAD_URL = apkDownloadUrl;
    }
}
