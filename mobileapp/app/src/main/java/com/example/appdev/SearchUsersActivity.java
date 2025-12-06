package com.example.appdev;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import com.example.appdev.adapters.RecentConnectionsAdapter;
import com.example.appdev.adapters.SearchUserAdapter;
import com.example.appdev.models.User;
import com.example.appdev.utils.ConnectionRequestManager;
import com.example.appdev.utils.CustomNotification;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.List;

public class SearchUsersActivity extends AppCompatActivity {

    private static final String TAG = "SearchUsersActivity";

    private RecyclerView recyclerViewUsers;
    private RecyclerView recyclerViewRecentConnections;
    private EditText editTextSearch;
    private ProgressBar progressBar;
    private TextView textViewNoUsers;
    private ImageView imageViewBack;
    private android.widget.LinearLayout cardViewRecentConnections;

    private SearchUserAdapter searchUserAdapter;
    private RecentConnectionsAdapter recentConnectionsAdapter;
    private List<User> allUsers = new ArrayList<>();
    private List<User> filteredUsers = new ArrayList<>();
    private List<User> recentConnections = new ArrayList<>();
    private String currentUserId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_users);

        // Get current user ID
        currentUserId = FirebaseAuth.getInstance().getCurrentUser().getUid();

        // Initialize views
        recyclerViewUsers = findViewById(R.id.recyclerViewUsers);
        recyclerViewRecentConnections = findViewById(R.id.recyclerViewRecentConnections);
        editTextSearch = findViewById(R.id.editTextSearch);
        progressBar = findViewById(R.id.progressBar);
        textViewNoUsers = findViewById(R.id.textViewNoUsers);
        imageViewBack = findViewById(R.id.imageViewBack);
        cardViewRecentConnections = findViewById(R.id.cardViewRecentConnections);

        // Set up back button
        imageViewBack.setOnClickListener(v -> finish());

        // Set up RecyclerViews
        searchUserAdapter = new SearchUserAdapter(filteredUsers, this, currentUserId, this::onUserClicked);
        recyclerViewUsers.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewUsers.setAdapter(searchUserAdapter);

        // Set up recent connections RecyclerView
        recentConnectionsAdapter = new RecentConnectionsAdapter(recentConnections, this, currentUserId, this::onUserClicked);
        LinearLayoutManager horizontalLayoutManager = new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false);
        recyclerViewRecentConnections.setLayoutManager(horizontalLayoutManager);
        recyclerViewRecentConnections.setAdapter(recentConnectionsAdapter);

        // Set up search functionality
        editTextSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterUsers(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Load all users and recent connections
        loadUsers();
        loadRecentConnections();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Start listening for incoming connection requests
        ConnectionRequestManager.getInstance().startListeningForRequests(this);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Stop listening for connection requests to prevent dialogs on background or leaks
        ConnectionRequestManager.getInstance().stopListeningForRequests();
    }

    private void loadUsers() {
        progressBar.setVisibility(View.VISIBLE);
        textViewNoUsers.setVisibility(View.GONE);

        DatabaseReference usersRef = FirebaseDatabase.getInstance().getReference("users");

        usersRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                allUsers.clear();
                for (DataSnapshot userSnapshot : dataSnapshot.getChildren()) {
                    String userId = userSnapshot.getKey();
                    // Skip current user
                    if (userId != null && !userId.equals(currentUserId)) {
                        String username = userSnapshot.child("username").getValue(String.class);
                        String email = userSnapshot.child("email").getValue(String.class);
                        String language = userSnapshot.child("language").getValue(String.class);
                        String profileImageUrl = userSnapshot.child("profileImageUrl").getValue(String.class);

                        if (username != null && email != null) {
                            User user = new User();
                            user.setUserId(userId);
                            user.setUsername(username);
                            user.setEmail(email);
                            user.setLanguage(language != null ? language : "Unknown");
                            user.setProfileImageUrl(profileImageUrl);
                            allUsers.add(user);
                        }
                    }
                }

                progressBar.setVisibility(View.GONE);

                if (allUsers.isEmpty()) {
                    textViewNoUsers.setText("No users available");
                    textViewNoUsers.setVisibility(View.VISIBLE);
                } else {
                    textViewNoUsers.setVisibility(View.GONE);
                }

                // Initially show no results until user searches
                filteredUsers.clear();
                searchUserAdapter.notifyDataSetChanged();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
                Log.e(TAG, "Error loading users: " + databaseError.getMessage());
                progressBar.setVisibility(View.GONE);
                textViewNoUsers.setText("Failed to load users");
                textViewNoUsers.setVisibility(View.VISIBLE);
                CustomNotification.showNotification(SearchUsersActivity.this,
                        "Failed to load users", false);
            }
        });
    }

    private void loadRecentConnections() {
        recentConnections.clear();

        // We'll collect user IDs from different sources and then fetch their details
        java.util.Set<String> recentUserIds = new java.util.HashSet<>();
        java.util.Map<String, Long> userActivityTimes = new java.util.HashMap<>();

        DatabaseReference connectionRequestsRef = FirebaseDatabase.getInstance().getReference("connection_requests");

        // Get accepted connection requests where current user is involved
        connectionRequestsRef.orderByChild("fromUserId").equalTo(currentUserId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                        for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                            com.example.appdev.models.ConnectionRequest request = snapshot.getValue(com.example.appdev.models.ConnectionRequest.class);
                            if (request != null && request.getStatus() != null && request.getStatus().equals("ACCEPTED")) {
                                String otherUserId = request.getToUserId();
                                if (otherUserId != null && !otherUserId.equals(currentUserId)) {
                                    recentUserIds.add(otherUserId);
                                    userActivityTimes.put(otherUserId, request.getTimestamp());
                                }
                            }
                        }

                        // Also check for requests received by current user
                        connectionRequestsRef.orderByChild("toUserId").equalTo(currentUserId)
                                .addListenerForSingleValueEvent(new ValueEventListener() {
                                    @Override
                                    public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                                        for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                                            com.example.appdev.models.ConnectionRequest request = snapshot.getValue(com.example.appdev.models.ConnectionRequest.class);
                                            if (request != null && request.getStatus() != null && request.getStatus().equals("ACCEPTED")) {
                                                String otherUserId = request.getFromUserId();
                                                if (otherUserId != null && !otherUserId.equals(currentUserId)) {
                                                    recentUserIds.add(otherUserId);
                                                    // Use the more recent timestamp if this user appears in multiple requests
                                                    Long existingTime = userActivityTimes.get(otherUserId);
                                                    if (existingTime == null || request.getTimestamp() > existingTime) {
                                                        userActivityTimes.put(otherUserId, request.getTimestamp());
                                                    }
                                                }
                                            }
                                        }

                                        // Now check for connect_chats with messages (actual conversations)
                                        checkConnectChatsForRecentUsers(recentUserIds, userActivityTimes);
                                    }

                                    @Override
                                    public void onCancelled(@NonNull DatabaseError databaseError) {
                                        Log.e(TAG, "Error loading received connection requests: " + databaseError.getMessage());
                                        // Still proceed to check connect chats
                                        checkConnectChatsForRecentUsers(recentUserIds, userActivityTimes);
                                    }
                                });
                    }

                    @Override
                    public void onCancelled(@NonNull DatabaseError databaseError) {
                        Log.e(TAG, "Error loading sent connection requests: " + databaseError.getMessage());
                        // Still proceed to check connect chats
                        checkConnectChatsForRecentUsers(new java.util.HashSet<>(), new java.util.HashMap<>());
                    }
                });
    }

    private void checkConnectChatsForRecentUsers(java.util.Set<String> recentUserIds, java.util.Map<String, Long> userActivityTimes) {
        DatabaseReference connectChatsRef = FirebaseDatabase.getInstance().getReference("connect_chats");

        connectChatsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                for (DataSnapshot sessionSnapshot : dataSnapshot.getChildren()) {
                    String sessionId = sessionSnapshot.getKey();
                    if (sessionId != null && sessionId.contains(currentUserId)) {
                        // This is a chat session involving the current user
                        String otherUserId = getOtherUserIdFromSession(sessionId, currentUserId);
                        if (otherUserId != null) {
                            // Check if there are actual messages in this session
                            if (sessionSnapshot.hasChildren()) {
                                recentUserIds.add(otherUserId);

                                // Get the most recent message timestamp
                                long latestTimestamp = 0;
                                for (DataSnapshot messageSnapshot : sessionSnapshot.getChildren()) {
                                    Long timestamp = messageSnapshot.child("timestamp").getValue(Long.class);
                                    if (timestamp != null && timestamp > latestTimestamp) {
                                        latestTimestamp = timestamp;
                                    }
                                }

                                // Update activity time if this is more recent
                                Long existingTime = userActivityTimes.get(otherUserId);
                                if (existingTime == null || latestTimestamp > existingTime) {
                                    userActivityTimes.put(otherUserId, latestTimestamp);
                                }
                            }
                        }
                    }
                }

                // Now fetch user details for all recent user IDs
                fetchRecentUserDetails(recentUserIds, userActivityTimes);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
                Log.e(TAG, "Error loading connect chats: " + databaseError.getMessage());
                // Still try to fetch user details with what we have
                fetchRecentUserDetails(recentUserIds, userActivityTimes);
            }
        });
    }

    private void fetchRecentUserDetails(java.util.Set<String> userIds, java.util.Map<String, Long> userActivityTimes) {
        if (userIds.isEmpty()) {
            // No recent connections found
            cardViewRecentConnections.setVisibility(View.GONE);
            return;
        }

        DatabaseReference usersRef = FirebaseDatabase.getInstance().getReference("users");
        final int[] completedRequests = {0};

        for (String userId : userIds) {
            usersRef.child(userId).addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    String username = dataSnapshot.child("username").getValue(String.class);
                    String email = dataSnapshot.child("email").getValue(String.class);
                    String language = dataSnapshot.child("language").getValue(String.class);
                    String profileImageUrl = dataSnapshot.child("profileImageUrl").getValue(String.class);

                    if (username != null) {
                        User user = new User();
                        user.setUserId(userId);
                        user.setUsername(username);
                        user.setEmail(email);
                        user.setLanguage(language != null ? language : "Unknown");
                        user.setProfileImageUrl(profileImageUrl);
                        user.setLastActivityTime(userActivityTimes.get(userId)); // Store for sorting

                        recentConnections.add(user);
                    }

                    completedRequests[0]++;
                    if (completedRequests[0] >= userIds.size()) {
                        // All requests completed, now sort and display
                        sortAndDisplayRecentConnections();
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                    Log.e(TAG, "Error fetching user details for recent connection: " + databaseError.getMessage());
                    completedRequests[0]++;
                    if (completedRequests[0] >= userIds.size()) {
                        sortAndDisplayRecentConnections();
                    }
                }
            });
        }
    }

    private void sortAndDisplayRecentConnections() {
        // Sort by most recent activity (descending)
        recentConnections.sort((u1, u2) -> {
            Long time1 = u1.getLastActivityTime() != null ? u1.getLastActivityTime() : 0L;
            Long time2 = u2.getLastActivityTime() != null ? u2.getLastActivityTime() : 0L;
            return Long.compare(time2, time1); // Most recent first
        });

        // Limit to 10 recent connections
        if (recentConnections.size() > 10) {
            recentConnections = recentConnections.subList(0, 10);
        }

        if (recentConnections.isEmpty()) {
            cardViewRecentConnections.setVisibility(View.GONE);
        } else {
            cardViewRecentConnections.setVisibility(View.VISIBLE);
            recentConnectionsAdapter.notifyDataSetChanged();
        }
    }

    private String getOtherUserIdFromSession(String sessionId, String currentUserId) {
        // Session ID format is "userId1_userId2" where userId1 < userId2 alphabetically
        String[] parts = sessionId.split("_");
        if (parts.length == 2) {
            if (parts[0].equals(currentUserId)) {
                return parts[1];
            } else if (parts[1].equals(currentUserId)) {
                return parts[0];
            }
        }
        return null;
    }

    private void filterUsers(String query) {
        filteredUsers.clear();

        if (query.trim().isEmpty()) {
            // Show no results when search is empty
            textViewNoUsers.setText("Start typing to search users");
            textViewNoUsers.setVisibility(View.VISIBLE);
        } else {
            // Filter users based on username or email
            for (User user : allUsers) {
                if (user.getUsername().toLowerCase().contains(query.toLowerCase()) ||
                    user.getEmail().toLowerCase().contains(query.toLowerCase())) {
                    filteredUsers.add(user);
                }
            }

            if (filteredUsers.isEmpty()) {
                textViewNoUsers.setText("No users found matching \"" + query + "\"");
                textViewNoUsers.setVisibility(View.VISIBLE);
            } else {
                textViewNoUsers.setVisibility(View.GONE);
            }
        }

        searchUserAdapter.notifyDataSetChanged();
    }


    private void onUserClicked(User user) {
        // Send connection request for all users (recent connections or search results)
        // Recent connections just make it convenient to select without searching
        showWaitingDialogAndSendRequest(user);
    }

    private void showWaitingDialogAndSendRequest(User user) {
        runOnUiThread(() -> {
            Dialog waitingDialog = new Dialog(this);
            waitingDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
            waitingDialog.setContentView(R.layout.connect_confirmation_dialog);

            // Set dialog properties
            android.view.Window window = waitingDialog.getWindow();
            if (window != null) {
                window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                window.setLayout(android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                               android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
                window.setDimAmount(0.8f);
            }

            // Initialize dialog views
            de.hdodenhof.circleimageview.CircleImageView profileImage = waitingDialog.findViewById(R.id.profileImage);
            TextView userNameText = waitingDialog.findViewById(R.id.userName);
            TextView userLanguageText = waitingDialog.findViewById(R.id.userLanguage);
            TextView statusText = waitingDialog.findViewById(R.id.statusText);
            TextView waitingText = waitingDialog.findViewById(R.id.waitingText);
            androidx.appcompat.widget.AppCompatButton cancelButton = waitingDialog.findViewById(R.id.cancelButton);
            ImageButton closeButton = waitingDialog.findViewById(R.id.closeButton);

            // Set user information
            userNameText.setText(user.getUsername());
            userLanguageText.setText("Language: " + user.getLanguage());
            statusText.setText("Sending request...");
            waitingText.setText("Please wait...");

            // Load profile image
            if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().equals("none")) {
                Glide.with(this)
                        .load(user.getProfileImageUrl())
                        .placeholder(R.drawable.default_userpic)
                        .into(profileImage);
            } else {
                profileImage.setImageResource(R.drawable.default_userpic);
            }

            // Store requestId for cancellation
            final String[] currentRequestId = {null};

            // Immediately send the connection request
            ConnectionRequestManager.getInstance().createConnectionRequest(
                user.getUserId(), user.getUsername(), user.getLanguage(), user.getProfileImageUrl(),
                new ConnectionRequestManager.ConnectionRequestCallback() {
                    @Override
                    public void onSuccess(com.example.appdev.models.ConnectionRequest request) {
                        currentRequestId[0] = request.getRequestId();
                        runOnUiThread(() -> {
                            statusText.setText("Request sent successfully!");
                            statusText.setTextColor(getResources().getColor(android.R.color.holo_green_dark));
                            waitingText.setText("Waiting for " + user.getUsername() + " to respond...");

                            // Listen for request status changes
                            listenForRequestStatus(request.getRequestId(), waitingDialog, statusText, waitingText, user.getUsername());
                        });
                    }

                    @Override
                    public void onError(String error) {
                        runOnUiThread(() -> {
                            statusText.setText("Failed to send request");
                            statusText.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
                            waitingText.setText(error);
                            cancelButton.setText("Close");
                        });
                    }
                });

            // Set click listeners
            cancelButton.setOnClickListener(v -> {
                // Cancel the connection request if it exists
                if (currentRequestId[0] != null) {
                    ConnectionRequestManager.getInstance().cancelConnectionRequest(currentRequestId[0]);
                }
                waitingDialog.dismiss();
            });

            closeButton.setOnClickListener(v -> {
                // Cancel the connection request if it exists
                if (currentRequestId[0] != null) {
                    ConnectionRequestManager.getInstance().cancelConnectionRequest(currentRequestId[0]);
                }
                waitingDialog.dismiss();
            });

            waitingDialog.setOnCancelListener(dialog -> {
                // Cancel the connection request if it exists
                if (currentRequestId[0] != null) {
                    ConnectionRequestManager.getInstance().cancelConnectionRequest(currentRequestId[0]);
                }
            });

            waitingDialog.setCancelable(false); // Prevent back button from dismissing
            waitingDialog.show();
        });
    }

    private void listenForRequestStatus(String requestId, Dialog waitingDialog, TextView statusText, TextView waitingText, String username) {
        DatabaseReference requestRef = FirebaseDatabase.getInstance()
                .getReference("connection_requests").child(requestId);

        requestRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                if (!dataSnapshot.exists()) return;

                String status = dataSnapshot.child("status").getValue(String.class);
                if (status == null) return;

                runOnUiThread(() -> {
                    switch (status) {
                        case "ACCEPTED":
                            statusText.setText("Request accepted!");
                            statusText.setTextColor(getResources().getColor(android.R.color.holo_green_dark));
                            waitingText.setText("Opening chat...");
                            // Dismiss dialog after showing success message
                            new Handler().postDelayed(() -> {
                                if (waitingDialog.isShowing()) {
                                    waitingDialog.dismiss();
                                }
                            }, 1500);
                            break;

                        case "REJECTED":
                            statusText.setText("Request rejected");
                            statusText.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
                            waitingText.setText("The connection request was declined.");
                            // Auto-dismiss after showing the message
                            new Handler().postDelayed(() -> {
                                if (waitingDialog.isShowing()) {
                                    waitingDialog.dismiss();
                                }
                            }, 3000);
                            break;

                        case "TIMEOUT":
                        case "EXPIRED":
                            statusText.setText("Request expired");
                            statusText.setTextColor(getResources().getColor(android.R.color.holo_orange_dark));
                            waitingText.setText("The request has expired.");
                            // Auto-dismiss after showing the message
                            new Handler().postDelayed(() -> {
                                if (waitingDialog.isShowing()) {
                                    waitingDialog.dismiss();
                                }
                            }, 3000);
                            break;

                        default:
                            // Still pending
                            break;
                    }
                });
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                Log.e(TAG, "Error listening for request status", databaseError.toException());
            }
        });
    }
}
