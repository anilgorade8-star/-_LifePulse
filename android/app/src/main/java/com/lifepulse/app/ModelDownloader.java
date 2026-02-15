package com.lifepulse.app;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.function.Consumer;

/**
 * Handles the downloading of the Gemma model.
 */
public class ModelDownloader {

    private static final String TAG = "ModelDownloader";

    public interface DownloadListener {
        void onProgress(int progress);
        void onComplete(File modelFile);
        void onFailure(Exception e);
    }

    /**
     * Downloads the model from the given URL and saves it to the app's private storage.
     *
     * @param context  The application context.
     * @param modelUrl The URL of the model to download.
     * @param listener A listener to receive download status updates.
     */
    public void downloadModel(Context context, String modelUrl, DownloadListener listener) {
        new Thread(() -> {
            try {
                URL url = new URL(modelUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.connect();

                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                    throw new Exception("Server returned HTTP " + connection.getResponseCode()
                            + " " + connection.getResponseMessage());
                }

                int fileLength = connection.getContentLength();

                // --- Create the destination file ---
                File modelsDir = new File(context.getExternalFilesDir(null), "models");
                if (!modelsDir.exists()) {
                    if (!modelsDir.mkdirs()) {
                        throw new Exception("Could not create models directory");
                    }
                }
                File modelFile = new File(modelsDir, "gemma-2b-it-q4.gguf");

                // --- Download the file ---
                InputStream input = connection.getInputStream();
                FileOutputStream output = new FileOutputStream(modelFile);

                byte[] data = new byte[4096];
                long total = 0;
                int count;
                while ((count = input.read(data)) != -1) {
                    total += count;
                    if (fileLength > 0) {
                        int progress = (int) (total * 100 / fileLength);
                        listener.onProgress(progress);
                    }
                    output.write(data, 0, count);
                }

                output.close();
                input.close();
                connection.disconnect();

                Log.d(TAG, "Model downloaded successfully to: " + modelFile.getAbsolutePath());
                listener.onComplete(modelFile);

            } catch (Exception e) {
                Log.e(TAG, "Model download failed", e);
                listener.onFailure(e);
            }
        }).start();
    }
}
