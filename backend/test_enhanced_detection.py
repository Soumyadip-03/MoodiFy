"""
Test script for enhanced mood detection system.

Tests each component individually and then the full pipeline.

Usage:
    python test_enhanced_detection.py
"""

import cv2
import numpy as np
import sys
from pathlib import Path

def test_enhanced_face_detection():
    """Test the enhanced face detection module."""
    print("\n" + "="*60)
    print("Testing Enhanced Face Detection...")
    print("="*60)
    
    try:
        from services.enhanced_face_detection import EnhancedEmotionDetector
        
        # Create detector
        detector = EnhancedEmotionDetector()
        print("✅ EnhancedEmotionDetector initialized")
        
        # Create a test image (black frame with a white circle for "face")
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.circle(test_frame, (320, 240), 100, (255, 255, 255), -1)
        
        # Analyze frame
        result = detector.analyze(test_frame)
        print(f"✅ Analysis completed:")
        print(f"   - Emotion: {result.emotion}")
        print(f"   - Confidence: {result.confidence:.2f}")
        print(f"   - Quality Score: {result.quality.quality_score}")
        print(f"   - Face Found: {result.quality.face_found}")
        print(f"   - Valence: {result.valence:.2f}")
        print(f"   - Arousal: {result.arousal:.2f}")
        print(f"   - Analysis Time: {result.analysis_ms:.1f}ms")
        
        return True
        
    except Exception as e:
        print(f"❌ Enhanced face detection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_mood_mapper():
    """Test the mood mapper module."""
    print("\n" + "="*60)
    print("Testing Mood Mapper...")
    print("="*60)
    
    try:
        from services.mood_mapper import map_emotion_to_mood, apply_gesture_override
        
        # Test gesture override
        gesture_result = apply_gesture_override(0.95)
        if gesture_result:
            print(f"✅ Gesture override works:")
            print(f"   - Mood: {gesture_result.mood}")
            print(f"   - Confidence: {gesture_result.confidence}")
            print(f"   - Source: {gesture_result.detection_source}")
        
        # Test emotion to mood mapping
        # Create a mock emotion result
        class MockEmotionResult:
            emotion = "happy"
            confidence = 0.85
            is_confident = True
            valence = 0.8
            arousal = 0.5
            analysis_ms = 100.0
        
        mood_result = map_emotion_to_mood(MockEmotionResult())
        print(f"✅ Emotion→Mood mapping works:")
        print(f"   - Emotion: happy → Mood: {mood_result.mood}")
        print(f"   - Confidence: {mood_result.confidence}")
        print(f"   - Source: {mood_result.detection_source}")
        
        return True
        
    except Exception as e:
        print(f"❌ Mood mapper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_adaptive_temporal_buffer():
    """Test the adaptive temporal buffer module."""
    print("\n" + "="*60)
    print("Testing Adaptive Temporal Buffer...")
    print("="*60)
    
    try:
        from services.adaptive_temporal_buffer import AdaptiveTemporalBuffer
        from services.enhanced_face_detection import EmotionResult, QualityReport
        
        # Create buffer
        buffer = AdaptiveTemporalBuffer(user_id="test_user")
        print("✅ AdaptiveTemporalBuffer initialized")
        
        # Add some mock frames (all "happy" with high confidence)
        for i in range(4):
            mock_result = EmotionResult(
                emotion="Happiness",
                confidence=0.85 + i * 0.02,
                is_confident=True,
                scores={"Happiness": 0.85},
                valence=0.8,
                arousal=0.5,
                quality=QualityReport(
                    quality_score=90,
                    blur_score=100.0,
                    brightness=128.0,
                    roll_angle_deg=0.0,
                    face_found=True,
                ),
                analysis_ms=50.0,
            )
            buffer.add_frame(mock_result)
            print(f"   Added frame {i+1}/4")
        
        # Check if should finalize
        should_finalize = buffer.should_finalize()
        print(f"✅ Should finalize: {should_finalize}")
        
        if should_finalize:
            smoothed = buffer.finalize()
            print(f"✅ Finalization successful:")
            print(f"   - Emotion: {smoothed.emotion}")
            print(f"   - Confidence: {smoothed.confidence:.2f}")
            print(f"   - Valence: {smoothed.valence:.2f}")
            print(f"   - Arousal: {smoothed.arousal:.2f}")
            print(f"   - Buffer Size: {smoothed.buffer_size}")
            print(f"   - Early Exit: {smoothed.early_exit}")
            print(f"   - Stability: {smoothed.stability.emotion_consistency:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Adaptive temporal buffer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_gesture_detection():
    """Test the gesture detection module."""
    print("\n" + "="*60)
    print("Testing Gesture Detection...")
    print("="*60)
    
    try:
        from services.gesture_detection import GestureDetector
        
        # Check if model exists
        model_path = Path(__file__).parent / "models" / "hand_landmarker.task"
        if not model_path.exists():
            print("⚠️  MediaPipe model not found. Run setup_enhanced_detection.py first.")
            print(f"   Expected location: {model_path}")
            return False
        
        print(f"✅ MediaPipe model found at {model_path}")
        
        # Create detector
        detector = GestureDetector()
        print("✅ GestureDetector initialized")
        
        # Create a test frame (black frame)
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Detect gestures (should return None or "none" since no hands present)
        result = detector.detect(test_frame)
        print(f"✅ Gesture detection works:")
        if result:
            print(f"   - Gesture: {result.gesture}")
            print(f"   - Confidence: {result.confidence:.2f}")
        else:
            print(f"   - No hands detected (expected for blank frame)")
        
        detector.close()
        return True
        
    except Exception as e:
        print(f"❌ Gesture detection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("="*60)
    print("Enhanced Mood Detection - Component Tests")
    print("="*60)
    
    results = []
    
    # Test each component
    results.append(("Enhanced Face Detection", test_enhanced_face_detection()))
    results.append(("Mood Mapper", test_mood_mapper()))
    results.append(("Adaptive Temporal Buffer", test_adaptive_temporal_buffer()))
    results.append(("Gesture Detection", test_gesture_detection()))
    
    # Print summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "="*60)
    if all_passed:
        print("🎉 All tests passed! System is ready to use.")
        print("="*60)
        return 0
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("="*60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
