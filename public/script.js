// Global State
let currentLanguage = "en";
let aiLanguage = "en"; // AI response language
let chatHistory = [];
let isOnline = navigator.onLine;
let map = null;
let pharmacyMap = null;
let pharmacyMarkers = [];
let heartRateInterval = null;
let lastKnownLocation = null; // Stores {lat, lng, timestamp}
let isListening = false; // Tracks if voice recognition is active
let isIntentionalStop = false; // Tracks if stop was triggered by user

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  initApp();
  loadProfileData();
  loadFamilyMembers();
  animateStats();
  initCharts();
  checkConnectivity();

  // Heart rate simulation
  setInterval(() => {
    const hr = 70 + Math.floor(Math.random() * 10);
    const hrElement = document.getElementById("heartRate");
    if (hrElement) hrElement.textContent = hr;
  }, 3000);

  // Hide loading screen after 2 seconds
  window.addEventListener("load", function () {
    const loader = document.getElementById("loadingScreen");
    if (loader) {
      setTimeout(() => {
        loader.classList.add("fade-out");
        setTimeout(() => {
          loader.style.display = "none";
          window.scrollTo(0, 0); // Ensure page starts at top after loading
        }, 500);
      }, 2000);
    }
  });

  // Initialize visibility states (footer, nav buttons)
  try {
    showSection("home", false);
  } catch (e) {
    console.error("Error during initial showSection:", e);
    // Force hide loader if navigation fails
    const loader = document.getElementById("loadingScreen");
    if (loader) loader.style.display = "none";
  }
});

function initApp() {
  // Check online status
  window.addEventListener("online", () => updateOnlineStatus(true));
  window.addEventListener("offline", () => updateOnlineStatus(false));

  // Initialize medicine reminders
  checkMedicineReminders();
  setInterval(checkMedicineReminders, 60000); // Check every minute
}

function updateOnlineStatus(online) {
  isOnline = online;
  const bar = document.getElementById("offlineBar");
  if (online) {
    bar.style.display = "none";
    showNotification("Back online!", "success");
  } else {
    bar.style.display = "block";
    showNotification("You are offline. Limited features available.", "warning");
  }
}

function checkConnectivity() {
  if (!navigator.onLine) {
    document.getElementById("offlineBar").style.display = "block";
  }
}

// Navigation
function showSection(sectionId, updateHistory = true) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden");
    section.classList.remove("active");
  });

  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
    window.scrollTo(0, 0);

    // Update URL and History
    if (updateHistory) {
      history.pushState({ section: sectionId }, "", "#" + sectionId);
    }

    // Handle Mobile Back Button visibility
    const backBtn = document.getElementById("mobileBackButton");
    if (backBtn) {
      if (sectionId !== "home" && window.innerWidth < 768) {
        backBtn.classList.remove("hidden");
      } else {
        backBtn.classList.add("hidden");
      }
    }

    // Toggle Mobile Bottom Nav and Footer Visibility
    const bottomNav = document.getElementById("mobileBottomNav");
    const footer = document.querySelector("footer");
    const mainContainer = document.getElementById("mainContainer");
    const isMobile = window.innerWidth < 768;

    if (bottomNav) {
      if (sectionId === "ai-assistant") {
        bottomNav.style.display = "none";
        if (footer) footer.style.display = "none";
        document.body.classList.add("no-scroll");
        if (mainContainer) mainContainer.style.paddingBottom = "0";
      } else {
        if (isMobile) {
          bottomNav.style.display = "flex";
          if (footer) {
            footer.style.display = sectionId === "home" ? "block" : "none";
          }
          if (mainContainer) mainContainer.style.paddingBottom = "80px";
        } else {
          bottomNav.style.display = "none";
          if (footer) footer.style.display = "block";
          if (mainContainer) mainContainer.style.paddingBottom = "0";
        }
        document.body.classList.remove("no-scroll");
      }
    }

    if (sectionId === "pharmacy-finder") {
      setTimeout(initPharmacyMap, 100);
    }
    if (sectionId === "emergency") {
      setTimeout(initMap, 100);
    }
    if (sectionId === "dashboard") {
      updateDashboardCharts();
    }
  }
}

// Handle Capacitor Back Button (Mobile)
document.addEventListener("DOMContentLoaded", () => {
  // Check if running in Capacitor
  if (window.Capacitor) {
    const App = window.Capacitor.Plugins.App;

    if (App) {
      App.addListener("backButton", ({ canGoBack }) => {
        const currentHash = window.location.hash.substring(1);

        // If not on home, go back in history (which triggers our popstate listener)
        if (currentHash && currentHash !== "home") {
          window.history.back();
        } else {
          // If on home, exit app
          App.exitApp();
        }
      });
      console.log("Capacitor back button listener attached");
    }
  }
});

// Handle Initial Load
window.addEventListener("load", () => {
  const hash = window.location.hash.substring(1); // Remove '#'
  if (hash) {
    showSection(hash, false);
  } else {
    // Replace current state for home so back button works correctly
    history.replaceState({ section: "home" }, "", "#home");
  }
});

// AI Chatbot Functions

