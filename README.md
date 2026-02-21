# LifePulse - AI-Powered Healthcare Without Barriers

**A modern, brand-focused healthcare platform**

Affordable, offline-ready healthcare support designed for rural India, featuring AI-powered health assistance, emergency services, and doctor consultations.

---

## 🌟 Features

### Core Platform

- **Consolidated Single-Page Application (SPA)** - Fast, responsive experience centered in `public/index.html`.
- **Firebase Authentication** - Secure, role-based login (User/Doctor/Health Worker) with Google Sign-In support.
- **Fixed Intelligent Navigation** - Persistent main navigation with a functional hamburger menu for secondary tools.
- **Responsive Design** - Mobile-first, optimized for low-bandwidth rural environments.

### Main Features

1. **🤖 AI Health Assistant** - 24/7 intelligent health guidance using Gemini 2.0 Flash API.
2. **🚨 Emergency Help** - One-touch SOS button with hospital locator and sharing capabilities.
3. **👨‍⚕️ Doctor Connect** - Browse and connect with verified medical professionals.
4. **📊 Health Dashboard** - Track vital health metrics and family health trends.

### Additional Features (Hamburger Menu)

- **Medicine Reminder**: Never miss a dose with scheduled alerts.
- **Family Dashboard**: Manage health records for the whole family.
- **Report Analyzer**: AI-powered analysis of medical lab reports.
- **Diet Generator**: Personalized nutrition plans based on health data.
- **Medicine Analyzer**: Photo-based extraction of medicine details.
- **Pharmacy Finder**: Interactive map to locate nearby medical stores.

---

## 🚀 Quick Start

### 1. Local Development (Vercel Dev)

The recommended way to run LifePulse locally is using the Vercel CLI, which handles the frontend and serverless API functions simultaneously.

```bash
# Install dependencies
npm install

# Run the complete environment
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 2. Simple Static Server

If you only want to test the UI without AI features:

```bash
# Using Python
cd public
python -m http.server 8000
```

---

## 📂 Project Structure

```
LifePulse/
├── api/                # Production Backend (Serverless Functions)
│   ├── chat.js         # Gemini AI API Integration
│   ├── nearby-hospitals.js # Hospital Locator API
│   ├── analyze-medicine.js # Medicine Image Analysis
│   └── ...             # Other feature-specific handlers
├── public/             # Frontend Static Assets
│   ├── index.html      # Main Application (Auth, UI Sections, Modals)
│   ├── script.js       # Core Frontend Orchestrator & UI Logic
│   ├── styles.css      # Custom Design System & Global Styles
│   ├── firebase-auth.js # Authentication Logic
│   └── firebase-config.js # Firebase Project Configuration
├── vercel.json         # Deployment & Routing Configuration
├── package.json        # Dependencies & NPM Scripts
└── README.md           # Project Documentation
```

---

## 🎨 Design System

### Colors

- **Primary Purple/Indigo**: `#9333ea` (Branding & Buttons)
- **Secondary Blue**: `#2563eb` (Information & Trust)
- **Emergency Red**: `#dc2626` (SOS & Alerts)
- **Success Green**: `#10b981` (Confirmations & Health)

### Typography

- **Primary Font**: Modern Sans-Serif (Performance-optimized)
- **Accessibility**: 18px base text for high readability.

### Components

- Rounded buttons with gradient backgrounds
- Soft shadows for depth
- Smooth hover animations
- Pulse animations on health icons

---

## 💻 Technology Stack

- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+), Tailwind CSS (via CDN)
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Google Gemini 2.0 Flash API
- **Auth**: Firebase Authentication
- **Maps**: Leaflet.js
- **Export**: html2pdf.js

---

## 🔐 Authentication

LifePulse uses Firebase for secure user management.

- **Roles**: User, Doctor, Health Worker.
- **Persistence**: User session persists between reloads.
- **Authorization**: Some dashboard features require being logged in.

---

## 🎯 Key Features Explained

### 1. Homepage

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

### 3. AI Assistant

- Interactive chat interface
- Quick reply buttons
- Symptom checker form with emergency detection
- Keyword-based response system (demo)
- Medical disclaimer

### 4. Emergency Help

- Large SOS button with pulse animation
- Press & hold for 3 seconds to activate
- Nearby hospitals list (demo data)
- Emergency contact numbers (Ambulance: 108, etc.)

### 5. Login System

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

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
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
