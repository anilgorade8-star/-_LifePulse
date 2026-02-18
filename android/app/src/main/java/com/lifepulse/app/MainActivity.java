package com.lifepulse.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

import java.io.File;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    private NetworkUtils networkUtils;
    private GemmaLocalAi gemmaLocalAi;
    private boolean isGemmaInitialized = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "MainActivity.onCreate started.");
        
        // This line is for the edge-to-edge layout, it is correct.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        registerPlugin(OfflineAiPlugin.class);
        registerPlugin(com.capacitorjs.plugins.haptics.HapticsPlugin.class);

        gemmaLocalAi = new GemmaLocalAi();

        // Initialize network callback
        networkUtils = new NetworkUtils(this, this::onNetworkStatusChanged);
        networkUtils.registerNetworkCallback();

        // Directly check for the model on startup
        handleInitialStatus();
    }

    private void handleInitialStatus() {
        File modelFile = new File(new File(getExternalFilesDir(null), "models"), "gemma-2b-it-q4.gguf");

        if (modelFile.exists()) {
            Log.d(TAG, "Model file exists. Initializing Gemma.");
            initializeGemma(modelFile.getAbsolutePath());
        } else {
            Log.d(TAG, "Offline model file not found. Please place it manually.");
        }

        // Always send an initial status update after a delay
        new Handler(Looper.getMainLooper()).postDelayed(
            () -> onNetworkStatusChanged(networkUtils.isOnline()),
            1500 // Use a slightly longer delay to be safe
        );
    }

    public void initializeGemma(String modelPath) {
        if (isGemmaInitialized) return;
        Log.d(TAG, "Initializing Gemma with path: " + modelPath);
        new Thread(() -> {
            isGemmaInitialized = gemmaLocalAi.initModel(modelPath);
            runOnUiThread(() -> {
                if (isGemmaInitialized) {
                    Log.d(TAG, "Gemma initialized successfully.");
                    showToast("Offline AI Engine Initialized.");
                    // Send an update to the webview now that Gemma is ready
                    onNetworkStatusChanged(networkUtils.isOnline());
                } else {
                    Log.e(TAG, "Gemma initialization failed.");
                    showToast("Error: Could not initialize Offline AI.");
                }
            });
        }).start();
    }

    private void onNetworkStatusChanged(boolean isOnline) {
        runOnUiThread(() -> {
            JSObject ret = new JSObject();
            ret.put("isOnline", isOnline);
            ret.put("isGemmaInitialized", isGemmaInitialized);

            String status;
            if (isOnline) {
                status = isGemmaInitialized ? "🟢 Online | Offline Ready" : "🟢 Online | Download Available";
            } else {
                status = isGemmaInitialized ? "🔵 Offline (Gemma)" : "🔴 Offline (Model Not Found)";
            }
            ret.put("status", status);

            String eventScript = String.format(
                "window.dispatchEvent(new CustomEvent('networkStatusChange', { detail: %s }))",
                ret.toString()
            );
            bridge.getWebView().evaluateJavascript(eventScript, null);
        });
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (isGemmaInitialized) {
            gemmaLocalAi.releaseModel();
        }
    }

    private void showToast(String message) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
    }
}