function addMessageToChat(sender, message) {
  const container = document.getElementById("ai-response-area");
  const div = document.createElement("div");
  div.className = "flex items-start space-x-3 chat-message";

  // Convert line breaks to HTML
  const formattedMessage = message.replace(/\n/g, "<br>");

  if (sender === "user") {
    div.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-purple-600 text-white rounded-2xl rounded-tr-none p-4 shadow-md max-w-[80%]">
                    ${formattedMessage}
                </div>
            </div>
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-purple-600"></i>
            </div>
        `;
  } else {
    // Add speak button for AI responses
    div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-purple-600"></i>
            </div>
            <div class="flex-1 space-y-2">
                <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[90%] ai-reply-content">
                    ${formattedMessage}
                </div>
                <button onclick="speakResponse(this.previousElementSibling)" class="text-xs font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 transition px-2 py-1 bg-purple-50 rounded-lg w-fit">
                    <i class="fas fa-volume-up"></i> Listen to Sanjeevani
                </button>
            </div>
        `;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById("ai-response-area");
  const div = document.createElement("div");
  div.id = "typingIndicator";
  div.className = "flex items-start space-x-3";
  div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-robot text-purple-600"></i>
        </div>
        <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-md">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

function generateAIResponse(input) {
  const lower = input.toLowerCase();

  // Emergency detection
  if (
    lower.includes("chest pain") ||
    lower.includes("heart attack") ||
    lower.includes("can't breathe")
  ) {
    return `🚨 <b>This sounds like a medical emergency!</b><br><br>
        Please call <b>108</b> immediately or press the SOS button.<br><br>
        While waiting for help:<br>
        • Sit down and stay calm<br>
        • Loosen tight clothing<br>
        • If you have aspirin, chew one (if not allergic)<br>
        • Do not drive yourself`;
  }

  // Common symptoms
  if (lower.includes("fever") || lower.includes("headache")) {
    return `Based on your symptoms (fever and headache), this could be:<br><br>
        <b>Common possibilities:</b><br>
        • Viral fever/flu<br>
        • Migraine<br>
        • Dehydration<br>
        • Typhoid (if prolonged)<br><br>
        <b>Immediate relief:</b><br>
        • Drink plenty of fluids (ORS, coconut water)<br>
        • Take paracetamol 500mg for fever<br>
        • Rest in a cool, dark room for headache<br>
        • Cold compress on forehead<br><br>
        <b>⚠️ See a doctor if:</b> Fever persists >3 days, severe headache with vomiting, or neck stiffness.`;
  }

  if (lower.includes("stomach") || lower.includes("pain")) {
    return `For stomach pain, the cause depends on the location:<br><br>
        <b>Upper abdomen:</b> Could be acidity, gastritis, or ulcer<br>
        <b>Lower right:</b> Watch for appendicitis<br>
        <b>General:</b> Food poisoning, gas, or infection<br><br>
        <b>Home remedies:</b><br>
        • Ajwain (carom seeds) with warm water<br>
        • Ginger tea<br>
        • Light food (khichdi, curd rice)<br>
        • Avoid spicy/oily food<br><br>
        <b>⚠️ Go to hospital if:</b> Severe pain, vomiting blood, or no bowel movement with swelling.`;
  }

  if (lower.includes("diabetes") || lower.includes("sugar")) {
    return `For diabetes management:<br><br>
        <b>Diet tips:</b><br>
        • Eat small, frequent meals<br>
        • Include bitter gourd (karela), fenugreek (methi)<br>
        • Use whole grains (bajra, ragi, oats)<br>
        • Avoid sugar, sweets, and white rice<br><br>
        <b>Lifestyle:</b><br>
        • Walk 30 mins daily after meals<br>
        • Check blood sugar regularly<br>
        • Take medicines on time<br><br>
        Would you like a personalized diet chart? Click on "Diet Generator" in the menu!`;
  }

  if (lower.includes("pregnant") || lower.includes("pregnancy")) {
    return `Congratulations! For a healthy pregnancy:<br><br>
        <b>Essential care:</b><br>
        • Take folic acid and iron tablets daily<br>
        • Eat protein-rich foods (dal, eggs, milk)<br>
        • Stay hydrated - 10-12 glasses water<br>
        • Sleep 8 hours, avoid heavy work<br><br>
        <b>Warning signs - see doctor immediately:</b><br>
        • Bleeding or spotting<br>
        • Severe headache or vision problems<br>
        • Swelling of hands/feet<br>
        • Baby not moving<br><br>
        <b>Free government scheme:</b> Register for Janani Suraksha Yojana (JSY) for free delivery and Rs. 1400 cash assistance.`;
  }

  // Default response
  return `Thank you for sharing. To help you better, could you tell me:<br><br>
    1. How long have you had these symptoms?<br>
    2. Any other symptoms (fever, vomiting, etc.)?<br>
    3. Your age and any existing health conditions?<br><br>
    In the meantime, rest well and stay hydrated. If symptoms worsen, please consult a doctor through our "Doctor Connect" feature.`;
}

function sendQuickMessage(message) {
  const input = document.getElementById("ai-prompt-input");
  if (input) {
    input.value = message;
    handleAiRequest();
  } else {
    // Fallback for older UI if any
    const oldInput = document.getElementById("chatInput");
    if (oldInput) {
      oldInput.value = message;
      // Note: We don't have a generic sendMessage anymore, everything uses handleAiRequest
      handleAiRequest();
    }
  }
}

function heroChat(input) {
  if (event.key === "Enter") {
    showSection("ai-assistant");
    setTimeout(() => {
      const aiInput = document.getElementById("ai-prompt-input");
      if (aiInput) {
        aiInput.value = input.value;
        handleAiRequest();
      }
    }, 500);
  }
}

function clearChat() {
  const container = document.getElementById("ai-response-area");
  if (container) {
    container.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-purple-600"></i>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[80%]">
                <p class="text-gray-800">Chat cleared. How can I help you today?</p>
            </div>
        </div>
    `;
  }
}

// AI Language and Voice Functions
function updateAILanguage() {
  const select = document.getElementById("aiLanguageSelect");
  if (select) {
    aiLanguage = select.value;
    currentLanguage = select.value; // Sync with voice language
    console.log("AI Language updated to:", aiLanguage);

    // Update welcome message if chat is empty or contains the default welcome
    const container = document.getElementById("ai-response-area");
    if (container && (container.children.length <= 1)) {
      container.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-purple-600"></i>
                </div>
                <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[80%]">
                    <p class="text-gray-800">${getLocalizedWelcome(aiLanguage)}</p>
                </div>
            </div>
        `;
    }

    showNotification(`Sanjeevani will now speak in ${select.options[select.selectedIndex].text}`, "info");
  }
}

function getLocalizedWelcome(lang) {
  const welcomes = {
    'en': "Namaste! I am Dr. Sanjeevani. How can I assist you with your health today?",
    'hi': "नमस्ते! मैं डॉ. संजीवनी हूँ। आज मैं आपके स्वास्थ्य में कैसे सुधार कर सकती हूँ?",
    'ta': "வணக்கம்! நான் டாக்டர் சஞ்சீவனி. இன்று உங்கள் ஆரோக்கியத்திற்கு நான் எப்படி உதவ முடியும்?",
    'te': "నమస్తే! నేను డాక్టర్ సంజీవని. ఈరోజు మీ ఆరోగ్య విషయంలో నేను మీకు ఎలా సహాయపడగలను?",
    'bn': "নমস্কার! আমি ডক্টর সঞ্জীবনী। আজ আমি আপনার স্বাস্থ্যের জন্য কীভাবে সাহায্য করতে পারি?",
    'mr': "नमस्ते! मी डॉ. संजीवनी आहे. आज मी तुमच्या आरोग्यासाठी कशी मदत करू शकते?"
  };
  return welcomes[lang] || welcomes['en'];
}

// Voice Functions
function toggleVoiceInput() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showNotification("Speech recognition is not supported in this browser.", "error");
    return;
  }

  const voiceModal = document.getElementById("voiceModal");
  if (voiceModal) {
    voiceModal.classList.remove("hidden");
    startListening();
  }
}

let recognition = null;
let isStarting = false; // Tracks if voice recognition is in the process of starting

function startListening() {
  // If already listening or starting, abort the current instance first
  if ((isListening || isStarting) && recognition) {
    isIntentionalStop = true;
    try {
      recognition.abort();
    } catch (e) {
      console.warn("Error aborting previous recognition:", e);
    }
    isListening = false;
    isStarting = false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showNotification("Speech recognition is not supported in this browser.", "error");
    closeVoiceModal();
    return;
  }

  recognition = new SpeechRecognition();

  // Map our language codes to recognition locales
  const langMap = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'bn': 'bn-IN',
    'mr': 'mr-IN'
  };

  recognition.lang = langMap[aiLanguage] || 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    isStarting = false;
    isIntentionalStop = false;
    console.log("Speech recognition started");
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const input = document.getElementById("ai-prompt-input");
    if (input) {
      input.value = text;
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isStarting = false;
    isListening = false;

    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      showNotification(`Voice Error: ${event.error}`, "error");
    } else if (event.error === 'aborted' && !isIntentionalStop) {
      // Only show aborted if it wasn't triggered by our own logic
      showNotification("Voice session interrupted.", "warning");
    }
    closeVoiceModal();
  };

  recognition.onend = () => {
    isListening = false;
    isStarting = false;
    if (!isIntentionalStop) {
      closeVoiceModal();
    }
  };

  try {
    isStarting = true;
    recognition.start();
  } catch (e) {
    console.error("Failed to start speech recognition:", e);
    isStarting = false;
    showNotification("Wait a moment before trying again.", "warning");
    closeVoiceModal();
  }
}

function closeVoiceModal() {
  if (isListening && recognition) {
    isIntentionalStop = true;
    recognition.stop();
  }
  document.getElementById("voiceModal").classList.add("hidden");
  isListening = false;
}

function processVoice() {
  closeVoiceModal();
  handleAiRequest();
}

function speakResponse(element) {
  if (!('speechSynthesis' in window)) {
    showNotification("Speech synthesis is not supported.", "error");
    return;
  }

  // Stop any current speaking
  window.speechSynthesis.cancel();

  // Handle both string and element input
  let text = "";
  if (typeof element === 'string') {
    text = element.replace(/<[^>]*>/g, "");
  } else if (element && (element.innerText || element.textContent)) {
    text = element.innerText || element.textContent;
  }

  if (!text) return;

  const performSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);

    // Map our language codes to speech synthesis locales
    const langMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN'
    };

    utterance.lang = langMap[aiLanguage] || 'en-IN';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();

    // 1. Try to find a highly specific female voice for the language
    const femaleKeywords = ['female', 'samantha', 'zira', 'veena', 'priya', 'kalpana', 'shravani', 'lekha'];
    let preferredVoice = voices.find(v =>
      v.lang.replace('_', '-').startsWith(utterance.lang) &&
      femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))
    );

    // 2. Fallback: Try "Google" or "Natural" female-sounding voices for the language
    if (!preferredVoice) {
      preferredVoice = voices.find(v =>
        v.lang.replace('_', '-').startsWith(utterance.lang) &&
        (v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('natural'))
      );
    }

    // 3. Fallback: Any voice for that language
    if (!preferredVoice) {
      preferredVoice = voices.find(v => v.lang.replace('_', '-').startsWith(utterance.lang));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // If voices are empty, wait for them to load
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', performSpeak, { once: true });
  } else {
    performSpeak();
  }
}

function startVoiceChat() {
  showSection("ai-assistant");
  toggleVoiceInput();
}

