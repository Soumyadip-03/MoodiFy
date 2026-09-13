# MoodiFy 🎵

**MoodiFy** is an advanced, AI-powered music companion that seamlessly bridges the gap between human emotion and music discovery. By utilizing real-time facial expression and gesture recognition, MoodiFy dynamically curates and plays Spotify music that perfectly matches your current emotional state.

> Detect your mood instantly through your webcam → Get perfectly curated music recommendations → Enjoy a deeply personalized listening experience.

---

## ✨ Key Features & Capabilities

- 🎭 **Real-time Mood Detection** — Powered by HSEmotion AI, delivering 82-88% accuracy for instantaneous emotional mapping.
- ❤️ **Gesture Recognition** — Integrated MediaPipe Hands functionality allows users to trigger specific moods (like "Romantic") via intuitive hand gestures.
- 🎵 **Deep Spotify Integration** — A robust OAuth 2.0 flow securely connects to your Spotify account for personalized music recommendations, playback control, and custom playlist generation.
- 📧 **Admin Notification System** — Built-in email broadcast system with beautifully crafted, dynamic HTML templates to keep users updated on new features, announcements, and account security.
- 🎨 **Sophisticated UI/UX** — A meticulously designed, fully responsive frontend featuring smooth animations, a floating music player, and adaptive dark/light themes.
- 📊 **User Analytics Dashboard** — A comprehensive profile suite to track your mood history, listening statistics, liked tracks, and personalized "mood buckets".
- 🔒 **Enterprise-Grade Security** — Fully protected routes, robust session management, and secure authentication powered by Firebase (Google + Email/Password).

---

## 🎯 How It Works: The User Journey

MoodiFy is designed to be frictionless. Here is how a user interacts with the application:

1. **Secure Onboarding:** Users sign up securely using Google OAuth or standard email/password authentication.
2. **The "Mood Room":** Upon entering the detection interface, the application requests secure camera access.
3. **AI Analysis:** 
   - The user's face is captured in a real-time video stream (processed entirely securely).
   - The AI backend analyzes the stream using adaptive temporal buffering (smoothing 3-8 frames to ensure high stability and prevent erratic mood swings).
4. **Instant Playback:** The detected emotion (e.g., Happy, Calm, Intense) is mapped to a musical mood. MoodiFy immediately interfaces with the Spotify API to begin playing a curated track.
5. **Continuous Engagement:** The user can interact with the floating, persistent music player to shuffle, loop, like tracks, or view their dynamically generated queue across any page in the app.

---

## 🎛️ User Options & Interactions

MoodiFy empowers users with full control over their experience:

- **Manual Override:** Not feeling the AI's detection? Users can manually select their mood via the dashboard.
- **Queue Management:** Full access to the Spotify playback queue, including the ability to skip, rewind, shuffle, and cycle repeat states directly from the floating player.
- **Profile Customization:** Users can update their display name, profile photo, and manage their linked accounts.
- **Playlist Generation:** Users can save their uniquely generated mood-based sessions directly to their Spotify account as custom playlists.
- **Theme Preferences:** Global toggle between Light and Dark aesthetic themes, persisting across sessions.

---

## 🛠️ Technical Architecture

MoodiFy leverages a modern, highly scalable full-stack architecture:

| Component | Technology Stack |
|-----------|-----------------|
| **Frontend UI** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion |
| **Backend Engine** | Python 3.11, FastAPI, WebSockets |
| **Artificial Intelligence**| HSEmotion (ONNX), MediaPipe Hands |
| **Authentication & DB** | Firebase Auth, Cloud Firestore |
| **External Integrations**| Spotify Web API (OAuth 2.0), Gmail SMTP (Email Service) |
| **Deployment** | Vercel (Frontend), Render/Railway (Backend) |

---

## 📦 Installation & Setup Guide

### Prerequisites
- **Node.js** v22 or higher
- **Python** 3.11.x *(Strictly required for AI dependencies)*
- **Git**
- **Firebase Project** (Auth + Firestore enabled)
- **Spotify Developer Account** (API Credentials)

### 1. Clone the Repository
```bash
git clone https://github.com/Soumyadip-03/MoodiFy.git
cd MoodiFy
```

### 2. Frontend Configuration
```bash
cd frontend
npm install
```
Create a `frontend/.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Backend Configuration
```bash
cd backend

# Create and activate virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Install dependencies and download AI models
pip install -r requirements.txt
python setup_enhanced_detection.py
```
Create a `backend/.env` file:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/spotify/callback
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
FRONTEND_URL=http://localhost:3000

# Admin Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ADMIN_SECRET=your_secure_admin_secret_key
```

### 4. Launch Application
**Terminal 1 (Backend):**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```
**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:3000` to begin.

---

## 👥 Core Team

| Name | Role | GitHub | LinkedIn |
|------|------|--------|----------|
| **Soumyadip Khan Sarkar** | Full-Stack Developer & AI Engineer | [@Soumyadip-03](https://github.com/Soumyadip-03) | [Profile](https://www.linkedin.com/in/soumyadip-khan-sarkar-8bbb6331b/) |
| **Sulagna Bhattacharya** | UI/UX Designer | [@Sulagna2005](https://github.com/Sulagna2005) | [Profile](https://www.linkedin.com/in/sulagna-bhattacharya-145993377/) |

---

## 📝 License

**Proprietary Software** — © 2026 Soumyadip Khan Sarkar. All Rights Reserved.

This project is closed-source. Unauthorized copying, modification, distribution, or commercial use of this software is strictly prohibited without explicit written permission from the author.
