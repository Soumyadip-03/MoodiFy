from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials, firestore
import os

# DEBUG: Print BEFORE any logic runs
print("=" * 80)
print("🔍 DEBUG: Checking Firebase environment variables...")
print(f"🔍 FIREBASE_PROJECT_ID = {os.getenv('FIREBASE_PROJECT_ID')}")
print(f"🔍 FIREBASE_CLIENT_EMAIL = {os.getenv('FIREBASE_CLIENT_EMAIL')}")
print(f"🔍 All env vars starting with FIREBASE_: {[k for k in os.environ.keys() if k.startswith('FIREBASE_')]}")
print(f"🔍 serviceAccountKey.json exists? {os.path.exists('serviceAccountKey.json')}")
print("=" * 80)

router = APIRouter()
security = HTTPBearer()

if not firebase_admin._apps:
    # Try loading from file first (for local development)
    cred_path = "serviceAccountKey.json"
    if os.path.exists(cred_path):
        print("✅ Using serviceAccountKey.json file")
        cred = credentials.Certificate(cred_path)
    elif os.getenv("FIREBASE_PROJECT_ID"):
        print("✅ Using environment variables for Firebase")
        # Production: Create credentials from environment variables
        import json
        
        # Get private key and handle newline escaping
        private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
        # Replace escaped newlines with actual newlines
        private_key = private_key.replace("\\n", "\n")
        
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": private_key,
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL"),
            "universe_domain": "googleapis.com"
        }
        cred = credentials.Certificate(cred_dict)
    else:
        raise FileNotFoundError(
            "Firebase credentials not found. "
            "Provide serviceAccountKey.json file or set Firebase environment variables."
        )
    firebase_admin.initialize_app(cred)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        decoded = auth.verify_id_token(credentials.credentials)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def verify_admin_token(authorization: str = Header(None)) -> bool:
    """Verify admin authentication"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    admin_secret = os.getenv("ADMIN_SECRET")
    
    if token != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    
    return True


@router.get("/api/auth/me")
def get_me(user: dict = Depends(verify_token)):
    return {"uid": user["uid"], "email": user.get("email")}


@router.get("/api/auth/users/all")
def get_all_users(authorization: str = Header(None)):
    """
    Get all registered users (Admin only)
    
    Requires admin authentication via Authorization header:
    Authorization: Bearer YOUR_ADMIN_SECRET
    """
    verify_admin_token(authorization)
    
    try:
        db = firestore.client()
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        user_list = []
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_list.append({
                "uid": user_doc.id,
                "email": user_data.get("email"),
                "displayName": user_data.get("displayName"),
                "createdAt": user_data.get("createdAt")
            })
        
        return {
            "users": user_list,
            "total": len(user_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

