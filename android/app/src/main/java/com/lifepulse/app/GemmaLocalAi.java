package com.lifepulse.app;

/**
 * Manages the native Gemma 2B model via JNI.
 * This class is the bridge between the Android app (Java) and the C++ llama.cpp code.
 */
public class GemmaLocalAi {

    // Load the native library that contains our JNI functions.
    static {
        System.loadLibrary("native-lib");
    }

    /**
     * Initializes the Gemma model from the given file path.
     *
     * @param modelPath The absolute path to the .gguf model file.
     * @return True if the model was loaded successfully, false otherwise.
     */
    public native boolean initModel(String modelPath);

    /**
     * Generates a response from the loaded model for the given prompt.
     *
     * @param prompt The input text prompt for the model.
     * @return The generated text response from the model.
     */
    public native String generateResponse(String prompt);

    /**
     * Releases the model from memory.
     */
    public native void releaseModel();
}