// Emergency Functions
function triggerSOS() {
  document.getElementById("sosModal").classList.remove("hidden");
  const container = document.getElementById("sosEmergencyContacts");
  const locationStatus = document.getElementById("sosLocationStatus");

  if (container)
    container.innerHTML =
      '<p class="text-xs text-center text-gray-400 py-2">Loading contacts...</p>';
  if (locationStatus) {
    locationStatus.textContent = "Detecting...";
    locationStatus.className = "text-yellow-600 font-bold";
  }

  const handleSuccess = (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    lastKnownLocation = { lat, lng, timestamp: new Date().getTime() };
    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    if (locationStatus) {
      locationStatus.textContent = "Active";
      locationStatus.className = "text-green-600 font-bold";
    }
    renderSOSContacts(locationLink, true);
  };

  const handleFailure = (error) => {
    console.error("SOS Geolocation error:", error);

    if (lastKnownLocation) {
      const { lat, lng, timestamp } = lastKnownLocation;
      const ageSeconds = Math.round((new Date().getTime() - timestamp) / 1000);
      let ageText =
        ageSeconds < 60
          ? `${ageSeconds}s ago`
          : ageSeconds < 3600
            ? `${Math.round(ageSeconds / 60)}m ago`
            : `${Math.round(ageSeconds / 3600)}h ago`;

      if (locationStatus) {
        locationStatus.textContent = `Last known (${ageText})`;
        locationStatus.className = "text-blue-600 font-bold text-sm text-right";
      }
      renderSOSContacts(`https://www.google.com/maps?q=${lat},${lng}`, true);
      return;
    }

    let errorMsg = "Unavailable";
    if (error.code === 1) errorMsg = "Permission Denied";
    else if (error.code === 3) errorMsg = "Timeout";

    if (locationStatus) {
      locationStatus.textContent = errorMsg;
      locationStatus.className = "text-red-500 font-bold";
    }
    renderSOSContacts(null, true);
  };

  if (navigator.geolocation) {
    // Attempt 1: High Accuracy (8s timeout)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        console.warn("High accuracy failed, trying coarse location...", err);
        // Attempt 2: Coarse accuracy (more reliable)
        navigator.geolocation.getCurrentPosition(handleSuccess, handleFailure, {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 60000,
        });
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 },
    );
  } else {
    handleFailure({ code: 0, message: "Not supported" });
  }
}

function renderSOSContacts(locationLink, autoTrigger = false) {
  const container = document.getElementById("sosEmergencyContacts");
  const contacts = JSON.parse(localStorage.getItem("emergencyContacts") || "[]");

  if (!container) return;

  if (contacts.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 bg-gray-50 rounded-xl">
                <p class="text-xs text-gray-500 mb-2">No emergency contacts found.</p>
                <button onclick="closeSOS(); toggleProfile();" class="text-xs font-bold text-purple-600 hover:text-purple-700">
                    <i class="fas fa-plus mr-1"></i>Add Contacts in Profile
                </button>
            </div>
        `;
    return;
  }

  // Automate first contact notification if requested
  if (autoTrigger && contacts.length > 0) {
    const primary = contacts[0];
    const message = `EMERGENCY! I need help. My current location is: ${locationLink || "Unavailable (Please send your location manually!)"}`;
    const encodedMsg = encodeURIComponent(message);
    const waLink = `https://wa.me/${primary.phone.replace(/\D/g, "")}?text=${encodedMsg}`;

    // 1. Try Capacitor Background SMS (Silent/Truly Automatic)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SMS) {
      window.Capacitor.Plugins.SMS.send({
        numbers: contacts.map(c => c.phone.replace(/\D/g, "")),
        text: message
      }).then(() => console.log("Background SMS sent")).catch(err => console.error(err));
    } else {
      // Fallback: Automated SMS App opening (One-click)
      const smsLink = `sms:${primary.phone}?body=${encodedMsg}`;
      window.location.href = smsLink;
    }

    // 2. Trigger WhatsApp (Always requires clicking 'Send' for security)
    setTimeout(() => {
      window.open(waLink, "_blank");
    }, 1500);
  }

  container.innerHTML = contacts
    .map((contact) => {
      const message = `EMERGENCY! I need help. My current location is: ${locationLink || "Unavailable (Please send your location manually!)"}`;
      const encodedMsg = encodeURIComponent(message);
      const waLink = `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodedMsg}`;
      const smsLink = `sms:${contact.phone}?body=${encodedMsg}`;

      return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div class="flex-1">
                    <p class="text-sm font-bold text-gray-800">${contact.name}</p>
                    <p class="text-[10px] text-gray-500">${contact.phone}</p>
                </div>
                <div class="flex gap-2">
                    <a href="${waLink}" target="_blank" class="w-9 h-9 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition shadow-sm">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <a href="${smsLink}" class="w-9 h-9 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition shadow-sm">
                        <i class="fas fa-sms"></i>
                    </a>
                </div>
            </div>
        `;
    })
    .join("");
}

function closeSOS() {
  document.getElementById("sosModal").classList.add("hidden");
}

// Medicine Analyzer Functions
function previewMedicineImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("medicine-preview").src = e.target.result;
      document
        .getElementById("medicine-preview-container")
        .classList.remove("hidden");
      document.getElementById("medicine-upload-area").classList.add("hidden");
      document.getElementById("medicine-results").classList.add("hidden");
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function resetMedicineUpload() {
  document.getElementById("medicine-file-input").value = "";
  document.getElementById("medicine-preview").src = "";
  document.getElementById("medicine-preview-container").classList.add("hidden");
  document.getElementById("medicine-upload-area").classList.remove("hidden");
  document.getElementById("medicine-results").classList.add("hidden");
}

async function analyzeMedicine() {
  const preview = document.getElementById("medicine-preview");
  const loading = document.getElementById("analyzer-loading");
  const resultsArea = document.getElementById("medicine-results");
  const analyzeBtn = document.getElementById("analyze-btn");

  if (!preview.src) {
    showNotification("Please upload an image first", "error");
    return;
  }

  loading.classList.remove("hidden");
  resultsArea.classList.add("hidden");
  document.getElementById("medicine-preview-container").classList.add("hidden");
  analyzeBtn.disabled = true;

  try {
    const response = await fetch("/api/analyze-medicine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: preview.src }),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      throw new Error(
        `Server returned unexpected format (Status: ${response.status}). If the image is too large, try a smaller one.`,
      );
    }

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || `Server error: ${response.status}`);

    if (data.error) {
      showNotification(data.error, "warning");
      loading.classList.add("hidden");
      analyzeBtn.disabled = false;
      return;
    }

    renderMedicineResults(data);
    resultsArea.classList.remove("hidden");
    showNotification("Analysis complete!", "success");
  } catch (error) {
    console.error("Medicine analysis error:", error);
    showNotification(error.message, "error");
  } finally {
    loading.classList.add("hidden");
    analyzeBtn.disabled = false;
  }
}

function renderMedicineResults(data) {
  const container = document.getElementById("medicine-results");

  const createList = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0)
      return "Not specified";
    return `<ul class="list-disc ml-5 space-y-1">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  };

  container.innerHTML = `
    <!-- Header: Medicine Identity -->
    <div class="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-2">
          <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <i class="fas fa-pills text-2xl text-white"></i>
          </div>
          <div>
            <h3 class="text-2xl font-black leading-tight">${data.medicineName || "Unknown Medicine"}</h3>
            <p class="text-purple-100 text-sm font-medium opacity-90">${data.composition || "Active ingredients not listed"}</p>
          </div>
        </div>
      </div>
      <i class="fas fa-prescription-bottle-alt absolute -right-4 -bottom-4 text-9xl text-white/10 transform -rotate-12"></i>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Left Column: Usage & Clinical Info -->
      <div class="space-y-6">
        <!-- Dosage Card -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
            <h4 class="font-bold text-gray-800 flex items-center">
              <i class="fas fa-clock mr-2 text-purple-600"></i>Usage
            </h4>
            <div class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold border border-green-100 max-w-[200px] text-center leading-tight">
              ${data.dosageFrequency || "As directed"}
            </div>
          </div>
          
          <div class="space-y-5">
            <div class="grid grid-cols-[80px_1fr] gap-4 items-start text-sm">
              <span class="text-gray-400 font-medium pt-0.5">Amount</span>
              <span class="font-bold text-gray-800 leading-snug">${data.recommendedDosage || "Consult doctor"}</span>
            </div>
            <div class="grid grid-cols-[80px_1fr] gap-4 items-start text-sm">
              <span class="text-gray-400 font-medium pt-0.5">Timing</span>
              <span class="font-bold text-gray-800 leading-snug">${data.whenToTake || "As advised"}</span>
            </div>
            <div class="bg-purple-50 rounded-2xl p-4 border border-purple-100 mt-2">
               <label class="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Suggested Schedule</label>
               <p class="text-purple-900 font-bold text-base leading-tight">${data.typicalSchedule || "Follow professional advice"}</p>
            </div>
          </div>
        </div>

        <!-- Medical Uses -->
        <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h5 class="font-bold text-gray-800 mb-3 flex items-center text-sm">
            <i class="fas fa-notes-medical mr-2 text-blue-500"></i>Primary Medical Uses
          </h5>
          <div class="text-sm text-gray-600">
            ${createList(data.medicalUses)}
          </div>
        </div>

        <!-- Side Effects -->
        <div class="bg-orange-50 rounded-2xl p-6 border border-orange-100">
          <h4 class="font-bold text-orange-800 mb-3 text-sm flex items-center">
            <i class="fas fa-vial mr-2"></i>Common Side Effects
          </h4>
          <div class="text-xs text-orange-900/80">
            ${createList(data.commonSideEffects || data.sideEffects)}
          </div>
        </div>
      </div>

      <!-- Right Column: Safety & Precautions -->
      <div class="space-y-6">
        <!-- Safety Card (Merged) -->
        <div class="bg-red-50 rounded-3xl p-6 border border-red-100 shadow-sm h-fit">
          <h4 class="font-bold text-red-800 mb-4 flex items-center">
            <i class="fas fa-triangle-exclamation mr-2"></i>Safety & Precautions
          </h4>
          <div class="text-sm text-red-700 leading-relaxed">
            ${createList(data.safetyPrecautions || (Array.isArray(data.warnings) ? [...data.warnings, ...(data.whoShouldNotTake || [])] : data.warnings))}
          </div>
        </div>

        <!-- Age Group & Storage - Compact -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h5 class="font-bold text-gray-800 mb-2 text-[10px] uppercase tracking-widest text-indigo-500">Age Group</h5>
            <p class="text-xs text-gray-600 font-bold">${data.suitableAgeGroup || "See instructions"}</p>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h5 class="font-bold text-gray-800 mb-2 text-[10px] uppercase tracking-widest text-teal-500">Storage</h5>
            <p class="text-[10px] text-gray-600 leading-tight">${data.storageInstructions || "Store in cool, dry place."}</p>
          </div>
        </div>

        <!-- Disclaimer Link Hint -->
        <div class="text-[10px] text-gray-400 text-center italic mt-4">
          Scroll down to read the full medical disclaimer.
        </div>
      </div>
    </div>
  `;
}

