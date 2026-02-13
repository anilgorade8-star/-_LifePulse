// Global State
let currentLanguage = 'en';
let chatHistory = [];
let isOnline = navigator.onLine;
let map = null;
let heartRateInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    initApp();
    loadProfileData();
    animateStats();
    initCharts();
    checkConnectivity();

    // Heart rate simulation
    setInterval(() => {
        const hr = 70 + Math.floor(Math.random() * 10);
        document.getElementById('heartRate').textContent = hr;
    }, 3000);
});

function initApp() {
    // Check online status
    window.addEventListener('online', () => updateOnlineStatus(true));
    window.addEventListener('offline', () => updateOnlineStatus(false));

    // Initialize medicine reminders
    checkMedicineReminders();
    setInterval(checkMedicineReminders, 60000); // Check every minute
}

function updateOnlineStatus(online) {
    isOnline = online;
    const bar = document.getElementById('offlineBar');
    if (online) {
        bar.style.display = 'none';
        showNotification('Back online!', 'success');
    } else {
        bar.style.display = 'block';
        showNotification('You are offline. Limited features available.', 'warning');
    }
}

function checkConnectivity() {
    if (!navigator.onLine) {
        document.getElementById('offlineBar').style.display = 'block';
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        window.scrollTo(0, 0);

        // Initialize section-specific features
        if (sectionId === 'emergency') {
            setTimeout(initMap, 100);
        }
        if (sectionId === 'dashboard') {
            updateDashboardCharts();
        }
    }
}

// AI Chatbot Functions
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    // Clear input and show user message
    input.value = '';
    addMessageToChat('user', message);
    
    // Show typing indicator
    showTypingIndicator();

    try {
        // Check if backend is available (optional, but good for UX)
        // For now, we'll try to send the message directly
        
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove typing indicator and show AI response
        removeTypingIndicator();
        addMessageToChat('ai', data.reply);
        // speakResponse(data.reply); // Auto-read disabled per user request

    } catch (error) {
        console.error('Chat Error:', error);
        
        // Fallback to local hardcoded response if server fails
        console.log('Falling back to local response...');
        removeTypingIndicator();
        
        // Add a small delay for natural feeling if immediate fail
        setTimeout(() => {
            const fallbackResponse = generateAIResponse(message);
            // Append a small note about offline mode if needed, or just show response
            const responseWithNote = `${fallbackResponse}<br><br><span class="text-xs text-gray-500">(Offline Mode)</span>`;
            addMessageToChat('ai', responseWithNote);
            // speakResponse(fallbackResponse); // Auto-read disabled per user request
        }, 500);
    }
}

function addMessageToChat(sender, message) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'flex items-start space-x-3 chat-message';

    if (sender === 'user') {
        div.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-purple-600 text-white rounded-2xl rounded-tr-none p-4 shadow-md max-w-[80%]">
                    ${message}
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
                ${message}
            </div>
        `;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'flex items-start space-x-3';
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
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function generateAIResponse(input) {
    const lower = input.toLowerCase();

    // Emergency detection
    if (lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('can\'t breathe')) {
        return `🚨 <b>This sounds like a medical emergency!</b><br><br>
        Please call <b>108</b> immediately or press the SOS button.<br><br>
        While waiting for help:<br>
        • Sit down and stay calm<br>
        • Loosen tight clothing<br>
        • If you have aspirin, chew one (if not allergic)<br>
        • Do not drive yourself`;
    }

    // Common symptoms
    if (lower.includes('fever') || lower.includes('headache')) {
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

    if (lower.includes('stomach') || lower.includes('pain')) {
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

    if (lower.includes('diabetes') || lower.includes('sugar')) {
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

    if (lower.includes('pregnant') || lower.includes('pregnancy')) {
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
    document.getElementById('chatInput').value = message;
    sendMessage();
}

function heroChat(input) {
    if (event.key === 'Enter') {
        showSection('ai-assistant');
        setTimeout(() => {
            document.getElementById('chatInput').value = input.value;
            sendMessage();
        }, 500);
    }
}

function clearChat() {
    document.getElementById('chatContainer').innerHTML = `
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
    document.getElementById('voiceModal').classList.remove('hidden');
    // Start speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.start();

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
        };

        recognition.onend = function () {
            setTimeout(() => closeVoiceModal(), 1000);
        };
    }
}

function closeVoiceModal() {
    document.getElementById('voiceModal').classList.add('hidden');
}

function processVoice() {
    closeVoiceModal();
    sendMessage();
}

function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
        utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

function startVoiceChat() {
    toggleVoiceInput();
}

