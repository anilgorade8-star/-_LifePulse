// Global State
let currentLanguage = "en";
let aiLanguage = "en"; // AI response language
let chatHistory = [];
let isOnline = navigator.onLine;
let map = null;
let heartRateInterval = null;

// Initialize
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
    document.getElementById("heartRate").textContent = hr;
  }, 3000);

  // Hide loading screen after 2 seconds
  window.addEventListener("load", function () {
    const loader = document.getElementById("loadingScreen");
    setTimeout(() => {
      loader.classList.add("fade-out");
      setTimeout(() => {
        loader.style.display = "none";
        window.scrollTo(0, 0); // Ensure page starts at top after loading
      }, 500);
    }, 2000);
  });

  // Initialize visibility states (footer, nav buttons)
  showSection("home", false);
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

    // Initialize section-specific features
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
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  // Clear input and show user message
  input.value = "";
  addMessageToChat("user", message);

  // Show typing indicator
  showTypingIndicator();

  try {
    // Check if backend is available (optional, but good for UX)
    // For now, we'll try to send the message directly

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, language: aiLanguage }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    // Remove typing indicator and show AI response
    removeTypingIndicator();
    addMessageToChat("ai", data.reply);
    // speakResponse(data.reply); // Auto-read disabled per user request
  } catch (error) {
    console.error("Chat Error:", error);

    // Fallback to local hardcoded response if server fails
    console.log("Falling back to local response...");
    removeTypingIndicator();

    // Add a small delay for natural feeling if immediate fail
    setTimeout(() => {
      const fallbackResponse = generateAIResponse(message);
      // Append a small note about offline mode if needed, or just show response
      const responseWithNote = `${fallbackResponse}<br><br><span class="text-xs text-gray-500">(Offline Mode)</span>`;
      addMessageToChat("ai", responseWithNote);
      // speakResponse(fallbackResponse); // Auto-read disabled per user request
    }, 500);
  }
}

function addMessageToChat(sender, message) {
  const container = document.getElementById("chatContainer");
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
    div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-purple-600"></i>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[80%]">
                ${formattedMessage}
            </div>
        `;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById("chatContainer");
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
  document.getElementById("chatInput").value = message;
  sendMessage();
}

function heroChat(input) {
  if (event.key === "Enter") {
    showSection("ai-assistant");
    setTimeout(() => {
      document.getElementById("chatInput").value = input.value;
      sendMessage();
    }, 500);
  }
}

function clearChat() {
  document.getElementById("chatContainer").innerHTML = `
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

// Voice Functions
function toggleVoiceInput() {
  document.getElementById("voiceModal").classList.remove("hidden");
  // Start speech recognition
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-IN";
    recognition.start();

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      document.getElementById("chatInput").value = transcript;
    };

    recognition.onend = function () {
      setTimeout(() => closeVoiceModal(), 1000);
    };
  }
}

function closeVoiceModal() {
  document.getElementById("voiceModal").classList.add("hidden");
}

function processVoice() {
  closeVoiceModal();
  sendMessage();
}

function speakResponse(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text.replace(/<[^>]*>/g, ""); // Remove HTML tags
    utterance.lang = currentLanguage === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

function startVoiceChat() {
  toggleVoiceInput();
}

// Emergency Functions
function triggerSOS() {
  document.getElementById("sosModal").classList.remove("hidden");

  // Simulate emergency call
  setTimeout(() => {
    // In real app, this would trigger actual phone call and location sharing
    console.log("Emergency triggered: Calling 108, sharing location");
  }, 1000);
}

function closeSOS() {
  document.getElementById("sosModal").classList.add("hidden");
}

// Map Functions
function initMap() {
  if (map) {
    map.remove();
    map = null;
  }

  // Default view (center of India as fallback)
  map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer(
    "https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=601eac944cc34c71a9566d0db43c475b",
    {
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors',
    },
  ).addTo(map);

  // Get User Location
  if (navigator.geolocation) {
    showNotification("Locating you...", "info");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update map view
        map.setView([lat, lng], 14);

        // Add User Marker
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

        // Fetch nearby hospitals
        fetchNearbyHospitals(lat, lng);
      },
      () => {
        showNotification(
          "Location access denied. Using default location.",
          "warning",
        );
        // Fallback to Delhi
        const defaultLat = 28.6139;
        const defaultLng = 77.209;
        map.setView([defaultLat, defaultLng], 13);
        fetchNearbyHospitals(defaultLat, defaultLng);
      },
    );
  } else {
    showNotification(
      "Geolocation not supported. Using default location.",
      "error",
    );
    const defaultLat = 28.6139;
    const defaultLng = 77.209;
    map.setView([defaultLat, defaultLng], 13);
    fetchNearbyHospitals(defaultLat, defaultLng);
  }
}

