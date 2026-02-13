# LifePulse - AI-Powered Healthcare Without Barriers

**A modern, brand-focused healthcare platform**

Affordable, offline-ready healthcare support designed for rural India, featuring AI-powered health assistance, emergency services, and doctor consultations.

---

## 🌟 Features

### Core Platform
- **Brand-Focused Homepage** - Clean landing page with mission statement and platform overview
- **Professional Login System** - Role-based authentication (User/Doctor/Health Worker)
- **Fixed Navigation** - Main features + hamburger menu for secondary tools
- **Responsive Design** - Mobile-first, optimized for low-bandwidth rural areas

### Main Features
1. **🤖 AI Health Assistant** - 24/7 intelligent health guidance with symptom checker
2. **🚨 Emergency Help** - One-touch SOS button with hospital locator
3. **👨‍⚕️ Doctor Connect** - Online consultations with verified doctors
4. **📊 Health Dashboard** - Track family health metrics and trends

### Additional Features (Hamburger Menu)
- Medicine Reminder
- Family Dashboard
- Voice Assistant (Multi-language)
- Report Analyzer
- Diet Generator
- Hospital Finder
- Settings

---

## 🚀 Quick Start

### Local Development

1. **Clone/Navigate to Project**
   ```bash
   cd lifepulse
   ```

2. **Start Local Server**
   ```bash
   # Using npx (recommended)
   npx -y http-server -p 8000
   
   # Or using Python
   python -m http.server 8000
   ```

3. **Open in Browser**
   ```
   http://localhost:8000
   ```

### Project Structure

```
lifepulse/
├── index.html                  # Brand-focused homepage
├── login.html                   # Login with role selection
├── pages/                       # Feature pages
│   ├── ai-assistant.html       # AI chat & symptom checker
│   ├── emergency.html          # SOS & hospital finder
│   └── ...                     # Other features (templates)
├── css/                         # Modular stylesheets
│   ├── main.css                # Design system & utilities
│   ├── homepage.css            # Homepage animations
│   ├── navigation.css          # Nav & hamburger menu
│   ├── login.css               # Login page styles
│   └── features.css            # Feature pages styles
├── js/                          # JavaScript modules
│   ├── main.js                 # Core functionality
│   ├── animations.js           # Page transitions & effects
│   ├── auth.js                 # Authentication logic
│   └── features/               # Feature-specific scripts
│       └── ai-assistant.js     # AI chat functionality
└── README.md                    # This file
```

---

## 🎨 Design System

### Colors
- **Primary Blue**: `#4A90E2`
- **Primary Green**: `#5CB85C`
- **Gradient**: Blue → Green (135deg)
- **Background**: Light blue → Light green gradient

### Typography
- **Font**: System fonts (performance-optimized)
- **Base Size**: 18px (accessibility for elderly users)
- **Headings**: Bold, clean hierarchy

### Components
- Rounded buttons with gradient backgrounds
- Soft shadows for depth
- Smooth hover animations
- Pulse animations on health icons

---

## 💻 Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Architecture**: Multi-page application (MPA)
- **Design**: Mobile-first responsive
- **Accessibility**: WCAG AA compliant
- **Performance**: Optimized for 3G networks

---

## 🔐 Demo Authentication

For demonstration purposes, the login accepts any credentials:

1. Go to `/login.html`
2. Enter any email/phone and password
3. Click "Sign In"
4. Select your role (User/Doctor/Health Worker)
5. Get redirected to dashboard

**Production Note**: Replace with actual backend API integration.

---

## 🎯 Key Features Explained

### 1. Homepage (index.html)
- **NO feature sections** - Pure branding only
- Animated medical icons floating in background
- Social impact statistics with counter animations
- Platform overview cards (links to feature pages)
- Trust badges (AI-Powered, Works Offline, Secure)

### 2. Navigation System
- **Top Nav**: Home, AI Assistant, Emergency, Doctor Connect, Dashboard
- **Hamburger Menu**: 7 secondary features
- Fixed position with scroll effects
- Mobile responsive hamburger collapse

### 3. AI Assistant (pages/ai-assistant.html)
- Interactive chat interface
- Quick reply buttons
- Symptom checker form with emergency detection
- Keyword-based response system (demo)
- Medical disclaimer

### 4. Emergency Help (pages/emergency.html)
- Large SOS button with pulse animation
- Press & hold for 3 seconds to activate
- Nearby hospitals list (demo data)
- Emergency contact numbers (Ambulance: 108, etc.)

### 5. Login System (login.html)
- Email/Phone + Password inputs
- Password show/hide toggle
- Remember me checkbox
- Role selection after login
- Privacy & security messaging

---

## 📱 Responsive Breakpoints

```css
/* Mobile */ 320px - 767px
/* Tablet */ 768px  - 1023px
/* Desktop */ 1024px+
```

All layouts adapt smoothly across devices.

---

## ♿ Accessibility Features

- High contrast colors (WCAG AA)
- Large touch targets (48px minimum)
- Keyboard navigation support
- Screen reader friendly
- Focus indicators on all interactive elements
-Reduced motion support

---

## 🌐 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🚧 Future Enhancements

### Backend Integration
1. Replace demo authentication with real API
2. Connect AI chat to actual LLM (Gemini API)
3. Integrate Google Maps for hospital locator
4. Real-time emergency alert system

### Offline Functionality
1. Service worker for offline access
2. IndexedDB for local data storage
3. Sync when connection available

### Additional Features
1. Complete remaining feature pages
2. Dark/light mode toggle
3. Voice assistant with speech recognition
4. PDF report generation

---

### Problem Statement
Affordable AI healthcare for rural India with 850M+ people lacking access.

### Solution Highlights
- ✅ **Offline-ready** - Works with poor connectivity
- ✅ **AI-powered** - Intelligent health guidance 24/7
- ✅ **Accessible** - Multi-language, voice support, elderly-friendly
- ✅ **Affordable** - No subscription, free basic features
- ✅ **Scalable** - Cloud-based, handles millions of users

### Demo Strategy
1. Show brand-focused homepage (professional first impression)
2. Demonstrate login and role selection
3. Interactive AI chat with symptom checking
4. Emergency SOS and hospital finder
5. Emphasize offline capability and rural focus

---

## 📄 License

© 2026 LifePulse.

---

## 👥 Team & Contact

**Project**: LifePulse - Affordable AI Healthcare Platform for Rural India
**Focus**: Healthcare accessibility, AI-powered solutions, Rural development

---

## 🎓 Documentation

- **Implementation Plan**: See `/brain/implementation_plan.md`
- **Walkthrough**: See `/brain/walkthrough.md`
- **Task Breakdown**: See `/brain/task.md`

---

**Built with ❤️ for rural India's healthcare revolution**
