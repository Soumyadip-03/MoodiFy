# MoodiFy 🎵

**AI-powered mood-based music player** that detects your facial expression in real-time and plays Spotify music matching your emotional state.

> Detect your mood through your webcam → Get instant music recommendations → Enjoy personalized playlists

---

## ✨ Features

- 🎭 **Real-time Mood Detection** — 82-88% accuracy using HSEmotion AI
- ❤️ **Gesture Recognition** — Heart gesture instantly triggers romantic mood
- ⚡ **Adaptive Timing** — 3-8 second detection window with early exit when confident
- 🎵 **Spotify Integration** — Full OAuth flow with personalized recommendations
- 🎨 **Beautiful UI** — Dark/light themes, smooth animations, fully responsive
- 📊 **User Dashboard** — Mood history, custom playlists, play statistics
- 🔒 **Secure Auth** — Firebase authentication (Google + Email/Password)

---

## 🎯 How It Works

```
📹 Webcam → 🔌 WebSocket → 🧠 AI Analysis → 😊 Mood Detected → 🎵 Spotify Playlist
```

1. **Camera captures your face** — real-time video stream
2. **AI analyzes emotions** — HSEmotion + MediaPipe detect expressions & gestures
3. **Adaptive smoothing** — 3-8 frames averaged for stable results
4. **Mood mapping** — emotions converted to music moods (happy, chill, intense, etc.)
5. **Instant music** — Spotify plays tracks matching your detected mood

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Python 3.11, FastAPI, WebSocket |
| **AI Models** | HSEmotion (ONNX), MediaPipe Hands |
| **Authentication** | Firebase Auth |
| **Database** | Cloud Firestore |
| **Music API** | Spotify Web API (OAuth 2.0) |
| **Deployment** | Vercel (frontend), Render/Railway (backend) |

---

## 🚀 Project Status

### ✅ Completed Features

**Phase 1 — Foundation**
- Next.js 14 frontend with TypeScript & App Router
- FastAPI backend with Python 3.11
- Tailwind design system (peach/orange theme)

**Phase 2 — Authentication**
- Firebase Google Sign-In & Email/Password
- Protected routes & session management
- User profile creation in Firestore

**Phase 3 — Mood Detection**
- HSEmotion face detection (82-88% accuracy)
- MediaPipe heart gesture recognition
- Adaptive temporal buffering (3-8s)
- Quality monitoring & CLAHE preprocessing

**Phase 4 — Spotify Integration**
- Full OAuth 2.0 flow with token refresh
- Mood-based playlist recommendations
- Multi-language support (English, Hindi, Bengali, Korean)

**Phase 5 — Music Player**
- Real-time playback controls
- Queue management & shuffle
- 30-second preview support

**Phase 6 — User Features**
- Mood history tracking
- Custom playlists & mood buckets
- Liked tracks & play statistics

**Phase 7 — UI Polish**
- Dark/light theme toggle
- Smooth page transitions
- Mobile-responsive design

### 🔜 Future Enhancements

- Mood Room (real-time collaborative listening)
- Social media Open Graph tags
- Performance optimizations (code splitting, lazy loading)

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** v22 or higher
- **Python** 3.11.x (NOT 3.12+, NOT 3.10 or lower)
- **Git** for version control
- **Firebase Project** (Authentication + Firestore enabled)
- **Spotify Developer Account** (for API credentials)

### 1. Clone Repository

```bash
git clone https://github.com/Soumyadip-03/MoodiFy.git
cd MoodiFy
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Backend Setup

**Important:** Use Python 3.11 only!

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download MediaPipe model (one-time setup)
python setup_enhanced_detection.py
```

Create `backend/.env`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/spotify/callback
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
FRONTEND_URL=http://localhost:3000
```

**Get Firebase Service Account Key:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Project Settings → Service Accounts → Generate New Private Key
- Save as `backend/serviceAccountKey.json`

**Get Spotify Credentials:**
- Go to [Spotify Dashboard](https://developer.spotify.com/dashboard)
- Create an app
- Add redirect URI: `http://localhost:8000/api/spotify/callback`
- Copy Client ID and Secret

