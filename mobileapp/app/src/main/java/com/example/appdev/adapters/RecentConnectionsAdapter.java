package com.example.appdev.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.appdev.R;
import com.example.appdev.models.User;

import java.util.List;

import de.hdodenhof.circleimageview.CircleImageView;

public class RecentConnectionsAdapter extends RecyclerView.Adapter<RecentConnectionsAdapter.RecentConnectionViewHolder> {

    private final List<User> userList;
    private final Context context;
    private final String currentUserId;
    private final OnUserClickListener onUserClickListener;

    public interface OnUserClickListener {
        void onUserClicked(User user);
    }

    public RecentConnectionsAdapter(List<User> userList, Context context, String currentUserId, OnUserClickListener listener) {
        this.userList = userList;
        this.context = context;
        this.currentUserId = currentUserId;
        this.onUserClickListener = listener;
    }

    @NonNull
    @Override
    public RecentConnectionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_recent_connection, parent, false);
        return new RecentConnectionViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecentConnectionViewHolder holder, int position) {
        User user = userList.get(position);

        // Set username
        holder.textViewUsername.setText(user.getUsername());

        // Show language info (more compact than search results)
        holder.textViewLanguage.setText(user.getLanguage() != null ? user.getLanguage() : "Unknown");

        // Load profile image
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().equals("none")) {
            Glide.with(context)
                    .load(user.getProfileImageUrl())
                    .placeholder(R.drawable.default_userpic)
                    .into(holder.imageViewUserPicture);
        } else {
            holder.imageViewUserPicture.setImageResource(R.drawable.default_userpic);
        }

        // Set click listener for the entire item
        holder.itemView.setOnClickListener(v -> {
            if (onUserClickListener != null) {
                onUserClickListener.onUserClicked(user);
            }
        });
    }

    @Override
    public int getItemCount() {
        return userList.size();
    }

    public static class RecentConnectionViewHolder extends RecyclerView.ViewHolder {

        private TextView textViewUsername;
        private TextView textViewLanguage;
        private CircleImageView imageViewUserPicture;

        public RecentConnectionViewHolder(@NonNull View itemView) {
            super(itemView);
            textViewUsername = itemView.findViewById(R.id.textViewUsername);
            textViewLanguage = itemView.findViewById(R.id.textViewLanguage);
            imageViewUserPicture = itemView.findViewById(R.id.imageViewUserPicture);
        }
    }
}
