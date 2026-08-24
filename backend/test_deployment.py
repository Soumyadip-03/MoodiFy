"""
Quick deployment test script - run locally before deploying to catch import errors
"""
import sys
import traceback

def test_imports():
    """Test all critical imports"""
    print("Testing imports...")
    
    try:
        print("  ✓ fastapi")
        from fastapi import FastAPI
        
        print("  ✓ uvicorn")
        import uvicorn
        
        print("  ✓ firebase_admin")
        import firebase_admin
        
        print("  ✓ opencv-python-headless")
        import cv2
        
        print("  ✓ numpy")
        import numpy
        
        print("  ✓ hsemotion-onnx")
        from hsemotion_onnx.facial_emotions import HSEmotionRecognizer
        
        print("  ✓ mediapipe")
        import mediapipe
        
        print("  ✓ websockets")
        import websockets
        
        print("  ✓ requests")
        import requests
        
        print("\n✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        traceback.print_exc()
        return False


def test_routes():
    """Test route imports"""
    print("\nTesting route imports...")
    
    try:
        print("  ✓ routes.auth")
        from routes import auth
        
        print("  ✓ routes.mood")
        from routes import mood
        
        print("  ✓ routes.spotify")
        from routes import spotify
        
        print("  ✓ routes.email")
        from routes import email
        
        print("\n✅ All route imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Route import failed: {e}")
        traceback.print_exc()
        return False


def test_services():
    """Test service imports"""
    print("\nTesting service imports...")
    
    try:
        print("  ✓ services.enhanced_face_detection")
        from services import enhanced_face_detection
        
        print("  ✓ services.gesture_detection")
        from services import gesture_detection
        
        print("  ✓ services.mood_mapper")
        from services import mood_mapper
        
        print("  ✓ services.adaptive_temporal_buffer")
        from services import adaptive_temporal_buffer
        
        print("  ✓ services.spotify_service")
        from services import spotify_service
        
        print("  ✓ services.email_service")
        from services import email_service
        
        print("\n✅ All service imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Service import failed: {e}")
        traceback.print_exc()
        return False


def test_main_app():
    """Test main app creation"""
    print("\nTesting main app...")
    
    try:
        from main import app
        print("  ✓ Main app created")
        print(f"  ✓ App title: {app.title}")
        print("\n✅ Main app test successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Main app test failed: {e}")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("MoodiFy Backend Deployment Test")
    print("=" * 60)
    
    all_passed = True
    
    all_passed = test_imports() and all_passed
    all_passed = test_routes() and all_passed
    all_passed = test_services() and all_passed
    all_passed = test_main_app() and all_passed
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED - Ready to deploy!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED - Fix errors before deploying")
        print("=" * 60)
        sys.exit(1)