// Pharmacy Finder Functions
function initPharmacyMap() {
  if (pharmacyMap) {
    pharmacyMap.remove();
    pharmacyMap = null;
  }

  pharmacyMap = L.map("pharmacy-map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(pharmacyMap);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const radius = document.getElementById("radius-range").value;

        lastKnownLocation = { lat, lng, timestamp: new Date().getTime() };
        pharmacyMap.setView([lat, lng], 14);

        L.circle([lat, lng], {
          radius: parseInt(radius),
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
        }).addTo(pharmacyMap);

        const userIcon = L.divIcon({
          className: "user-marker",
          html: '<div class="user-marker-icon" style="width: 20px; height: 20px;"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([lat, lng], { icon: userIcon })
          .addTo(pharmacyMap)
          .bindPopup("Your Location");

        fetchNearbyPharmacies(lat, lng, radius);
      },
      () => {
        showNotification("Location access denied.", "warning");
      },
    );
  }
}

async function fetchNearbyPharmacies(lat, lng, radius) {
  const listContainer = document.getElementById("pharmacy-list");
  listContainer.innerHTML =
    ' <div class="text-center p-8"><i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i><p class="mt-2 text-gray-500">Searching...</p></div>';

  try {
    const response = await fetch(
      `/api/nearby-pharmacies?lat=${lat}&lon=${lng}&radius=${radius}`,
    );
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Search failed");

    listContainer.innerHTML = "";

    if (data.pharmacies.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center p-8">
          <p class="text-gray-500 mb-4">No pharmacy stores found checkout hospital medicine centers</p>
          <button onclick="showSection('emergency'); setTimeout(initMap, 100);" class="px-6 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition">
            <i class="fas fa-hospital mr-2"></i>Nearby hospitals
          </button>
        </div>`;
      return;
    }

    const pharmacyIcon = L.divIcon({
      className: "pharmacy-marker",
      html: '<div class="hospital-marker-icon" style="width: 30px; height: 30px; background-color: #3b82f6;"><i class="fas fa-prescription-bottle-alt"></i></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    data.pharmacies.forEach((p) => {
      // Calculate distance
      const dist = pharmacyMap.distance([lat, lng], [p.lat, p.lon]);
      const distanceText = (dist / 1000).toFixed(1) + " km";

      // Add marker
      const marker = L.marker([p.lat, p.lon], { icon: pharmacyIcon }).addTo(
        pharmacyMap,
      );

      const popupContent = `
        <div class="popup-header" style="background: #3b82f6;">${p.name}</div>
        <div class="popup-body">
          <p class="text-sm mb-1"><b>Distance:</b> ${distanceText}</p>
          <p class="text-sm mb-2"><b>Status:</b> ${p.opening_hours}</p>
          <button onclick="getDirections(${p.lat}, ${p.lon})" class="popup-btn" style="color: #3b82f6; background: #eff6ff;">
            <i class="fas fa-directions mr-1"></i> Directions
          </button>
        </div>
      `;
      marker.bindPopup(popupContent);

      // Add to list
      const item = document.createElement("div");
      item.className =
        "bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-blue-300 transition-all cursor-pointer group";
      item.onclick = () => {
        pharmacyMap.setView([p.lat, p.lon], 16);
        marker.openPopup();
      };
      item.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h4 class="font-bold text-gray-800 group-hover:text-blue-600 transition">${p.name}</h4>
            <p class="text-xs text-gray-500 mb-2 truncate">${p.address}</p>
            <div class="flex gap-2">
              <span class="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">${distanceText}</span>
              <span class="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full">${p.opening_hours === "Not available" ? "Open" : p.opening_hours}</span>
            </div>
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" class="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition">
            <i class="fas fa-directions"></i>
          </a>
        </div>
      `;
      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error("Pharmacy fetch error:", error);
    listContainer.innerHTML = `<div class="text-center p-8 text-red-500">Error: ${error.message}</div>`;
  }
}

function centerOnUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      pharmacyMap.setView([lat, lng], 15);
    });
  }
}

// Map Functions
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  if (map) {
    try {
      map.remove();
    } catch (e) {
      console.error("Error removing old map:", e);
    }
    map = null;
  }

  // Show loading indicator in map div
  mapElement.innerHTML =
    '<div class="flex items-center justify-center h-full bg-gray-100 text-gray-500 rounded-xl"><i class="fas fa-spinner fa-spin mr-2"></i> Initializing Map...</div>';

  setTimeout(() => {
    try {
      mapElement.innerHTML = ""; // Clear loader
      map = L.map("map").setView([20.5937, 78.9629], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Get User Location
      if (navigator.geolocation) {
        showNotification("Locating you...", "info");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            lastKnownLocation = { lat, lng, timestamp: new Date().getTime() };
            map.setView([lat, lng], 14);

            const userIcon = L.divIcon({
              className: "user-marker",
              html: '<div class="user-marker-icon" style="width: 20px; height: 20px;"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.marker([lat, lng], { icon: userIcon })
              .addTo(map)
              .bindPopup('<div class="popup-header">You are Here</div>')
              .openPopup();

            fetchNearbyHospitals(lat, lng);
          },
          (err) => {
            console.error("Geolocation error:", err);
            showNotification(
              "Location access denied. Using default location.",
              "warning",
            );
            const defaultLat = 28.6139;
            const defaultLng = 77.209;
            map.setView([defaultLat, defaultLng], 13);
            fetchNearbyHospitals(defaultLat, defaultLng);
          },
          { timeout: 10000 },
        );
      } else {
        const defaultLat = 28.6139;
        const defaultLng = 77.209;
        map.setView([defaultLat, defaultLng], 13);
        fetchNearbyHospitals(defaultLat, defaultLng);
      }
    } catch (err) {
      console.error("Leaflet init error:", err);
      mapElement.innerHTML = `<div class="p-4 text-red-500 text-sm">Failed to initialize map: ${err.message}</div>`;
    }
  }, 200);
}

