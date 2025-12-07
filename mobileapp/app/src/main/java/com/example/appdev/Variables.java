package com.example.appdev;

import java.util.ArrayList;
import java.util.List;

public class Variables {
    // Server Constant variables - these will be updated from Firebase
    public static String API_BASE_URL = "https://k9pvbcf5-8000.asse.devtunnels.ms/api/";
    public static String API_TRANSLATE_DB_URL = API_BASE_URL + "translate-db/";
    public static String API_TRANSLATE_DB_CONTEXT_URL = API_BASE_URL + "translate-db-context/";
    public static String API_TRANSLATE_GROUP_URL = API_BASE_URL + "translate-group/";
    public static String API_TRANSLATE_GROUP_CONTEXT_URL = API_BASE_URL + "translate-group-context/";
    public static String API_TRANSLATE_VOICE_URL = API_BASE_URL + "translate-voice/";
    public static String API_REGENERATE_TRANSLATION_URL = API_BASE_URL + "regenerate-translation/";
    public static String API_TRANSLATE_SIMPLE_URL = API_BASE_URL + "translate-simple/";

    // SharedPreferences constants
    public static final String PREFS_NAME = "SpeakForgePrefs";
    public static final String PREF_IS_GUEST_USER = "isGuestUser";
    public static final String PREF_IS_OFFLINE_MODE = "isOfflineMode";
    public static final String PREF_FORMAL_TRANSLATION_MODE = "formalTranslationMode";
    public static final String PREF_CONTEXT_AWARE_TRANSLATION = "contextAwareTranslation";
    public static final String PREF_CONTEXT_DEPTH = "contextDepth";

    // Public variables
    public static String userUID = "";
    public static String userEmail = "";
    public static String userDisplayName = "";
    public static String userAccountType = "";
    public static String userLanguage = "";
    public static String userTranslator = "";
    public static String roomId = "";
    public static String connectSessionId = "";
    public static int openAiPrompt = 1;
    public static boolean isFormalTranslationMode = false;
    public static boolean isContextAwareTranslation = true; // Default to enabled
    public static boolean isDevelopmentMode = false;
    public static int contextDepth = 5; // Default context depth

    // Offline Mode Flag
    public static boolean isOfflineMode = false;

    // APK Download URL - this will be updated from Firebase
    public static String APK_DOWNLOAD_URL = "https://drive.google.com/file/d/1DH0Zmn5EIG5GUmrsdrhY-8ub2JQlIVSY/view?usp=drive_link";

    // Flag to track if settings have been loaded from Firebase
    public static boolean settingsLoaded = false;
}