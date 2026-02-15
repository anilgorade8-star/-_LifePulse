#include <jni.h>
#include <string>
#include <android/log.h>
#include "llama.cpp/llama.h"

// --- Globals for the model and context ---
llama_model *model = nullptr;
llama_context *ctx = nullptr;

// --- Healthcare Safety System Prompt ---
const char* SYSTEM_PROMPT = "You are a health assistant. You give general advice only. You never diagnose. You always recommend consulting a doctor.";

#define TAG "JNI_Llama"

extern "C" JNIEXPORT jboolean JNICALL
Java_com_lifepulse_app_GemmaLocalAi_initModel(JNIEnv *env, jobject thiz, jstring model_path) {
    const char *path = env->GetStringUTFChars(model_path, nullptr);
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing model from: %s", path);

    // --- Load the Model ---
    auto mparams = llama_model_default_params();
    model = llama_load_model_from_file(path, mparams);
    env->ReleaseStringUTFChars(model_path, path);

    if (model == nullptr) {
        __android_log_print(ANDROID_LOG_ERROR, TAG, "Failed to load model");
        return JNI_FALSE;
    }

    // --- Create the Context ---
    auto cparams = llama_context_default_params();
    // Using 2 threads for performance on mobile.
    cparams.n_threads = 2;
    cparams.n_ctx = 2048; // Context window size

    ctx = llama_new_context_with_model(model, cparams);
    if (ctx == nullptr) {
        __android_log_print(ANDROID_LOG_ERROR, TAG, "Failed to create context");
        llama_free_model(model);
        return JNI_FALSE;
    }

    __android_log_print(ANDROID_LOG_INFO, TAG, "Model loaded successfully");
    return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_lifepulse_app_GemmaLocalAi_generateResponse(JNIEnv *env, jobject thiz, jstring prompt_text) {
    if (ctx == nullptr) {
        return env->NewStringUTF("Model is not loaded.");
    }

    const char *prompt_chars = env->GetStringUTFChars(prompt_text, nullptr);
    std::string full_prompt = std::string(SYSTEM_PROMPT) + "\n\nUser: " + std::string(prompt_chars) + "\nAssistant:";
    env->ReleaseStringUTFChars(prompt_text, prompt_chars);

    // --- Tokenize the Prompt ---
    auto tokens = std::vector<llama_token>(llama_n_ctx(ctx));
    int n_tokens = llama_tokenize(model, full_prompt.c_str(), full_prompt.length(), tokens.data(), tokens.size(), true, false);
    if (n_tokens < 0) {
         __android_log_print(ANDROID_LOG_ERROR, TAG, "Failed to tokenize prompt");
        return env->NewStringUTF("Error: Failed to tokenize prompt.");
    }
    tokens.resize(n_tokens);

    // --- Evaluate the Prompt ---
    llama_eval(ctx, tokens.data(), n_tokens, 0);

    // --- Generate the Response ---
    std::string response = "";
    const int max_tokens = 200; // Limit response length

    for (int i = 0; i < max_tokens; ++i) {
        llama_token id = llama_sample_token_greedy(ctx, nullptr);

        if (id == llama_token_eos(model)) {
            break; // End of sequence
        }

        response += llama_token_to_piece(ctx, id);

        // Evaluate the new token
        llama_token new_tokens[] = { id };
        llama_eval(ctx, new_tokens, 1, n_tokens + i);
    }

    return env->NewStringUTF(response.c_str());
}

extern "C" JNIEXPORT void JNICALL
Java_com_lifepulse_app_GemmaLocalAi_releaseModel(JNIEnv *env, jobject thiz) {
    if (ctx != nullptr) {
        llama_free(ctx);
        ctx = nullptr;
    }
    if (model != nullptr) {
        llama_free_model(model);
        model = nullptr;
    }
    __android_log_print(ANDROID_LOG_INFO, TAG, "Model released");
}
