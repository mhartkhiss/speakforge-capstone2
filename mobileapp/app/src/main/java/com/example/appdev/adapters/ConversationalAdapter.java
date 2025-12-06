package com.example.appdev.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.example.appdev.R;
import com.example.appdev.models.ConversationalMessage;
import com.example.appdev.utils.LoadingDotsView;
import java.util.List;
import java.util.ArrayList;

public class ConversationalAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int VIEW_TYPE_MESSAGE = 0;
    private static final int VIEW_TYPE_LOADING = 1;

    private List<ConversationalMessage> messages = new ArrayList<>();
    private OnRegenerateListener regenerateListener;
    private boolean isLoading = false;
    private int loadingColor;

    public interface OnRegenerateListener {
        void onRegenerate(ConversationalMessage message, int position);
    }

    public ConversationalAdapter(OnRegenerateListener regenerateListener) {
        this.regenerateListener = regenerateListener;
    }

    public void addMessage(ConversationalMessage message) {
        messages.add(message);
        
        // Notify the previous item changed so it can update its appearance (become pale)
        if (messages.size() > 1) {
            notifyItemChanged(messages.size() - 2);
        }
        
        notifyItemInserted(messages.size() - 1);
    }

    public void updateMessage(int position, String newTranslation) {
        if (position >= 0 && position < messages.size()) {
            messages.get(position).setTranslatedText(newTranslation);
            notifyItemChanged(position);
        }
    }
    
    public void setLoading(boolean loading, int color) {
        if (this.isLoading != loading) {
            this.isLoading = loading;
            this.loadingColor = color;
            if (loading) {
                notifyItemInserted(messages.size());
            } else {
                notifyItemRemoved(messages.size());
            }
        }
    }

    @Override
    public int getItemViewType(int position) {
        if (isLoading && position == messages.size()) {
            return VIEW_TYPE_LOADING;
        }
        return VIEW_TYPE_MESSAGE;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == VIEW_TYPE_LOADING) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_conversational_loading, parent, false);
            return new LoadingViewHolder(view);
        } else {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_conversational_message, parent, false);
            return new MessageViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof LoadingViewHolder) {
            LoadingViewHolder loadingHolder = (LoadingViewHolder) holder;
            loadingHolder.loadingDots.setDotColor(loadingColor);
            loadingHolder.loadingDots.startAnimation();
        } else if (holder instanceof MessageViewHolder) {
            MessageViewHolder messageHolder = (MessageViewHolder) holder;
            ConversationalMessage message = messages.get(position);
            
            // Set styles based on sender first
            if (message.isFromUser1()) {
                // Message from User 1 (Orange), displayed on User 2's screen
                // Inverted: Using User 2 (Blue) styles
                messageHolder.bubbleContainer.setBackgroundResource(R.drawable.speech_bubble_user2);
                messageHolder.btnRegenerate.setColorFilter(ContextCompat.getColor(holder.itemView.getContext(), R.color.user2_color));
            } else {
                // Message from User 2 (Blue), displayed on User 1's screen
                // Inverted: Using User 1 (Orange) styles
                messageHolder.bubbleContainer.setBackgroundResource(R.drawable.speech_bubble_user1);
                messageHolder.btnRegenerate.setColorFilter(ContextCompat.getColor(holder.itemView.getContext(), R.color.user1_color));
            }

            if (message.isRegenerating()) {
                messageHolder.messageText.setVisibility(View.GONE);
                messageHolder.regeneratingDots.setVisibility(View.VISIBLE);
                messageHolder.regeneratingDots.setDotColor(android.graphics.Color.WHITE);
                messageHolder.regeneratingDots.startAnimation();
                
                messageHolder.btnRegenerate.setEnabled(false);
                messageHolder.btnRegenerate.setAlpha(0.5f);
            } else {
                messageHolder.messageText.setVisibility(View.VISIBLE);
                messageHolder.messageText.setText(message.getTranslatedText());
                messageHolder.regeneratingDots.setVisibility(View.GONE);
                // messageHolder.regeneratingDots.stopAnimation(); // If method exists, otherwise visibility gone is enough
                
                messageHolder.btnRegenerate.setEnabled(true);
                messageHolder.btnRegenerate.setAlpha(1.0f);
            }
            
            // Check if this is the latest message (ignoring loading item)
            boolean isLatest = (position == messages.size() - 1);
            
            // Pale effect for previous messages (apply to bubble background)
            if (!isLatest) {
                // Pale (transparent) background
                messageHolder.bubbleContainer.getBackground().mutate().setAlpha(100); // ~40% opacity
                messageHolder.messageText.setAlpha(1.0f); // Text stays opaque (but will look lighter due to bg? No, text is white)
                // Actually if bg is transparent, text might be hard to read if background behind activity is white.
                // The activity background is white. 
                // If bubble becomes transparent orange, it becomes pale orange. White text on pale orange might be hard to read.
                // But user requested "change the color of message bubble to pale orange or pale blue".
                // And "latest message is the brighter color".
                // If text is white, we need contrast.
                // Maybe we should keep text opaque? Yes.
            } else {
                // Full opacity
                messageHolder.bubbleContainer.getBackground().mutate().setAlpha(255);
                messageHolder.messageText.setAlpha(1.0f);
            }
            
            // Show regenerate button
            messageHolder.btnRegenerate.setVisibility(View.VISIBLE);
            messageHolder.btnRegenerate.setOnClickListener(v -> {
                if (regenerateListener != null) {
                    regenerateListener.onRegenerate(message, position);
                }
            });
        }
    }

    @Override
    public int getItemCount() {
        return messages.size() + (isLoading ? 1 : 0);
    }

    public static class MessageViewHolder extends RecyclerView.ViewHolder {
        View bubbleContainer;
        TextView messageText;
        ImageView btnRegenerate;
        LoadingDotsView regeneratingDots;

        public MessageViewHolder(@NonNull View itemView) {
            super(itemView);
            bubbleContainer = itemView.findViewById(R.id.bubbleContainer);
            messageText = itemView.findViewById(R.id.messageText);
            btnRegenerate = itemView.findViewById(R.id.btnRegenerate);
            regeneratingDots = itemView.findViewById(R.id.regeneratingDots);
        }
    }

    public static class LoadingViewHolder extends RecyclerView.ViewHolder {
        LoadingDotsView loadingDots;

        public LoadingViewHolder(@NonNull View itemView) {
            super(itemView);
            loadingDots = itemView.findViewById(R.id.loadingDots);
        }
    }
}
