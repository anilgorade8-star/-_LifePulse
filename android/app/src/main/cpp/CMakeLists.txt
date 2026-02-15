# Sets the minimum version of CMake required.
cmake_minimum_required(VERSION 3.22.1)

# Defines the project name and languages.
project("lifepulse" C CXX)

# --- llama.cpp Integration ---
# Add the llama.cpp directory as a subdirectory. CMake will find and use its CMakeLists.txt.
# We assume llama.cpp has been placed inside the cpp directory.
add_subdirectory(llama.cpp)

# --- JNI Bridge Library ---
# Creates a shared library named 'native-lib' from our JNI source file.
add_library(native-lib SHARED native-lib.cpp)

# Find and link the Android logging library, so we can use __android_log_print for debugging.
find_library(log-lib log)

# Link our native-lib with the llama library and the Android logging library.
target_link_libraries(native-lib llama android log-lib)