async function fetchNearbyHospitals(lat, lng) {
  const hospitalList = document.getElementById("hospitalList");
  hospitalList.innerHTML =
    '<div class="text-center p-4"><i class="fas fa-spinner fa-spin text-purple-600 text-2xl"></i><p class="mt-2 text-gray-600">Finding nearby hospitals...</p></div>';

  try {
    const response = await fetch(
      `/api/nearby-hospitals?lat=${lat}&lon=${lng}&radius=5000`,
    );

    if (!response.ok) {
      throw new Error(`Server returned error ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    hospitalList.innerHTML = "";

    if (!data.hospitals || data.hospitals.length === 0) {
      hospitalList.innerHTML =
        '<div class="text-center p-4 text-gray-500">No hospitals found within 5km. Try moving the map or checking later.</div>';
      return;
    }

    const hospitalIcon = L.divIcon({
      className: "hospital-marker",
      html: '<div class="hospital-marker-icon" style="width: 30px; height: 30px;"><i class="fas fa-hospital"></i></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    data.hospitals.forEach((hospital) => {
      const hospitalLat = hospital.lat;
      const hospitalLng = hospital.lon;
      const name = hospital.name;
      const address = hospital.address;
      const phone = hospital.phone;

      // Calculate distance
      const distMeters = map.distance([lat, lng], [hospitalLat, hospitalLng]);
      const distance = (distMeters / 1000).toFixed(1);

      // Add Marker
      const marker = L.marker([hospitalLat, hospitalLng], {
        icon: hospitalIcon,
      }).addTo(map);

      const popupContent = `
                <div class="">
                    <div class="popup-header">
                        ${name}
                    </div>
                    <div class="popup-body">
                        <p class="text-sm text-gray-600 mb-2"><i class="fas fa-map-marker-alt mr-1"></i> ${address}</p>
                        <p class="text-sm text-gray-600 mb-2"><i class="fas fa-phone mr-1"></i> ${phone}</p>
                        <p class="text-xs font-bold text-blue-600 mb-2">${distance} km away</p>
                        <button onclick="getDirections(${hospitalLat}, ${hospitalLng})" class="popup-btn">
                            <i class="fas fa-directions mr-1"></i> Get Directions
                        </button>
                    </div>
                </div>
            `;

      marker.bindPopup(popupContent);

      // Add to List
      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border border-gray-200 mb-2";
      div.onclick = () => {
        map.setView([hospitalLat, hospitalLng], 16);
        marker.openPopup();
      };

      div.innerHTML = `
                <div class="flex-1">
                    <div class="font-bold text-gray-800">${name}</div>
                    <div class="text-xs text-gray-500 mb-1">${address}</div>
                    <div class="text-sm text-blue-600 font-medium"><i class="fas fa-route mr-1"></i>${distance} km</div>
                </div>
                ${phone !== "Not Available"
          ? `
                <a href="tel:${phone}" onclick="event.stopPropagation()" class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 shadow-md transform hover:scale-105 transition ml-2">
                    <i class="fas fa-phone"></i>
                </a>`
          : ""
        }
            `;
      hospitalList.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    hospitalList.innerHTML =
      `<div class="text-center p-4 text-red-500">
        <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
        <p>Failed to load hospitals: ${error.message}</p>
        <button onclick="centerOnUser()" class="mt-2 text-blue-600 font-bold hover:underline">Retry Search</button>
      </div>`;
  }
}

function getDirections(lat, lng) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    "_blank",
  );
}

// Medicine Functions
function takeMedicine(btn) {
  const card = btn.closest(".medicine-card");
  card.classList.add("taken");
  btn.innerHTML = '<i class="fas fa-check-double"></i>';
  btn.classList.add("bg-green-500", "text-white", "border-green-500");
  btn.disabled = true;

  showNotification("Medicine marked as taken!", "success");

  // Update adherence chart
  updateAdherenceChart();
}

function addMedicine() {
  document.getElementById("medicineReminderModal").classList.remove("hidden");
}

function closeMedicineModal() {
  document.getElementById("medicineReminderModal").classList.add("hidden");
  document.getElementById("medicineForm").reset();
}

function saveMedicineFromModal() {
  const name = document.getElementById("medicineNameInput").value;
  const time = document.getElementById("medicineTimeInput").value;

  if (name && time) {
    const list = document.getElementById("medicineList");
    const div = document.createElement("div");
    div.className =
      "medicine-card bg-gray-50 rounded-xl p-4 border-l-4 border-gray-400";
    div.setAttribute("data-time", time); // Add data-time attribute for reminders
    div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-pills text-gray-500"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${name}</h4>
                        <span class="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded mt-1 inline-block">${time}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="deleteMedicine(this)" class="w-10 h-10 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition flex items-center justify-center">
                        <i class="fas fa-trash-alt text-sm"></i>
                    </button>
                    <button onclick="takeMedicine(this)" class="w-12 h-12 rounded-full border-2 border-gray-400 hover:bg-gray-400 hover:text-white transition flex items-center justify-center text-gray-400">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;
    list.appendChild(div);
    closeMedicineModal();
    updateAdherenceChart();
    showNotification("Medicine reminder added!", "success");
  } else {
    showNotification("Please enter both medicine name and time.", "error");
  }
}
function deleteMedicine(btn) {
  showConfirmModal(
    "Delete Reminder?",
    "Are you sure you want to remove this medicine reminder?",
    () => {
      const card = btn.closest(".medicine-card");
      if (card) {
        card.remove();
        showNotification("Medicine reminder deleted!", "success");
      }
    }
  );
}
function checkMedicineReminders() {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  document.querySelectorAll(".medicine-card").forEach((card) => {
    const medTime = card.getAttribute("data-time");
    if (medTime === currentTime && !card.classList.contains("taken")) {
      const medName = card.querySelector("h4").textContent;
      showNotification(`Time to take your medicine: ${medName}`, "warning");

      // Play reminder sound
      if ("speechSynthesis" in window) {
        const msg = new SpeechSynthesisUtterance(`Medicine reminder: Time to take your ${medName}`);
        window.speechSynthesis.speak(msg);
      }
    }
  });
}

// Diet Generator
function generateDiet() {
  const condition = document.getElementById("dietCondition").value;
  const region = document.getElementById("dietRegion").value;

  if (!condition) {
    showNotification("Please select a health condition", "error");
    return;
  }

  document.getElementById("dietPlan").classList.remove("hidden");

  // Customize based on condition
  const breakfast = document.getElementById("breakfastList");
  const lunch = document.getElementById("lunchList");
  const dinner = document.getElementById("dinnerList");
  const tips = document.getElementById("nutritionTips");

  if (condition === "diabetes") {
    breakfast.innerHTML = `
            <li>• 1 cup oats/upma with vegetables (no sugar)</li>
            <li>• 1 boiled egg or sprouts</li>
            <li>• Green tea without sugar</li>
        `;
    lunch.innerHTML = `
            <li>• 2 chapatis (multigrain)</li>
            <li>• Mixed dal (less oil)</li>
            <li>• Large bowl of cucumber-tomato salad</li>
            <li>• 1 cup buttermilk</li>
        `;
    dinner.innerHTML = `
            <li>• 1 chapati or 1/2 cup brown rice</li>
            <li>• Bitter gourd (karela) sabzi</li>
            <li>• Clear vegetable soup</li>
        `;
  } else if (condition === "pregnancy") {
    breakfast.innerHTML = `
            <li>• 2 chapatis with ghee</li>
            <li>• 1 glass milk with saffron</li>
            <li>• 1 banana or seasonal fruit</li>
        `;
    tips.innerHTML += `<li>• Take iron and folic acid supplements daily</li>`;
  }

  showNotification("Personalized diet plan generated!", "success");
}

// Report Analyzer
function analyzeReport(input) {
  if (input.files && input.files[0]) {
    showNotification("Uploading and analyzing report...", "info");

    setTimeout(() => {
      document.getElementById("analysisResult").classList.remove("hidden");
      showNotification("Analysis complete!", "success");
    }, 2000);
  }
}

// Doctor Consultation
function startConsultation(doctorName) {
  showNotification(`Connecting to ${doctorName}...`, "info");
  setTimeout(() => {
    alert(
      `Video consultation started with ${doctorName}\n\nIn a real app, this would open a secure video call interface.`,
    );
  }, 1500);
}

// Language Support
function updateAILanguage() {
  const select = document.getElementById("aiLanguageSelect");
  aiLanguage = select.value;
  const langName = select.options[select.selectedIndex].text;
  showNotification(`AI will now respond in ${langName}`, "success");
}

function initCharts() {
  // Adherence Chart
  const ctx = document.getElementById("adherenceChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Medicine Taken",
            data: [2, 3, 2, 3, 3, 2, 3],
            backgroundColor: "rgba(234, 179, 8, 0.8)",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 3 },
        },
      },
    });
  }
}

function updateDashboardCharts() {
  const ctx = document.getElementById("healthTrendChart");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Blood Sugar",
            data: [110, 105, 120, 115, 110, 108, 112],
            borderColor: "rgb(147, 51, 234)",
            tension: 0.4,
          },
          {
            label: "Blood Pressure",
            data: [120, 118, 122, 119, 121, 118, 120],
            borderColor: "rgb(59, 130, 246)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });
  }
}

function updateAdherenceChart() {
  // Update chart data in real app
}

// Stats Animation
function animateStats() {
  const stats = [
    { id: "statUsers", target: 50000, suffix: "+" },
    { id: "statConsultations", target: 125000, suffix: "+" },
    { id: "statDoctors", target: 2500, suffix: "+" },
    { id: "statLives", target: 100000, suffix: "+" },
  ];

  stats.forEach((stat) => {
    const element = document.getElementById(stat.id);
    if (element) {
      let current = 0;
      const increment = stat.target / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.target) {
          current = stat.target;
          clearInterval(timer);
        }
        element.textContent =
          Math.floor(current).toLocaleString() + stat.suffix;
      }, 20);
    }
  });
}
// Notifications
function showNotification(message, type = "info") {
  const div = document.createElement("div");
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  div.className = `fixed top-24 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in`;
  div.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === "success" ? "fa-check" : type === "error" ? "fa-times" : "fa-info-circle"} mr-2"></i>
            ${message}
        </div>
    `;

  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Profile Functions
let emergencyContactIdCounter = 3; // Start from 3 since we have 2 default contacts

function toggleProfile() {
  const panel = document.getElementById("profilePanel");
  panel.classList.remove("translate-x-full");
}

function closeProfile() {
  const panel = document.getElementById("profilePanel");
  panel.classList.add("translate-x-full");
}

function toggleEditMode(section) {
  const viewDiv = document.getElementById(section + "View");
  const editDiv = document.getElementById(section + "Edit");

  if (viewDiv && editDiv) {
    viewDiv.classList.toggle("hidden");
    editDiv.classList.toggle("hidden");
  }
}

function cancelEdit(section) {
  const viewDiv = document.getElementById(section + "View");
  const editDiv = document.getElementById(section + "Edit");

  if (viewDiv && editDiv) {
    viewDiv.classList.remove("hidden");
    editDiv.classList.add("hidden");
  }
}

function savePersonalInfo() {
  // Get values from edit fields
  const name = document.getElementById("editName").value;
  const age = document.getElementById("editAge").value;
  const gender = document.getElementById("editGender").value;
  const bloodGroup = document.getElementById("editBloodGroup").value;
  const phone = document.getElementById("editPhone").value;
  const email = document.getElementById("editEmail").value;

  // Update view fields
  document.getElementById("viewName").textContent = name;
  document.getElementById("viewAge").textContent = age;
  document.getElementById("viewGender").textContent = gender;
  document.getElementById("viewBloodGroup").textContent = bloodGroup;
  document.getElementById("viewPhone").textContent = phone;
  document.getElementById("viewEmail").textContent = email;

  // Update header display
  document.getElementById("profileNameDisplay").textContent = name;
  document.getElementById("profileAgeGenderDisplay").textContent =
    `${age} years • ${gender}`;

  // Hide edit mode
  cancelEdit("personal");

  // Save to localStorage
  const profileData = { name, age, gender, bloodGroup, phone, email };
  localStorage.setItem("profileData", JSON.stringify(profileData));

  showNotification("Profile updated successfully!", "success");
}

function saveMedicalInfo() {
  // Get values from edit fields
  const height = document.getElementById("editHeight").value;
  const weight = document.getElementById("editWeight").value;
  const conditions = document.getElementById("editConditions").value;
  const allergies = document.getElementById("editAllergies").value;
  const medications = document.getElementById("editMedications").value;

  // Update view fields
  document.getElementById("viewHeightWeight").textContent =
    `${height} cm • ${weight} kg`;
  document.getElementById("viewConditions").textContent = conditions;
  document.getElementById("viewAllergies").textContent = allergies;
  document.getElementById("viewMedications").textContent = medications;

  // Hide edit mode
  cancelEdit("medical");

  // Save to localStorage
  const medicalData = { height, weight, conditions, allergies, medications };
  localStorage.setItem("medicalData", JSON.stringify(medicalData));

  showNotification("Medical history updated successfully!", "success");
}

function addEmergencyContact() {
  document.getElementById("contactModalTitle").textContent = "Add Emergency Contact";
  document.getElementById("editContactId").value = "";
  document.getElementById("contactForm").reset();
  document.getElementById("emergencyContactModal").classList.remove("hidden");
}

function closeContactModal() {
  document.getElementById("emergencyContactModal").classList.add("hidden");
}

function saveContactFromModal() {
  const name = document.getElementById("contactNameInput").value;
  const phone = document.getElementById("contactPhoneInput").value;
  const editId = document.getElementById("editContactId").value;

  if (editId) {
    // Editing existing contact
    const contactDiv = document.querySelector(`.emergency-contact[data-id="${editId}"]`);
    if (contactDiv) {
      contactDiv.querySelector(".contact-name").textContent = name;
      contactDiv.querySelector(".contact-phone").textContent = phone;
      showNotification("Contact updated!", "success");
    }
  } else {
    // Adding new contact
    const contactId = emergencyContactIdCounter++;
    const contactsList = document.getElementById("emergencyContactsList");

    const colors = ["bg-red-50", "bg-blue-50", "bg-green-50", "bg-yellow-50", "bg-purple-50"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const div = document.createElement("div");
    div.className = `flex items-center justify-between p-3 ${color} rounded-lg emergency-contact`;
    div.setAttribute("data-id", contactId);
    div.innerHTML = `
            <div class="flex-1">
                <p class="font-medium contact-name">${name}</p>
                <p class="text-sm text-gray-600 contact-phone">${phone}</p>
            </div>
            <button onclick="editEmergencyContact(${contactId})" class="text-gray-500 hover:text-purple-600 mr-2">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteEmergencyContact(${contactId})" class="text-gray-500 hover:text-red-600">
                <i class="fas fa-trash"></i>
            </button>
        `;
    contactsList.appendChild(div);
    showNotification("Emergency contact added!", "success");
  }

  saveEmergencyContacts();
  closeContactModal();
}

function editEmergencyContact(contactId) {
  const contactDiv = document.querySelector(`.emergency-contact[data-id="${contactId}"]`);
  if (!contactDiv) return;

  const name = contactDiv.querySelector(".contact-name").textContent;
  const phone = contactDiv.querySelector(".contact-phone").textContent;

  document.getElementById("contactModalTitle").textContent = "Edit Emergency Contact";
  document.getElementById("editContactId").value = contactId;
  document.getElementById("contactNameInput").value = name;
  document.getElementById("contactPhoneInput").value = phone;
  document.getElementById("emergencyContactModal").classList.remove("hidden");
}

function deleteEmergencyContact(contactId) {
  showConfirmModal(
    "Delete Contact?",
    "Are you sure you want to remove this emergency contact?",
    () => {
      const contactDiv = document.querySelector(`.emergency-contact[data-id="${contactId}"]`);
      if (contactDiv) {
        contactDiv.remove();
        saveEmergencyContacts();
        showNotification("Contact deleted!", "success");
      }
    }
  );
}

// Custom Confirmation Modal Logic
let confirmCallback = null;

function showConfirmModal(title, message, onConfirm) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  confirmCallback = onConfirm;
  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
  confirmCallback = null;
}

// Attach listener to Yes button once
document.addEventListener("DOMContentLoaded", () => {
  const yesBtn = document.getElementById("confirmYesBtn");
  if (yesBtn) {
    yesBtn.addEventListener("click", () => {
      if (confirmCallback) confirmCallback();
      closeConfirmModal();
    });
  }
});

function saveEmergencyContacts() {
  const contacts = [];
  document.querySelectorAll(".emergency-contact").forEach((contact) => {
    const id = contact.getAttribute("data-id");
    const name = contact.querySelector(".contact-name").textContent;
    const phone = contact.querySelector(".contact-phone").textContent;
    contacts.push({ id, name, phone });
  });
  localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
}

function loadProfileData() {
  // Load personal data
  const profileData = localStorage.getItem("profileData");
  if (profileData) {
    const data = JSON.parse(profileData);
    document.getElementById("viewName").textContent = data.name;
    document.getElementById("editName").value = data.name;
    document.getElementById("viewAge").textContent = data.age;
    document.getElementById("editAge").value = data.age;
    document.getElementById("viewGender").textContent = data.gender;
    document.getElementById("editGender").value = data.gender;
    document.getElementById("viewBloodGroup").textContent = data.bloodGroup;
    document.getElementById("editBloodGroup").value = data.bloodGroup;
    document.getElementById("viewPhone").textContent = data.phone;
    document.getElementById("editPhone").value = data.phone;
    document.getElementById("viewEmail").textContent = data.email;
    document.getElementById("editEmail").value = data.email;
    document.getElementById("profileNameDisplay").textContent = data.name;
    document.getElementById("profileAgeGenderDisplay").textContent =
      `${data.age} years • ${data.gender}`;
  }

  // Load medical data
  const medicalData = localStorage.getItem("medicalData");
  if (medicalData) {
    const data = JSON.parse(medicalData);
    document.getElementById("viewHeightWeight").textContent =
      `${data.height} cm • ${data.weight} kg`;
    document.getElementById("editHeight").value = data.height;
    document.getElementById("editWeight").value = data.weight;
    document.getElementById("viewConditions").textContent = data.conditions;
    document.getElementById("editConditions").value = data.conditions;
    document.getElementById("viewAllergies").textContent = data.allergies;
    document.getElementById("editAllergies").value = data.allergies;
    document.getElementById("viewMedications").textContent = data.medications;
    document.getElementById("editMedications").value = data.medications;
  }
}

function changeProfilePicture() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = document.getElementById("profileImage");
        const icon = document.getElementById("profileIcon");
        img.src = event.target.result;
        img.classList.remove("hidden");
        icon.classList.add("hidden");

        // Save to localStorage
        localStorage.setItem("profilePicture", event.target.result);
        showNotification("Profile picture updated!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  fileInput.click();
}

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope,
        );
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed: ", err);
      });
  });
}

