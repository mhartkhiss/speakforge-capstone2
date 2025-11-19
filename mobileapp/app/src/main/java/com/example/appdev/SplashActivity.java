package com.example.appdev;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityOptionsCompat;
import androidx.core.util.Pair;

import android.animation.ValueAnimator;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.transition.TransitionInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.animation.DecelerateInterpolator;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import com.example.appdev.helpers.SettingsLoader;

public class SplashActivity extends AppCompatActivity {

    private static final int SPLASH_DURATION = 2800; // 2.8 seconds
    private static final int MINIMUM_LOADING_TIME = 2000; // 2 seconds minimum for settings loading
    private static final int CONNECTION_TIMEOUT = 10000; // 10 seconds timeout
    private ImageView splashLogo;
    private TypeWriter splashCatchphrase;
    private final String catchphraseText = "Forging connections with AI-Powered Translation";
    private final int FINAL_LOGO_SIZE_DP = 280; // Target size matching welcome screen

    // Settings loading UI elements
    private LinearLayout settingsLoadingContainer;
    private TextView settingsLoadingText;
    private ProgressBar settingsProgressBar;
    private TextView settingsStatusText;
    private com.google.android.material.button.MaterialButton btnOfflineMode;

    // Settings loading state
    private boolean settingsLoaded = false;
    private boolean minimumTimeElapsed = false;
    private long settingsLoadingStartTime;

    // Static instance for reference
    private static SplashActivity instance;
    
    // Static getter for the instance
    public static SplashActivity getInstance() {
        return instance;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set the static instance
        instance = this;
        
        // Enable content transitions
        getWindow().requestFeature(Window.FEATURE_CONTENT_TRANSITIONS);
        getWindow().setExitTransition(null); // Disable exit transition to prevent slide down
        
        setContentView(R.layout.activity_splash_screen);

        // Initialize views
        splashLogo = findViewById(R.id.splashLogo);
        splashCatchphrase = findViewById(R.id.splashCatchphrase);

        // Initialize settings loading UI elements
        settingsLoadingContainer = findViewById(R.id.settingsLoadingContainer);
        settingsLoadingText = findViewById(R.id.settingsLoadingText);
        settingsProgressBar = findViewById(R.id.settingsProgressBar);
        settingsStatusText = findViewById(R.id.settingsStatusText);
        btnOfflineMode = findViewById(R.id.btnOfflineMode);

        btnOfflineMode.setOnClickListener(v -> goOfflineMode());

        // Start animations sequence
        startAnimations();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Clear the static instance when destroyed
        if (instance == this) {
            instance = null;
        }
    }

    private void startAnimations() {
        // Logo fade in animation
        Animation fadeIn = AnimationUtils.loadAnimation(this, R.anim.splash_fade_in);
        splashLogo.startAnimation(fadeIn);

        // Start typing animation after logo appears
        new Handler().postDelayed(() -> {
            // Start typing animation
            splashCatchphrase.setCharacterDelay(40); // 40ms between characters
            splashCatchphrase.animateText(catchphraseText);
        }, 600);

        // Start logo size reduction animation near the end
        new Handler().postDelayed(this::animateLogoSizeReduction, SPLASH_DURATION - 800);

        // Show settings loading after initial animations
        new Handler().postDelayed(this::showSettingsLoading, SPLASH_DURATION);
    }

    private void showSettingsLoading() {
        // Show settings loading UI
        settingsLoadingContainer.setVisibility(View.VISIBLE);
        settingsLoadingText.setText("Loading app settings...");
        settingsStatusText.setText("Connecting to server...");

        // Record start time for minimum loading duration
        settingsLoadingStartTime = System.currentTimeMillis();

        // Timeout handler for slow connections
        new Handler().postDelayed(() -> {
            if (!settingsLoaded) {
                runOnUiThread(() -> {
                    settingsStatusText.setText("Connection taking too long...");
                    btnOfflineMode.setVisibility(View.VISIBLE);
                });
            }
        }, CONNECTION_TIMEOUT);

        // Load settings from Firebase
        SettingsLoader.loadSettings(new SettingsLoader.SettingsCallback() {
            @Override
            public void onSettingsLoaded() {
                runOnUiThread(() -> {
                    settingsStatusText.setText("Settings loaded successfully ✓");
                    settingsLoaded = true;
                    checkIfReadyToProceed();
                });
            }

            @Override
            public void onSettingsError(String error) {
                runOnUiThread(() -> {
                    settingsStatusText.setText("Using default settings");
                    android.util.Log.w("SplashActivity", "Failed to load settings from Firebase: " + error);
                    settingsLoaded = true; // Still proceed with defaults
                    checkIfReadyToProceed();
                });
            }
        });

        // Ensure minimum loading time
        new Handler().postDelayed(() -> {
            minimumTimeElapsed = true;
            checkIfReadyToProceed();
        }, MINIMUM_LOADING_TIME);
    }