// Emergency Functions
function triggerSOS() {
    document.getElementById('sosModal').classList.remove('hidden');

    // Simulate emergency call
    setTimeout(() => {
        // In real app, this would trigger actual phone call and location sharing
        console.log('Emergency triggered: Calling 108, sharing location');
    }, 1000);
}

function closeSOS() {
    document.getElementById('sosModal').classList.add('hidden');
}

// Map Functions
function initMap() {
    if (map) {
        map.remove();
    }

    // Default to Delhi coordinates (in real app, use geolocation)
    map = L.map('map').setView([28.6139, 77.2090], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add hospital markers
    const hospitals = [
        { name: "AIIMS Hospital", lat: 28.5672, lng: 77.2100, type: "Government" },
        { name: "Safdarjung Hospital", lat: 28.5733, lng: 77.2000, type: "Government" },
        { name: "City Hospital", lat: 28.6200, lng: 77.2200, type: "Private" }
    ];

    const hospitalList = document.getElementById('hospitalList');
    hospitalList.innerHTML = '';

    hospitals.forEach(hospital => {
        const marker = L.marker([hospital.lat, hospital.lng]).addTo(map);
        marker.bindPopup(`<b>${hospital.name}</b><br>${hospital.type} Hospital<br>
            <button onclick="getDirections(${hospital.lat}, ${hospital.lng})" class="text-blue-600 underline">Get Directions</button>`);

        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div>
                <div class="font-bold">${hospital.name}</div>
                <div class="text-sm text-gray-600">${hospital.type} • 2.5 km away</div>
            </div>
            <a href="tel:01112345678" class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600">
                <i class="fas fa-phone"></i>
            </a>
        `;
        hospitalList.appendChild(div);
    });
}

function getDirections(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// Medicine Functions
function takeMedicine(btn) {
    const card = btn.closest('.medicine-card');
    card.classList.add('taken');
    btn.innerHTML = '<i class="fas fa-check-double"></i>';
    btn.classList.add('bg-green-500', 'text-white', 'border-green-500');
    btn.disabled = true;

    showNotification('Medicine marked as taken!', 'success');

    // Update adherence chart
    updateAdherenceChart();
}

function addMedicine() {
    const name = prompt('Enter medicine name:');
    if (name) {
        const time = prompt('Enter time (e.g., 08:00):');
        const list = document.getElementById('medicineList');
        const div = document.createElement('div');
        div.className = 'medicine-card bg-gray-50 rounded-xl p-4 border-l-4 border-gray-400';
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
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    document.querySelectorAll('.medicine-card').forEach(card => {
        const medTime = card.getAttribute('data-time');
        if (medTime === currentTime && !card.classList.contains('taken')) {
            showNotification(`Time to take your medicine: ${card.querySelector('h4').textContent}`, 'warning');
            // Play reminder sound
            if ('speechSynthesis' in window) {
                const msg = new SpeechSynthesisUtterance('Medicine reminder: Time to take your ' + card.querySelector('h4').textContent);
                window.speechSynthesis.speak(msg);
            }
        }
    });
}

// Diet Generator
function generateDiet() {
    const condition = document.getElementById('dietCondition').value;
    const region = document.getElementById('dietRegion').value;

    if (!condition) {
        showNotification('Please select a health condition', 'error');
        return;
    }

    document.getElementById('dietPlan').classList.remove('hidden');

    // Customize based on condition
    const breakfast = document.getElementById('breakfastList');
    const lunch = document.getElementById('lunchList');
    const dinner = document.getElementById('dinnerList');
    const tips = document.getElementById('nutritionTips');

    if (condition === 'diabetes') {
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
    } else if (condition === 'pregnancy') {
        breakfast.innerHTML = `
            <li>• 2 chapatis with ghee</li>
            <li>• 1 glass milk with saffron</li>
            <li>• 1 banana or seasonal fruit</li>
        `;
        tips.innerHTML += `<li>• Take iron and folic acid supplements daily</li>`;
    }

    showNotification('Personalized diet plan generated!', 'success');
}

// Report Analyzer
function analyzeReport(input) {
    if (input.files && input.files[0]) {
        showNotification('Uploading and analyzing report...', 'info');

        setTimeout(() => {
            document.getElementById('analysisResult').classList.remove('hidden');
            showNotification('Analysis complete!', 'success');
        }, 2000);
    }
}

// Doctor Consultation
function startConsultation(doctorName) {
    showNotification(`Connecting to ${doctorName}...`, 'info');
    setTimeout(() => {
        alert(`Video consultation started with ${doctorName}\n\nIn a real app, this would open a secure video call interface.`);
    }, 1500);
}

// Language Support
function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    showNotification(`Language changed to ${currentLanguage.toUpperCase()}`, 'success');

    // In real app, this would reload content with translations
    if (currentLanguage === 'hi') {
        showNotification('अब हिंदी में उपलब्ध', 'success');
    }
}

// Charts
function initCharts() {
    // Adherence Chart
    const ctx = document.getElementById('adherenceChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Medicine Taken',
                    data: [2, 3, 2, 3, 3, 2, 3],
                    backgroundColor: 'rgba(234, 179, 8, 0.8)',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 3 }
                }
            }
        });
    }
}

function updateDashboardCharts() {
    const ctx = document.getElementById('healthTrendChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Blood Sugar',
                    data: [110, 105, 120, 115, 110, 108, 112],
                    borderColor: 'rgb(147, 51, 234)',
                    tension: 0.4
                }, {
                    label: 'Blood Pressure',
                    data: [120, 118, 122, 119, 121, 118, 120],
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

function updateAdherenceChart() {
    // Update chart data in real app
}

// Stats Animation
function animateStats() {
    const stats = [
        { id: 'statUsers', target: 50000, suffix: '+' },
        { id: 'statConsultations', target: 125000, suffix: '+' },
        { id: 'statDoctors', target: 2500, suffix: '+' },
        { id: 'statLives', target: 100000, suffix: '+' }
    ];

    stats.forEach(stat => {
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
                element.textContent = Math.floor(current).toLocaleString() + stat.suffix;
            }, 20);
        }
    });
}

// Notifications
function showNotification(message, type = 'info') {
    const div = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    div.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    div.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info-circle'} mr-2"></i>
            ${message}
        </div>
    `;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Profile Functions
let emergencyContactIdCounter = 3; // Start from 3 since we have 2 default contacts

function toggleProfile() {
    const panel = document.getElementById('profilePanel');
    panel.classList.remove('translate-x-full');
}

function closeProfile() {
    const panel = document.getElementById('profilePanel');
    panel.classList.add('translate-x-full');
}

function toggleEditMode(section) {
    const viewDiv = document.getElementById(section + 'View');
    const editDiv = document.getElementById(section + 'Edit');

    if (viewDiv && editDiv) {
        viewDiv.classList.toggle('hidden');
        editDiv.classList.toggle('hidden');
    }
}

function cancelEdit(section) {
    const viewDiv = document.getElementById(section + 'View');
    const editDiv = document.getElementById(section + 'Edit');

    if (viewDiv && editDiv) {
        viewDiv.classList.remove('hidden');
        editDiv.classList.add('hidden');
    }
}

function savePersonalInfo() {
    // Get values from edit fields
    const name = document.getElementById('editName').value;
    const age = document.getElementById('editAge').value;
    const gender = document.getElementById('editGender').value;
    const bloodGroup = document.getElementById('editBloodGroup').value;
    const phone = document.getElementById('editPhone').value;
    const email = document.getElementById('editEmail').value;

    // Update view fields
    document.getElementById('viewName').textContent = name;
    document.getElementById('viewAge').textContent = age;
    document.getElementById('viewGender').textContent = gender;
    document.getElementById('viewBloodGroup').textContent = bloodGroup;
    document.getElementById('viewPhone').textContent = phone;
    document.getElementById('viewEmail').textContent = email;

    // Update header display
    document.getElementById('profileNameDisplay').textContent = name;
    document.getElementById('profileAgeGenderDisplay').textContent = `${age} years • ${gender}`;

    // Hide edit mode
    cancelEdit('personal');

    // Save to localStorage
    const profileData = { name, age, gender, bloodGroup, phone, email };
    localStorage.setItem('profileData', JSON.stringify(profileData));

    showNotification('Profile updated successfully!', 'success');
}

function saveMedicalInfo() {
    // Get values from edit fields
    const height = document.getElementById('editHeight').value;
    const weight = document.getElementById('editWeight').value;
    const conditions = document.getElementById('editConditions').value;
    const allergies = document.getElementById('editAllergies').value;
    const medications = document.getElementById('editMedications').value;

    // Update view fields
    document.getElementById('viewHeightWeight').textContent = `${height} cm • ${weight} kg`;
    document.getElementById('viewConditions').textContent = conditions;
    document.getElementById('viewAllergies').textContent = allergies;
    document.getElementById('viewMedications').textContent = medications;

    // Hide edit mode
    cancelEdit('medical');

    // Save to localStorage
    const medicalData = { height, weight, conditions, allergies, medications };
    localStorage.setItem('medicalData', JSON.stringify(medicalData));

    showNotification('Medical history updated successfully!', 'success');
}

function addEmergencyContact() {
    const name = prompt('Enter contact name (e.g., "Mother - Sunita"):');
    if (!name) return;

    const phone = prompt('Enter phone number:');
    if (!phone) return;

    const contactId = emergencyContactIdCounter++;
    const contactsList = document.getElementById('emergencyContactsList');

    const colors = ['bg-red-50', 'bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-purple-50'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const div = document.createElement('div');
    div.className = `flex items-center justify-between p-3 ${color} rounded-lg emergency-contact`;
    div.setAttribute('data-id', contactId);
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
    showNotification('Emergency contact added!', 'success');
}

function editEmergencyContact(contactId) {
    const contactDiv = document.querySelector(`.emergency-contact[data-id="${contactId}"]`);
    if (!contactDiv) return;

    const nameEl = contactDiv.querySelector('.contact-name');
    const phoneEl = contactDiv.querySelector('.contact-phone');

    const newName = prompt('Enter new name:', nameEl.textContent);
    if (newName) {
        nameEl.textContent = newName;
    }

    const newPhone = prompt('Enter new phone:', phoneEl.textContent);
    if (newPhone) {
        phoneEl.textContent = newPhone;
    }

    saveEmergencyContacts();
    showNotification('Contact updated!', 'success');
}

function deleteEmergencyContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    const contactDiv = document.querySelector(`.emergency-contact[data-id="${contactId}"]`);
    if (contactDiv) {
        contactDiv.remove();
        saveEmergencyContacts();
        showNotification('Contact deleted!', 'success');
    }
}

function saveEmergencyContacts() {
    const contacts = [];
    document.querySelectorAll('.emergency-contact').forEach(contact => {
        const id = contact.getAttribute('data-id');
        const name = contact.querySelector('.contact-name').textContent;
        const phone = contact.querySelector('.contact-phone').textContent;
        contacts.push({ id, name, phone });
    });
    localStorage.setItem('emergencyContacts', JSON.stringify(contacts));
}

function loadProfileData() {
    // Load personal data
    const profileData = localStorage.getItem('profileData');
    if (profileData) {
        const data = JSON.parse(profileData);
        document.getElementById('viewName').textContent = data.name;
        document.getElementById('editName').value = data.name;
        document.getElementById('viewAge').textContent = data.age;
        document.getElementById('editAge').value = data.age;
        document.getElementById('viewGender').textContent = data.gender;
        document.getElementById('editGender').value = data.gender;
        document.getElementById('viewBloodGroup').textContent = data.bloodGroup;
        document.getElementById('editBloodGroup').value = data.bloodGroup;
        document.getElementById('viewPhone').textContent = data.phone;
        document.getElementById('editPhone').value = data.phone;
        document.getElementById('viewEmail').textContent = data.email;
        document.getElementById('editEmail').value = data.email;
        document.getElementById('profileNameDisplay').textContent = data.name;
        document.getElementById('profileAgeGenderDisplay').textContent = `${data.age} years • ${data.gender}`;
    }

    // Load medical data
    const medicalData = localStorage.getItem('medicalData');
    if (medicalData) {
        const data = JSON.parse(medicalData);
        document.getElementById('viewHeightWeight').textContent = `${data.height} cm • ${data.weight} kg`;
        document.getElementById('editHeight').value = data.height;
        document.getElementById('editWeight').value = data.weight;
        document.getElementById('viewConditions').textContent = data.conditions;
        document.getElementById('editConditions').value = data.conditions;
        document.getElementById('viewAllergies').textContent = data.allergies;
        document.getElementById('editAllergies').value = data.allergies;
        document.getElementById('viewMedications').textContent = data.medications;
        document.getElementById('editMedications').value = data.medications;
    }
}

function changeProfilePicture() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = document.getElementById('profileImage');
                const icon = document.getElementById('profileIcon');
                img.src = event.target.result;
                img.classList.remove('hidden');
                icon.classList.add('hidden');

                // Save to localStorage
                localStorage.setItem('profilePicture', event.target.result);
                showNotification('Profile picture updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    fileInput.click();
}


// Service Worker Registration for Offline Support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,' + encodeURIComponent(`
        self.addEventListener('install', e => {
            e.waitUntil(
                caches.open('lifepulse-v1').then(cache => {
                    return cache.addAll(['/']);
                })
            );
        });
        self.addEventListener('fetch', e => {
            e.respondWith(
                caches.match(e.request).then(response => {
                    return response || fetch(e.request);
                })
            );
        });
    `)).catch(() => console.log('Service Worker registration skipped'));
}

function sendImage() {
    showNotification('Image upload feature coming soon!', 'info');
}
