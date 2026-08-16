"""
Setup script for enhanced mood detection system.

This script:
1. Installs required Python packages
2. Downloads the MediaPipe hand model
3. Verifies the installation

Run this once before starting the backend:
    python setup_enhanced_detection.py
"""

import subprocess
import sys
from pathlib import Path

def install_packages():
    """Install required Python packages."""
    print("📦 Installing required packages...")
    packages = [
        "hsemotion-onnx==0.3.1",
        "mediapipe>=0.10.14",
        "opencv-python-headless>=4.8.0",
        "numpy>=1.24.0",
    ]
    
    for package in packages:
        print(f"  Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    print("✅ All packages installed successfully!\n")

def download_mediapipe_model():
    """Download the MediaPipe hand landmarker model."""
    print("🤖 Downloading MediaPipe hand model...")
    
    try:
        from services.gesture_detection import download_model
        download_model()
        print("✅ MediaPipe model downloaded successfully!\n")
    except Exception as e:
        print(f"❌ Failed to download MediaPipe model: {e}")
        print("   You can manually download it from:")
        print("   https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task")
        print(f"   and place it in: backend/models/hand_landmarker.task\n")
        return False
    
    return True

def verify_installation():
    """Verify that all components are properly installed."""
    print("🔍 Verifying installation...")
    
    try:
        # Test imports
        import cv2
        import numpy as np
        from hsemotion_onnx.facial_emotions import HSEmotionRecognizer
        import mediapipe as mp
        
        print("  ✅ OpenCV imported")
        print("  ✅ NumPy imported")
        print("  ✅ HSEmotion imported")
        print("  ✅ MediaPipe imported")
        
        # Test HSEmotion model initialization
        print("\n  Testing HSEmotion model initialization...")
        import urllib.request  # Workaround for hsemotion bug
        recognizer = HSEmotionRecognizer(model_name="enet_b0_8_best_afew")
        print("  ✅ HSEmotion model loaded")
        
        # Check MediaPipe model file
        model_path = Path(__file__).parent / "models" / "hand_landmarker.task"
        if model_path.exists():
            print(f"  ✅ MediaPipe model found at {model_path}")
        else:
            print(f"  ⚠️  MediaPipe model not found at {model_path}")
            return False
        
        print("\n✅ All verifications passed!")
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Enhanced Mood Detection Setup")
    print("=" * 60)
    print()
    
    # Step 1: Install packages
    try:
        install_packages()
    except Exception as e:
        print(f"❌ Package installation failed: {e}")
        return 1
    
    # Step 2: Download MediaPipe model
    if not download_mediapipe_model():
        print("⚠️  Warning: MediaPipe model download failed")
        print("   Gesture detection will not work until the model is downloaded")
    
    # Step 3: Verify installation
    if verify_installation():
        print("\n" + "=" * 60)
        print("🎉 Setup complete! You can now start the backend:")
        print("   cd backend")
        print("   python -m uvicorn main:app --reload")
        print("=" * 60)
        return 0
    else:
        print("\n" + "=" * 60)
        print("⚠️  Setup completed with warnings")
        print("   Please check the error messages above")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