    private void goOfflineMode() {
        Variables.isOfflineMode = true;
        
        // Set guest/offline variables
        Variables.userUID = "guest";
        Variables.userEmail = "offline@speakforge.app";
        Variables.userAccountType = "guest";
        Variables.userLanguage = "English";
        Variables.userTranslator = "gemini";
        
        // Set preferences for offline mode to ensure smooth flow if they restart
        SharedPreferences prefs = getSharedPreferences(Variables.PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(Variables.PREF_IS_OFFLINE_MODE, true);
        editor.putBoolean(Variables.PREF_IS_GUEST_USER, true);
        editor.apply();
        
        Intent intent = new Intent(SplashActivity.this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void checkIfReadyToProceed() {
        if (settingsLoaded && minimumTimeElapsed) {
            // Hide loading UI and proceed
            settingsLoadingContainer.setVisibility(View.GONE);
            startWelcomeScreenWithTransition();
        }
    }
    
    private void animateLogoSizeReduction() {
        // Convert dp to pixels for animation
        final float density = getResources().getDisplayMetrics().density;
        final int startSize = Math.round(350 * density);
        final int endSize = Math.round(FINAL_LOGO_SIZE_DP * density);
        
        // Create value animator for width and height
        ValueAnimator sizeAnimator = ValueAnimator.ofInt(startSize, endSize);
        sizeAnimator.setDuration(700); // Duration of size animation
        sizeAnimator.setInterpolator(new DecelerateInterpolator());
        
        sizeAnimator.addUpdateListener(animation -> {
            int animatedValue = (int) animation.getAnimatedValue();
            ViewGroup.LayoutParams layoutParams = splashLogo.getLayoutParams();
            layoutParams.width = animatedValue;
            layoutParams.height = animatedValue;
            splashLogo.setLayoutParams(layoutParams);
        });
        
        sizeAnimator.start();
    }

    private void startWelcomeScreenWithTransition() {
        // Check if user is already in offline mode or guest mode
        SharedPreferences prefs = getSharedPreferences(Variables.PREFS_NAME, MODE_PRIVATE);
        boolean isOfflineMode = prefs.getBoolean(Variables.PREF_IS_OFFLINE_MODE, false);
        boolean isGuestUser = prefs.getBoolean(Variables.PREF_IS_GUEST_USER, false);
        
        Intent intent;
        
        if (isOfflineMode || isGuestUser) {
            // If offline mode or guest user, restore variables and go directly to MainActivity
            Variables.isOfflineMode = isOfflineMode;
            Variables.userUID = "guest";
            Variables.userEmail = isOfflineMode ? "offline@speakforge.app" : "guest@speakforge.app";
            Variables.userAccountType = "guest";
            Variables.userLanguage = "English";
            Variables.userTranslator = "gemini";
            
            intent = new Intent(SplashActivity.this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish(); // Finish the splash activity
        } else {
            // Regular flow - go to WelcomeScreen with transition
            intent = new Intent(SplashActivity.this, WelcomeScreen.class);
            
            // Create the transition animation
            Pair<View, String> logoPair = Pair.create((View)splashLogo, "logoTransition");
            
            ActivityOptionsCompat options = ActivityOptionsCompat.makeSceneTransitionAnimation(
                    this, logoPair);
            
            // Start the activity with the transition
            startActivity(intent, options.toBundle());
            
            // Don't call finish() immediately to allow the shared element transition to complete
            // Instead, let the WelcomeScreen handle finishing this activity
            // This prevents the slide down animation
        }
    }

    @Override
    public void onBackPressed() {
        // Disable back button during splash screen
    }
}