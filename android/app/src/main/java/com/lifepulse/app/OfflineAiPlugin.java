package com.lifepulse.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "OfflineAi")
public class OfflineAiPlugin extends Plugin {

    // IMPORTANT: This is the official, direct download link for the Gemma 2B GGUF model.
    private static final String MODEL_URL = "https://huggingface.co/google/gemma-2b-it/resolve/main/gemma-2b-it.gguf?download=true";

    private GemmaLocalAi gemmaAi = new GemmaLocalAi();

    @PluginMethod()
    public void generateResponse(PluginCall call) {
        String prompt = call.getString("prompt");
        if (prompt == null || prompt.isEmpty()) {
            call.reject("Prompt is required.");
            return;
        }

        // Run inference on a background thread to avoid blocking the UI.
        new Thread(() -> {
            String response = gemmaAi.generateResponse(prompt);
            JSObject ret = new JSObject();
            ret.put("response", response);
            call.resolve(ret);
        }).start();
    }

    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void downloadModel(PluginCall call) {
        call.setKeepAlive(true);
        ModelDownloader downloader = new ModelDownler();
        downloader.downloadModel(getContext(), MODEL_URL, new ModelDownloader.DownloadListener() {
            @Override
            public void onProgress(int progress) {
                JSObject ret = new JSObject();
                ret.put("progress", progress);
                call.notifyListeners("downloadProgress", ret);
            }

            @Override
            public void onComplete(File modelFile) {
                JSObject ret = new JSObject();
                ret.put("path", modelFile.getAbsolutePath());
                call.resolve(ret);
            }

            @Override
            public void onFailure(Exception e) {
                call.reject("Model download failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void initializeGemma(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Model path must be provided.");
            return;
        }
        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            activity.initializeGemma(path);
            call.resolve();
        } else {
            call.reject("MainActivity not available");
        }
    }
}