function sendImage() {
  showNotification("Image upload feature coming soon!", "info");
}

// Data Download
function downloadHealthData() {
  showNotification("Generating Health Report...", "info");

  const profileData = {
    name: document.getElementById("viewName").textContent,
    age: document.getElementById("viewAge").textContent,
    gender: document.getElementById("viewGender").textContent,
    bloodGroup: document.getElementById("viewBloodGroup").textContent,
    phone: document.getElementById("viewPhone").textContent,
  };

  const medicalData = {
    conditions: document.getElementById("viewConditions").textContent,
    allergies: document.getElementById("viewAllergies").textContent,
    medications: document.getElementById("viewMedications").textContent,
  };

  const now = new Date();

  const element = document.createElement("div");
  element.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica', sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #6b21a8; margin: 0; font-size: 28px;">LifePulse Health Report</h1>
                <p style="color: #666; margin: 10px 0 0;">Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h2 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Patient Profile</h2>
                <table style="width: 100%; margin-top: 10px;">
                    <tr>
                        <td style="padding: 5px 0;"><strong>Name:</strong> ${profileData.name}</td>
                        <td style="padding: 5px 0;"><strong>Age/Gender:</strong> ${profileData.age}/${profileData.gender}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Blood Group:</strong> ${profileData.bloodGroup}</td>
                        <td style="padding: 5px 0;"><strong>Phone:</strong> ${profileData.phone}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Current Vitals</h2>
                <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                    <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px; width: 30%;">
                        <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${document.getElementById("heartRate") ? document.getElementById("heartRate").textContent : "--"}</div>
                        <div style="font-size: 12px; color: #666;">Heart Rate (bpm)</div>
                    </div>
                    <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px; width: 30%;">
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">120/80</div>
                        <div style="font-size: 12px; color: #666;">Blood Pressure</div>
                    </div>
                    <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px; width: 30%;">
                        <div style="font-size: 24px; font-weight: bold; color: #ea580c;">Active</div>
                        <div style="font-size: 12px; color: #666;">Status</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h2 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Medical Summary</h2>
                <p style="margin: 10px 0;"><strong>Medical Conditions:</strong><br> ${medicalData.conditions}</p>
                <p style="margin: 10px 0;"><strong>Allergies:</strong><br> ${medicalData.allergies}</p>
                <p style="margin: 10px 0;"><strong>Current Medications:</strong><br> ${medicalData.medications}</p>
            </div>

            <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p>This report is generated by LifePulse AI Healthcare Assistant.</p>
                <p>Consult a doctor for professional medical advice.</p>
            </div>
        </div>
    `;

  const opt = {
    margin: 0.5,
    filename: `LifePulse_Report_${now.toISOString().split("T")[0]}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      showNotification("Report downloaded successfully!", "success");
    })
    .catch((err) => {
      console.error("PDF Generation Error:", err);
      showNotification("Failed to generate report. Please try again.", "error");
    });
}

