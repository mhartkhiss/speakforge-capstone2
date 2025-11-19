package com.example.appdev.utils;

import android.graphics.Bitmap;
import android.graphics.Color;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for generating QR codes
 */
public class QRCodeGenerator {

    private static final int QR_CODE_SIZE = 512; // Default QR code size

    /**
     * Generates a QR code for the APK download URL
     * @param downloadUrl The APK download URL to encode
     * @return Bitmap of the generated QR code, or null if generation fails
     */
    public Bitmap generateAppDownloadQRCode(String downloadUrl) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            
            // Set encoding hints for better quality
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);
            
            BitMatrix bitMatrix = writer.encode(downloadUrl, BarcodeFormat.QR_CODE, 
                                                QR_CODE_SIZE, QR_CODE_SIZE, hints);
            
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
            
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    bitmap.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }
            
            return bitmap;
            
        } catch (WriterException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Generates a QR code with custom size
     * @param downloadUrl The APK download URL to encode
     * @param size The size of the QR code (width and height)
     * @return Bitmap of the generated QR code, or null if generation fails
     */
    public Bitmap generateAppDownloadQRCode(String downloadUrl, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            
            // Set encoding hints for better quality
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);
            
            BitMatrix bitMatrix = writer.encode(downloadUrl, BarcodeFormat.QR_CODE, 
                                                size, size, hints);
            
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
            
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    bitmap.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }
            
            return bitmap;
            
        } catch (WriterException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Generates a QR code for user connection
     * @param userId The user's unique ID
     * @param username The user's display name
     * @param language The user's language
     * @param profileImageUrl The user's profile image URL (can be null)
     * @return Bitmap of the generated QR code for user connection
     */
    public Bitmap generateUserQRCode(String userId, String username, String language, String profileImageUrl) {
        try {
            // Create the user connection data in the expected format
            String profileUrl = (profileImageUrl != null && !profileImageUrl.isEmpty()) ? 
                               java.net.URLEncoder.encode(profileImageUrl, "UTF-8") : "none";
            String encodedUsername = java.net.URLEncoder.encode(username, "UTF-8");
            
            String userData = String.format("speakforge://user?userId=%s&username=%s&language=%s&profileImageUrl=%s",
                                          userId, encodedUsername, language, profileUrl);
            
            QRCodeWriter writer = new QRCodeWriter();
            
            // Set encoding hints for better quality
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);
            
            BitMatrix bitMatrix = writer.encode(userData, BarcodeFormat.QR_CODE, 
                                                QR_CODE_SIZE, QR_CODE_SIZE, hints);
            
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
            
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    bitmap.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }
            
            return bitmap;
            
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