async function fetchNearbyHospitals(lat, lng) {
  const hospitalList = document.getElementById("hospitalList");
  hospitalList.innerHTML =
    '<div class="text-center p-4"><i class="fas fa-spinner fa-spin text-purple-600 text-2xl"></i><p class="mt-2 text-gray-600">Finding nearby hospitals...</p></div>';

  try {
    const response = await fetch(
      `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lng},${lat},5000&bias=proximity:${lng},${lat}&limit=10&apiKey=601eac944cc34c71a9566d0db43c475b`,
    );
    const data = await response.json();

    hospitalList.innerHTML = "";

    if (!data.features || data.features.length === 0) {
      hospitalList.innerHTML =
        '<div class="text-center p-4 text-gray-500">No hospitals found nearby.</div>';
      return;
    }

    const hospitalIcon = L.divIcon({
      className: "hospital-marker",
      html: '<div class="hospital-marker-icon" style="width: 30px; height: 30px;"><i class="fas fa-hospital"></i></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    data.features.forEach((place) => {
      const props = place.properties;
      const hospitalLat = props.lat;
      const hospitalLng = props.lon;
      const name = props.name || "Hospital";
      const address = props.address_line2 || props.formatted;

      // Calculate distance
      const distMeters = map.distance([lat, lng], [hospitalLat, hospitalLng]);
      const distance = (distMeters / 1000).toFixed(1);

      const phone =
        props.contact && props.contact.phone
          ? props.contact.phone
          : "Not Available";

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
                ${
                  phone !== "Not Available"
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
      '<div class="text-center p-4 text-red-500">Failed to load hospitals.</div>';
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
  const name = prompt("Enter medicine name:");
  if (name) {
    const time = prompt("Enter time (e.g., 08:00):");
    const list = document.getElementById("medicineList");
    const div = document.createElement("div");
    div.className =
      "medicine-card bg-gray-50 rounded-xl p-4 border-l-4 border-gray-400";
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
                <button onclick="takeMedicine(this)" class="w-12 h-12 rounded-full border-2 border-gray-400 hover:bg-gray-400 hover:text-white transition flex items-center justify-center text-gray-400">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
    list.appendChild(div);
  }
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
      showNotification(
        `Time to take your medicine: ${card.querySelector("h4").textContent}`,
        "warning",
      );
      // Play reminder sound
      if ("speechSynthesis" in window) {
        const msg = new SpeechSynthesisUtterance(
          "Medicine reminder: Time to take your " +
            card.querySelector("h4").textContent,
        );
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

// Charts
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
  const name = prompt('Enter contact name (e.g., "Mother - Sunita"):');
  if (!name) return;

  const phone = prompt("Enter phone number:");
  if (!phone) return;

  const contactId = emergencyContactIdCounter++;
  const contactsList = document.getElementById("emergencyContactsList");

  const colors = [
    "bg-red-50",
    "bg-blue-50",
    "bg-green-50",
    "bg-yellow-50",
    "bg-purple-50",
  ];
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
  saveEmergencyContacts();
  showNotification("Emergency contact added!", "success");
}

function editEmergencyContact(contactId) {
  const contactDiv = document.querySelector(
    `.emergency-contact[data-id="${contactId}"]`,
  );
  if (!contactDiv) return;

  const nameEl = contactDiv.querySelector(".contact-name");
  const phoneEl = contactDiv.querySelector(".contact-phone");

  const newName = prompt("Enter new name:", nameEl.textContent);
  if (newName) {
    nameEl.textContent = newName;
  }

  const newPhone = prompt("Enter new phone:", phoneEl.textContent);
  if (newPhone) {
    phoneEl.textContent = newPhone;
  }

  saveEmergencyContacts();
  showNotification("Contact updated!", "success");
}

function deleteEmergencyContact(contactId) {
  if (!confirm("Are you sure you want to delete this contact?")) return;

  const contactDiv = document.querySelector(
    `.emergency-contact[data-id="${contactId}"]`,
  );
  if (contactDiv) {
    contactDiv.remove();
    saveEmergencyContacts();
    showNotification("Contact deleted!", "success");
  }
}

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

// --- Capacitor Plugin Support ---
const { Plugins, Capacitor: cap } = window;
const { OfflineAi } = Plugins;

// --- UI Elements ---
const networkStatusIndicator = document.getElementById(
  "network-status-indicator",
);
const downloadContainer = document.getElementById("download-container");
const downloadButton = document.getElementById("download-button");
const downloadProgress = document.getElementById("download-progress");
const aiInteractionContainer = document.getElementById(
  "ai-interaction-container",
);
const aiPromptInput = document.getElementById("ai-prompt-input");
const sendButton = document.getElementById("send-button");
const aiResponseArea = document.getElementById("ai-response-area");

// --- Global State ---
// isOnline is already declared at the top of the file
let gemmaStatus = "unavailable"; // 'unavailable', 'initializing', 'ready'
let modelPath = "";

// --- Network and Status Handling ---
function updateUi(status, online) {
  isOnline = online;
  let statusText = "";
  let color = "grey";

  // Synchronize with the main offline bar
  const offlineBar = document.getElementById("offlineBar");
  if (offlineBar) {
    offlineBar.style.display = online ? "none" : "block";
  }

  // Hide all containers by default
  if (downloadContainer) downloadContainer.style.display = "none";
  if (aiInteractionContainer) aiInteractionContainer.style.display = "none";

  switch (status) {
    case "🟢 Online (Gemini)":
      statusText = status;
      color = "green";
      if (aiInteractionContainer)
        aiInteractionContainer.style.display = "block";
      break;
    case "🔵 Offline (Gemma)":
      statusText = status;
      color = "blue";
      if (aiInteractionContainer)
        aiInteractionContainer.style.display = "block";
      gemmaStatus = "ready";
      break;
    case "🔵 Offline (Model Not Found)":
      statusText = status;
      color = "orange";
      if (downloadContainer) downloadContainer.style.display = "block";
      gemmaStatus = "unavailable";
      break;
    default:
      statusText = "⚪ Initializing...";
      break;
  }

  if (networkStatusIndicator) {
    networkStatusIndicator.textContent = statusText;
    networkStatusIndicator.style.color = color;
  }
}

// Listen for the detailed status event from native Android code
window.addEventListener("networkStatusChange", (event) => {
  if (event.detail) {
    updateUi(event.detail.status, event.detail.isOnline);
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
  if (!downloadButton) return;

  downloadButton.disabled = true;
  downloadButton.textContent = "Downloading...";
  if (downloadProgress) downloadProgress.style.width = "0%";

  try {
    const call = await OfflineAi.downloadModel({}, (data, err) => {
      if (err) {
        console.error("Download progress error", err);
        return;
      }
      if (data && typeof data.progress !== "undefined" && downloadProgress) {
        downloadProgress.style.width = `${data.progress}%`;
      }
    });

    console.log("Download complete:", call);
    modelPath = call.path;
    downloadButton.textContent = "Download Complete! Initializing...";

    await OfflineAi.initializeGemma({ path: modelPath });
    if (typeof showNotification === "function") {
      showNotification("Offline AI model ready!", "success");
    }
  } catch (error) {
    console.error("Download failed:", error);
    downloadButton.disabled = false;
    downloadButton.textContent = "Download Failed. Retry?";
    if (aiResponseArea)
      aiResponseArea.textContent = `Download failed: ${error.message}`;
    if (typeof showNotification === "function") {
      showNotification("Model download failed.", "error");
    }
  }
}

if (downloadButton)
  downloadButton.addEventListener("click", startModelDownload);

// --- AI Request Routing ---
async function handleAiRequest() {
  const prompt = aiPromptInput ? aiPromptInput.value : "";
  if (!prompt) return;

  if (aiResponseArea) aiResponseArea.textContent = "Processing...";
  if (sendButton) sendButton.disabled = true;

  try {
    if (isOnline) {
      console.log("Routing to Gemini API (Online)...");
      if (aiResponseArea)
        aiResponseArea.textContent =
          "Placeholder for Gemini Response. You are online!";
    } else {
      if (gemmaStatus === "ready") {
        console.log("Routing to Local Gemma (Offline)...");
        const result = await OfflineAi.generateResponse({ prompt: prompt });
        if (aiResponseArea) aiResponseArea.textContent = result.response;
      } else {
        if (aiResponseArea)
          aiResponseArea.textContent =
            "Offline AI model is not available. Please download it first.";
      }
    }
  } catch (error) {
    console.error("AI Request Failed:", error);
    if (aiResponseArea) aiResponseArea.textContent = `Error: ${error.message}`;
  } finally {
    if (sendButton) sendButton.disabled = false;
  }
}

if (sendButton) sendButton.addEventListener("click", handleAiRequest);

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
            </div>
        </div>
    `;

  list.appendChild(card);
}

function loadFamilyMembers() {
  const members = JSON.parse(localStorage.getItem("familyMembers") || "[]");
  members.forEach((member) => renderFamilyMember(member));
}