// Family Member Logic
function openAddMemberModal() {
  document.getElementById("addMemberModal").classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeAddMemberModal() {
  document.getElementById("addMemberModal").classList.add("hidden");
  document.body.classList.remove("no-scroll");
  document.getElementById("addMemberForm").reset();
}

function saveFamilyMember() {
  const memberData = {
    id: Date.now(),
    name: document.getElementById("memberFullNames").value,
    age: document.getElementById("memberAge").value,
    gender: document.getElementById("memberGender").value,
    relation: document.getElementById("memberRelation").value,
    bloodGroup: document.getElementById("memberBloodGroup").value,
    condition: document.getElementById("memberCondition").value || "None",
    healthScore: 75 + Math.floor(Math.random() * 25), // Simulate a health score
  };

  // Save to localStorage
  const members = JSON.parse(localStorage.getItem("familyMembers") || "[]");
  members.push(memberData);
  localStorage.setItem("familyMembers", JSON.stringify(members));

  // Render in UI
  renderFamilyMember(memberData);

  // Cleanup
  closeAddMemberModal();
  showNotification(`${memberData.name} added to family!`, "success");
}

function renderFamilyMember(member) {
  const list = document.getElementById("familyMembersList");
  if (!list) return;

  const card = document.createElement("div");
  card.className =
    "bg-white rounded-[2.5rem] p-6 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group animate-card-entry";
  card.setAttribute("data-id", member.id); // Add data-id for deletion

  card.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
            <div class="relative flex-shrink-0 mx-auto md:mx-0">
                <div class="avatar-ring" style="background: linear-gradient(45deg, #8b5cf6, #ec4899)">
                    <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white">
                        <i class="fas fa-${member.gender === "Female" ? "female" : "user"} text-4xl text-gray-400"></i>
                    </div>
                </div>
                <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-white"></div>
            </div>
            
            <div class="flex-1">
                <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2 text-center md:text-left">
                    <div>
                        <h4 class="text-2xl font-black text-gray-800">${member.name} (${member.relation})</h4>
                        <p class="text-gray-500 font-medium">${member.age} Years • ${member.bloodGroup} Positive</p>
                    </div>
                    <div class="flex items-center justify-center gap-2">
                        <div class="text-right hidden md:block">
                            <div class="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Health Score</div>
                            <div class="text-xl font-black text-green-600 leading-tight">${member.healthScore}/100</div>
                        </div>
                        <div class="health-ring-container">
                            <svg class="health-ring-svg w-full h-full" viewBox="0 0 36 36">
                                <circle class="health-ring-circle" stroke="#f3f4f6" cx="18" cy="18" r="16" />
                                <circle class="health-ring-circle" stroke="#10b981" stroke-dasharray="${member.healthScore}, 100" cx="18" cy="18" r="16" />
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold">${member.healthScore}%</div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div class="text-[10px] font-bold text-gray-400 uppercase">Status</div>
                        <div class="font-bold text-gray-800">Healthy</div>
                    </div>
                    <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div class="text-[10px] font-bold text-gray-400 uppercase">Condition</div>
                        <div class="font-bold text-gray-800 truncate">${member.condition}</div>
                    </div>
                    <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div class="text-[10px] font-bold text-gray-400 uppercase">Activity</div>
                        <div class="font-bold text-gray-800">Active</div>
                    </div>
                    <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div class="text-[10px] font-bold text-gray-400 uppercase">Consult</div>
                        <div class="font-bold text-pink-600">Available</div>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <button onclick="deleteFamilyMember(${member.id})" class="text-red-500 hover:text-red-700 text-sm font-medium">
                        <i class="fas fa-trash mr-1"></i> Delete Member
                    </button>
                </div>
            </div>
        </div>
    `;

  list.appendChild(card);
}

function deleteFamilyMember(memberId) {
  showConfirmModal(
    "Delete Family Member?",
    "Are you sure you want to remove this family member?",
    () => {
      let members = JSON.parse(localStorage.getItem("familyMembers") || "[]");
      members = members.filter((member) => member.id !== memberId);
      localStorage.setItem("familyMembers", JSON.stringify(members));

      const memberCard = document.querySelector(`#familyMembersList > div[data-id="${memberId}"]`);
      if (memberCard) {
        memberCard.remove();
        showNotification("Family member deleted!", "success");
      }
    }
  );
}

function loadFamilyMembers() {
  const members = JSON.parse(localStorage.getItem("familyMembers") || "[]");
  members.forEach((member) => renderFamilyMember(member));
}

async function handleLogout() {
  showConfirmModal(
    "Logout?",
    "Are you sure you want to sign out of LifePulse?",
    async () => {
      const { error } = await _supabase.auth.signOut();
      if (error) {
        showNotification("Error logging out: " + error.message, "error");
      } else {
        window.location.href = "auth.html";
      }
    }
  );
}

