#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>
#include "llama.h"

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
    model = llama_model_load_from_file(path, mparams);
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

    ctx = llama_init_from_model(model, cparams);
    if (ctx == nullptr) {
        __android_log_print(ANDROID_LOG_ERROR, TAG, "Failed to create context");
        llama_model_free(model);
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
    int n_tokens = llama_tokenize(llama_model_get_vocab(model), full_prompt.c_str(), full_prompt.length(), tokens.data(), tokens.size(), true, false);
    if (n_tokens < 0) {
         __android_log_print(ANDROID_LOG_ERROR, TAG, "Failed to tokenize prompt");
        return env->NewStringUTF("Error: Failed to tokenize prompt.");
    }
    tokens.resize(n_tokens);

    // --- Evaluate the Prompt ---
    llama_batch batch = llama_batch_init(n_tokens, 0, 1);
    llama_seq_id seq_id = 0;
    for (int32_t i = 0; i < n_tokens; i++) {
        batch.token[i] = tokens[i];
        batch.pos[i] = i;
        batch.n_seq_id[i] = 1;
        batch.seq_id[i] = &seq_id;
        batch.logits[i] = 0;
    }
    batch.logits[n_tokens - 1] = 1; // only care about logits for the last token

    if (llama_decode(ctx, batch) != 0) {
        __android_log_print(ANDROID_LOG_ERROR, TAG, "llama_decode failed");
        llama_batch_free(batch);
        return env->NewStringUTF("Error: llama_decode failed.");
    }

    // --- Generate the Response ---
    std::string response = "";
    const int max_tokens = 200; // Limit response length
    int n_cur = n_tokens;

    llama_sampler* sampler = llama_sampler_init_greedy();

    for (int i = 0; i < max_tokens; ++i) {
        // Sample the next token
        llama_token id = llama_sampler_sample(sampler, ctx, -1);
        llama_sampler_accept(sampler, id);

        if (id == llama_vocab_eos(llama_model_get_vocab(model))) {
            break;
        }

        response += llama_vocab_get_text(llama_model_get_vocab(model), id);

        // Prepare for the next iteration
        batch.n_tokens = 1;
        batch.token[0] = id;
        batch.pos[0] = n_cur;
        batch.logits[0] = 1;

        if (llama_decode(ctx, batch) != 0) {
            __android_log_print(ANDROID_LOG_ERROR, TAG, "llama_decode failed in loop");
            break;
        }
        n_cur++;
    }

    llama_batch_free(batch);
    llama_sampler_free(sampler);

    return env->NewStringUTF(response.c_str());
}


extern "C" JNIEXPORT void JNICALL
Java_com_lifepulse_app_GemmaLocalAi_releaseModel(JNIEnv *env, jobject thiz) {
    if (ctx != nullptr) {
        llama_free(ctx);
        ctx = nullptr;
    }
    if (model != nullptr) {
        llama_model_free(model);
        model = nullptr;
    }
    __android_log_print(ANDROID_LOG_INFO, TAG, "Model released");
}