### 4. Run Application

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
MoodiFy/
├── frontend/                    # Next.js frontend
│   ├── app/                     # App router pages
│   │   ├── (auth)/              # Login & signup
│   │   └── (app)/               # Protected pages (home, history, etc.)
│   ├── components/              # React components
│   │   ├── auth/                # Authentication UI
│   │   ├── detection/           # MoodDetector component
│   │   ├── player/              # Music player components
│   │   └── ui/                  # Reusable UI components
│   ├── context/                 # React contexts (Auth, Theme, Player)
│   ├── hooks/                   # Custom hooks (useFaceDetection, useSpotify)
│   ├── lib/                     # Firebase & Firestore helpers
│   └── utils/                   # Utility functions
│
├── backend/                     # FastAPI backend
│   ├── routes/                  # API endpoints
│   │   ├── auth.py              # Firebase auth verification
│   │   ├── mood.py              # WebSocket mood detection
│   │   └── spotify.py           # Spotify OAuth & API
│   ├── services/                # Core business logic
│   │   ├── enhanced_face_detection.py    # HSEmotion + quality checks
│   │   ├── mood_mapper.py                # Emotion → mood mapping
│   │   ├── adaptive_temporal_buffer.py   # 3-8s smoothing
│   │   ├── gesture_detection.py          # MediaPipe gestures
│   │   └── spotify_service.py            # Spotify API calls
│   ├── models/                  # ML models (auto-downloaded)
│   │   └── hand_landmarker.task
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   ├── setup_enhanced_detection.py  # One-time setup script
│   └── test_enhanced_detection.py   # Component tests
│
└── README.md                    # You are here!
```

---

## 🎭 Mood Detection System

### Supported Moods

| Facial Expression | App Mood | Gesture Alternative |
|------------------|----------|---------------------|
| Smiling, Joyful | **Happy** | — |
| Surprised, Excited | **Upbeat** | — |
| Calm, Neutral | **Chill** | — |
| Sad, Tearful | **Melancholy** | — |
| Angry, Frustrated | **Intense** | — |
| Fearful, Anxious | **Relaxing** | — |
| — | **Romantic** | ❤️ Heart Gesture (both hands) |

### How Detection Works

1. **Frame Capture** — Webcam sends images to backend via WebSocket (1 frame/second)
2. **Face Quality Check** — Validates blur, lighting, angle (score 0-100)
3. **Emotion Recognition** — HSEmotion analyzes face → 8 emotion classes with confidence
4. **Gesture Detection** — MediaPipe checks for heart gesture (instant romantic mood)
5. **Adaptive Buffering** — Collects 3-8 frames with early exit if confident
6. **Smoothing & Hysteresis** — Averages results to prevent rapid mood changes
7. **Final Mood** — Emotion mapped to app mood, sent to frontend

### Accuracy

- **Face Detection:** 82-88% accuracy (HSEmotion on AffectNet dataset)
- **Gesture Detection:** ~90% accuracy for heart gesture
- **Overall System:** ~85% mood detection accuracy in good lighting

---

## 🐛 Troubleshooting

**Issue:** `ModuleNotFoundError: No module named 'hsemotion_onnx'`  
**Solution:** Activate venv and run `pip install -r requirements.txt`

**Issue:** `FileNotFoundError: hand_landmarker.task`  
**Solution:** Run `python setup_enhanced_detection.py`

**Issue:** WebSocket connection failed  
**Solution:** Ensure backend is running on port 8000

**Issue:** Detection shows "no face" constantly  
**Solution:** Check camera permissions, improve lighting, move closer to camera

**Issue:** Python version compatibility errors  
**Solution:** Use Python 3.11.x exactly (`python --version`)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** and test locally
4. **Commit:** `git commit -m "Add: amazing feature"`
5. **Push:** `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (TypeScript/Python conventions)
- Test your changes thoroughly
- Update documentation if needed
- Keep commits focused and descriptive

---

## 👥 Team

| Name | Role | GitHub | LinkedIn |
|------|------|--------|----------|
| **Soumyadip Khan Sarkar** | Full-Stack Developer & AI Engineer | [@Soumyadip-03](https://github.com/Soumyadip-03) | [Profile](https://www.linkedin.com/in/soumyadip-khan-sarkar-8bbb6331b/) |
| **Sulagna Bhattacharya** | UI/UX Designer | [@Sulagna2005](https://github.com/Sulagna2005) | [Profile](https://www.linkedin.com/in/sulagna-bhattacharya-145993377/) |

---

## 📝 License

**Proprietary** — © 2026 Soumyadip Khan Sarkar. All Rights Reserved.

This project is not open source. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without explicit written permission from the author.

---

## 🙏 Acknowledgments

- **HSEmotion** — Efficient emotion recognition model
- **MediaPipe** — Google's hand gesture detection framework
- **Spotify** — Music streaming API
- **Firebase** — Authentication and database services
- **Next.js & FastAPI** — Excellent web frameworks

---

## 📧 Contact

For questions, feedback, or collaboration inquiries:

- **Email:** soumyadip.khansarkar@gmail.com
- **GitHub Issues:** [Report a bug](https://github.com/Soumyadip-03/MoodiFy/issues)

---

<div align="center">

**Made with ❤️ by Soumyadip**

[⬆ Back to Top](#moodify-)

</div>
