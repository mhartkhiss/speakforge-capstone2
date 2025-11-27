package com.example.appdev;

import static android.content.ContentValues.TAG;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import android.util.Log;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import com.example.appdev.fragments.BasicTranslationFragment;
import com.example.appdev.fragments.ProfileFragment;
import com.example.appdev.models.User;
import com.example.appdev.utils.TranslationModeManager;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.example.appdev.utils.ConnectionRequestManager;

public class MainActivity extends AppCompatActivity {

    private BasicTranslationFragment basicTranslationFragment;
    private TextView offlineIndicator;


    private void userDataListener(){
        // Check if this is offline mode
        if (Variables.isOfflineMode) {
            Log.d(TAG, "Offline mode detected, skipping user data listener");
            return;
        }

        // Check if this is a guest user
        if ("guest".equals(Variables.userUID)) {
            // Guest user already has Variables set, just continue with the app
            Log.d(TAG, "Guest user detected, using local variables");
            return;
        }

        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) {
            DatabaseReference userRef = FirebaseDatabase.getInstance().getReference("users").child(currentUser.getUid());
            userRef.addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    if (dataSnapshot.exists()) {
                        User user = dataSnapshot.getValue(User.class);
                        if (user != null) {
                            Variables.userUID = user.getUserId();
                            Variables.userEmail = user.getEmail();
                            Variables.userDisplayName = user.getUsername();
                            Variables.userAccountType = user.getAccountType();
                            Variables.userLanguage = user.getLanguage();
                            Variables.userTranslator = user.getTranslator();
                            
                            // If language is not set, redirect to LanguageSetupActivity
                            if (user.getLanguage() == null) {
                                Log.e(TAG, "User language not set");
                                Intent intent = new Intent(MainActivity.this, LanguageSetupActivity.class);
                                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                                startActivity(intent);
                                finish();
                            }
                        }
                    } else {
                        // If user data doesn't exist, redirect to LanguageSetupActivity
                        Log.e(TAG, "User data doesn't exist in database");
                        Intent intent = new Intent(MainActivity.this, LanguageSetupActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                    Log.e(TAG, "Error getting user: " + databaseError.getMessage());
                }
            });
        } else {
            // If user is null, redirect to WelcomeScreen
            Log.e(TAG, "Current user is null");
            Intent intent = new Intent(MainActivity.this, WelcomeScreen.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        }
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        offlineIndicator = findViewById(R.id.offlineIndicator);

        // Restore offline mode from SharedPreferences
        SharedPreferences prefs = getSharedPreferences(Variables.PREFS_NAME, MODE_PRIVATE);
        Variables.isOfflineMode = prefs.getBoolean(Variables.PREF_IS_OFFLINE_MODE, false);
        
        // If offline mode is active, restore guest variables
        if (Variables.isOfflineMode) {
            Variables.userUID = "guest";
            Variables.userEmail = "offline@speakforge.app";
            Variables.userAccountType = "guest";
            Variables.userLanguage = "English";
            Variables.userTranslator = "claude";
        }

        // Initialize translation mode from SharedPreferences
        TranslationModeManager.initializeFromPreferences(this);

        // Remove the flag check that was causing the crash
        // Instead, just prevent going back
        if (isTaskRoot() && getIntent().hasCategory(Intent.CATEGORY_LAUNCHER)) {
            // App was started from launcher, clear any existing tasks
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            return;
        }

        // Check if user data is available
        userDataListener();

        // Show BasicTranslationFragment directly (no tabs)
        basicTranslationFragment = new BasicTranslationFragment();
        getSupportFragmentManager().beginTransaction()
            .replace(R.id.mainContentFrame, basicTranslationFragment)
            .commit();

        FirebaseAuth mAuth = FirebaseAuth.getInstance();

        // Check if this is offline mode
        if (Variables.isOfflineMode) {
            // Offline mode, just continue without connection listeners
            Log.d(TAG, "Offline mode active");
        }
        // Check if this is a guest user
        else if ("guest".equals(Variables.userUID)) {
            // Guest user, just continue
            Log.d(TAG, "Guest user detected");
        } else if (mAuth.getCurrentUser() == null) {
            // User is not logged in, redirect to WelcomeScreen
            startActivity(new Intent(this, WelcomeScreen.class));
            finish();
        } else {
            // Reset tracking state for fresh app session and start listening for connection requests
            ConnectionRequestManager.getInstance().resetTrackingState();
            ConnectionRequestManager.getInstance().startListeningForRequests(this);
        }

        // Set up offline indicator initially
        checkConnectivity();
    }

    public void openProfileFragment() {
        if (Variables.isOfflineMode) {
            com.example.appdev.utils.CustomNotification.showNotification(this, "Feature not available in Offline Mode", false);
            return;
        }
        ProfileFragment profileFragment = new ProfileFragment();
        getSupportFragmentManager().beginTransaction()
            .replace(R.id.mainContentFrame, profileFragment)
            .addToBackStack(null)
            .commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
        checkConnectivity();
    }

    private void checkConnectivity() {
        boolean isConnected = isNetworkAvailable();

        // If explicit offline mode is set, always show indicator
        if (Variables.isOfflineMode) {
            if (offlineIndicator != null) {
                offlineIndicator.setVisibility(android.view.View.VISIBLE);
                offlineIndicator.setText("Offline Mode - Basic Features Only");
                // Make offline indicator clickable
                offlineIndicator.setClickable(true);
                offlineIndicator.setFocusable(true);
                offlineIndicator.setOnClickListener(v -> showGoOnlineDialog());
            }
            return;
        }

        // Otherwise check actual connection
        if (offlineIndicator != null) {
            if (!isConnected) {
                offlineIndicator.setVisibility(android.view.View.VISIBLE);
                offlineIndicator.setText("No Internet Connection");
                // Remove click listener for no internet connection (not offline mode)
                offlineIndicator.setOnClickListener(null);
            } else {
                offlineIndicator.setVisibility(android.view.View.GONE);
            }
        }
    }

    private void showGoOnlineDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Go Online Mode");
        builder.setMessage("Do you want to exit offline mode and go online? You will need to log in to access online features.");
        builder.setPositiveButton("Yes, Go Online", (dialog, which) -> {
            // Clear offline mode preferences
            SharedPreferences prefs = getSharedPreferences(Variables.PREFS_NAME, MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean(Variables.PREF_IS_OFFLINE_MODE, false);
            editor.putBoolean(Variables.PREF_IS_GUEST_USER, false);
            editor.apply();
            
            // Clear offline mode variables
            Variables.isOfflineMode = false;
            Variables.userUID = "";
            Variables.userEmail = "";
            Variables.userAccountType = "";
            
            // Restart the app to go to WelcomeScreen
            Intent intent = new Intent(this, WelcomeScreen.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });
        builder.setNegativeButton("Cancel", (dialog, which) -> {
            dialog.dismiss();
        });
        builder.show();
    }

    private boolean isNetworkAvailable() {
        android.net.ConnectivityManager connectivityManager
                = (android.net.ConnectivityManager) getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
        android.net.NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }

    @Override
    public void onBackPressed() {
        // Prevent going back
        moveTaskToBack(true);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Stop listening for connection requests to prevent memory leaks
        ConnectionRequestManager.getInstance().stopListeningForRequests();
    }

}
