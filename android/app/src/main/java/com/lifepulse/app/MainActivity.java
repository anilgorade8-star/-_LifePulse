package com.lifepulse.app;

import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;

import java.io.File;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    private NetworkUtils networkUtils;
    private GemmaLocalAi gemmaLocalAi;
    private boolean isGemmaInitialized = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d(TAG, "MainActivity.onCreate started.");
        registerPlugin(OfflineAiPlugin.class);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        gemmaLocalAi = new GemmaLocalAi();

        // Initialize network callback
        networkUtils = new NetworkUtils(this, this::onNetworkStatusChanged);
        networkUtils.registerNetworkCallback();

        // Check for the model and update status, but do not auto-download
        handleInitialStatus(networkUtils.isOnline());
    }

    private void handleInitialStatus(boolean isOnline) {
        File modelFile = new File(new File(getExternalFilesDir(null), "models"), "gemma-2b-it-q4.gguf");

        if (modelFile.exists()) {
            Log.d(TAG, "Model exists. Initializing Gemma.");
            initializeGemma(modelFile.getAbsolutePath());
        } else {
            Log.d(TAG, "Offline model not found.");
        }

        onNetworkStatusChanged(isOnline);
    }

    public void initializeGemma(String modelPath) {
        Log.d(TAG, "initializeGemma called with path: " + modelPath);
        if (isGemmaInitialized) return;
        new Thread(() -> {
            isGemmaInitialized = gemmaLocalAi.initModel(modelPath);
            if (isGemmaInitialized) {
                Log.d(TAG, "Gemma initialized successfully.");
                showToast("Offline AI Engine Initialized.");
                // Refresh status to show Gemma is ready
                onNetworkStatusChanged(networkUtils.isOnline());
            } else {
                Log.e(TAG, "Gemma initialization failed.");
                showToast("Error: Could not initialize Offline AI.");
            }
        }).start();
    }

    private void onNetworkStatusChanged(boolean isOnline) {
        runOnUiThread(() -> {
            JSObject ret = new JSObject();
            ret.put("isOnline", isOnline);
            if (!isOnline && !isGemmaInitialized) {
                ret.put("status", "🔵 Offline (Model Not Found)");
            } else if (!isOnline) {
                ret.put("status", "🔵 Offline (Gemma)");
            } else {
                ret.put("status", "🟢 Online (Gemini)");
            }
            bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('networkStatusChange', { detail: " + ret.toString() + " }))", null);
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