// --- Capacitor Plugin Support ---
// Note: OfflineAi plugin is accessed inside functions when needed (not at top level)
// to avoid errors when running in browser or before Capacitor is fully loaded

// --- Global State ---
// isOnline is already declared at the top of the file
let gemmaStatus = "unavailable"; // 'unavailable', 'initializing', 'ready'
let modelPath = "";

// --- Network and Status Handling ---
function updateUi(isOnlineParam, isGemmaInitialized, status) {
  // Update global state
  isOnline = isOnlineParam;

  // Get UI elements with proper null checks
  const offlineBar = document.getElementById("offlineBar");
  const downloadContainerEl = document.getElementById("download-container");
  const aiInteractionContainerEl = document.getElementById(
    "ai-interaction-container",
  );
  const networkStatusIndicatorEl = document.getElementById(
    "network-status-indicator",
  );
  console.log(
    "DIAGNOSTIC: Found network-status-indicator element:",
    networkStatusIndicatorEl,
  );
  const chatInputEl = document.getElementById("ai-prompt-input");
  const downloadButtonEl = document.getElementById("download-button");

  // Update status text display
  if (networkStatusIndicatorEl) {
    networkStatusIndicatorEl.textContent = status || "⚪ Initializing...";

    // Set color based on status content
    if (status && status.includes("Online")) {
      networkStatusIndicatorEl.style.color = "green";
    } else if (
      status &&
      status.includes("Offline") &&
      status.includes("Gemma")
    ) {
      networkStatusIndicatorEl.style.color = "blue";
    } else if (status && status.includes("Not Found")) {
      networkStatusIndicatorEl.style.color = "orange";
    } else {
      networkStatusIndicatorEl.style.color = "grey";
    }
  }

  // Update offline bar
  if (offlineBar) {
    offlineBar.style.display = isOnline ? "none" : "block";
  }

  // Determine if model is available for offline use
  const modelAvailable = isGemmaInitialized || isOnline;

  // Handle chat input state
  if (chatInputEl) {
    if (modelAvailable) {
      chatInputEl.disabled = false;
      chatInputEl.placeholder = isOnline
        ? "Ask me anything about your health..."
        : "Ask me anything (Offline Mode)...";
    } else {
      chatInputEl.disabled = true;
      chatInputEl.placeholder = "Download offline model to use AI assistant...";
    }
  }

  // Handle download button visibility
  // Show download button if the offline model is not ready.
  if (!isGemmaInitialized) {
    if (downloadContainerEl) downloadContainerEl.style.display = "block"; // Also, allow the main UI to be visible if online.
    if (isOnline) {
      if (aiInteractionContainerEl)
        aiInteractionContainerEl.style.display = "block";
    } else {
      if (aiInteractionContainerEl)
        aiInteractionContainerEl.style.display = "none";
    }
    gemmaStatus = "unavailable";
  } else {
    // If Gemma is initialized, always hide the download button and show the AI UI.
    if (downloadContainerEl) downloadContainerEl.style.display = "none";
    if (aiInteractionContainerEl)
      aiInteractionContainerEl.style.display = "block";
    gemmaStatus = "ready";
  }

  // Log for debugging
  console.log("UI Updated:", {
    isOnline,
    isGemmaInitialized,
    status,
    modelAvailable,
    gemmaStatus,
  });
}

// Listen for the detailed status event from native Android code
window.addEventListener("networkStatusChange", (event) => {
  // DEBUG: Log to verify event is being received
  console.log(
    "DEBUG: networkStatusChange event RECEIVED. Details:",
    event.detail,
  );

  if (event.detail) {
    const { isOnline, isGemmaInitialized, status } = event.detail;
    updateUi(isOnline, isGemmaInitialized, status);
  }
});

// --- Model Download Logic ---
async function startModelDownload() {
  if (!isOnline) {
    if (typeof showNotification === "function") {
      showNotification(
        "Please connect to the internet to download the model.",
        "warning",
      );
    } else {
      alert("Please connect to the internet to download the model.");
    }
    return;
  }

  const downloadButtonEl = document.getElementById("download-button");
  const downloadProgressEl = document.getElementById("download-progress");

  if (!downloadButtonEl) return;

  downloadButtonEl.disabled = true;
  downloadButtonEl.textContent = "Downloading...";
  if (downloadProgressEl) downloadProgressEl.style.width = "0%";

  // Progress event listener
  const progressListener = (event) => {
    if (
      event.detail &&
      typeof event.detail.progress !== "undefined" &&
      downloadProgressEl
    ) {
      downloadProgressEl.style.width = `${event.detail.progress}%`;
      console.log(`Download progress: ${event.detail.progress}%`);
    }
  };

  // Add progress listener
  window.addEventListener("downloadProgress", progressListener);

  try {
    // Check if Capacitor and OfflineAi plugin are available
    if (
      !window.Capacitor ||
      !window.Capacitor.Plugins ||
      !window.Capacitor.Plugins.OfflineAi
    ) {
      throw new Error(
        "OfflineAi plugin not available. Make sure you're running in a Capacitor environment.",
      );
    }

    const OfflineAi = window.Capacitor.Plugins.OfflineAi;

    console.log("Starting model download...");
    const result = await OfflineAi.downloadModel();

    console.log("Download complete:", result);
    modelPath = result.path;

    if (downloadButtonEl) {
      downloadButtonEl.textContent = "Download Complete! Initializing...";
    }
    if (downloadProgressEl) {
      downloadProgressEl.style.width = "100%";
    }

    // Initialize Gemma with the downloaded model
    console.log("Initializing Gemma with path:", modelPath);
    await OfflineAi.initializeGemma({ path: modelPath });

    if (typeof showNotification === "function") {
      showNotification("Offline AI model ready!", "success");
    }

    // The native code will dispatch a networkStatusChange event with updated status
    // which will trigger the UI update automatically
  } catch (error) {
    console.error("Download failed:", error);

    if (downloadButtonEl) {
      downloadButtonEl.disabled = false;
      downloadButtonEl.textContent = "Download Failed. Retry?";
    }

    if (typeof showNotification === "function") {
      showNotification(`Model download failed: ${error.message}`, "error");
    } else {
      alert(`Download failed: ${error.message}`);
    }
  } finally {
    // Clean up progress listener
    window.removeEventListener("downloadProgress", progressListener);
  }
}

// Attach download button event listener
const downloadBtn = document.getElementById("download-button");
if (downloadBtn) {
  downloadBtn.addEventListener("click", startModelDownload);
}

// --- AI Request Routing ---
async function handleAiRequest() {
  const aiPromptInput = document.getElementById("ai-prompt-input");
  const aiResponseArea = document.getElementById("ai-response-area"); // This is the chat container
  const sendButton = document.getElementById("send-button");

  const prompt = aiPromptInput ? aiPromptInput.value.trim() : "";
  if (!prompt) return;

  // Clear input and show user message
  aiPromptInput.value = "";
  addMessageToChat("user", prompt);

  // Show typing indicator
  showTypingIndicator();

  if (sendButton) sendButton.disabled = true;

  try {
    if (isOnline) {
      console.log("Routing to Gemini API (Online)...");

      // Replace with your production or local proxy URL
      const PROXY_URL = "/api/chat";

      const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: prompt, language: aiLanguage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch from Gemini API");
      }

      const data = await response.json();
      removeTypingIndicator();
      addMessageToChat("ai", data.reply || data.response);
    } else {
      if (gemmaStatus === "ready") {
        console.log("Routing to Local Gemma (Offline)...");
        if (
          window.Capacitor &&
          window.Capacitor.Plugins &&
          window.Capacitor.Plugins.OfflineAi
        ) {
          const { OfflineAi } = window.Capacitor.Plugins;
          const result = await OfflineAi.generateResponse({ prompt: prompt });
          removeTypingIndicator();
          addMessageToChat("ai", result.response);
        } else {
          throw new Error("OfflineAi plugin not available");
        }
      } else {
        removeTypingIndicator();
        addMessageToChat(
          "ai",
          "I'm currently offline and the local AI model isn't ready. Please connect to the internet or download the model in settings.",
        );
      }
    }
  } catch (error) {
    console.error("AI Request Failed:", error);
    removeTypingIndicator();
    addMessageToChat("ai", `Error: ${error.message}. Please try again.`);
  } finally {
    if (sendButton) sendButton.disabled = false;
    if (aiResponseArea) {
      aiResponseArea.scrollTo({
        top: aiResponseArea.scrollHeight,
        behavior: "smooth",
      });
    }
  }
}

// Attach send button event listener
const sendBtn = document.getElementById("send-button");
if (sendBtn) {
  sendBtn.addEventListener("click", handleAiRequest);
}
