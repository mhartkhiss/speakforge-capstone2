package com.example.appdev;

import static android.content.ContentValues.TAG;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.example.appdev.models.Languages;
import java.util.List;

public class LanguageSetupActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_language_setup);

        // Get the container layout for buttons
        LinearLayout buttonContainer = findViewById(R.id.buttonContainer);

        // Get all available languages
        List<String> languages = Languages.getAllLanguages();

        // Create buttons dynamically
        LayoutInflater inflater = LayoutInflater.from(this);
        for (String language : languages) {
            View languageView = inflater.inflate(R.layout.item_language_selection, buttonContainer, false);
            TextView languageName = languageView.findViewById(R.id.languageName);
            languageName.setText(language);
            
            languageView.setOnClickListener(v -> updateSourceLanguage(language));
            
            buttonContainer.addView(languageView);
        }
    }

    private void updateSourceLanguage(String language) {
        // Check if this is a guest user
        if ("guest".equals(Variables.userUID)) {
            // For guest users, just store the language in Variables
            Variables.userLanguage = language;
            Variables.userTranslator = "claude"; // Default translator for guest
            
            Toast.makeText(LanguageSetupActivity.this, "Language set to " + language, Toast.LENGTH_SHORT).show();
            startActivity(new Intent(LanguageSetupActivity.this, MainActivity.class));
            finish();
            return;
        }
        
        // For regular users, continue with Firebase
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) {
            String uid = currentUser.getUid();
            DatabaseReference userRef = FirebaseDatabase.getInstance().getReference("users").child(uid);
            userRef.child("language").setValue(language)
                    .addOnSuccessListener(new OnSuccessListener<Void>() {
                        @Override
                        public void onSuccess(Void aVoid) {
                            Toast.makeText(LanguageSetupActivity.this, "Language updated successfully", Toast.LENGTH_SHORT).show();
                            startActivity(new Intent(LanguageSetupActivity.this, MainActivity.class));
                            finish();
                        }
                    })
                    .addOnFailureListener(new OnFailureListener() {
                        @Override
                        public void onFailure(@NonNull Exception e) {
                            Toast.makeText(LanguageSetupActivity.this, "Failed to update language", Toast.LENGTH_SHORT).show();
                        }
                    });
        }
    }
}