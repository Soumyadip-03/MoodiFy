"""
Email API Routes for MoodiFy
Admin endpoints for sending official emails
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from services.email_service import email_service

router = APIRouter(prefix="/api/email", tags=["email"])


class SendEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    body_text: str
    body_html: Optional[str] = None


class SendWelcomeEmailRequest(BaseModel):
    user_email: EmailStr
    user_name: str


class SendAnnouncementRequest(BaseModel):
    user_email: EmailStr
    user_name: str
    announcement_title: str
    announcement_body: str


def verify_admin_token(authorization: str = Header(None)) -> bool:
    """Verify admin authentication"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    admin_secret = os.getenv("ADMIN_SECRET")
    
    if token != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    
    return True


@router.post("/send")
async def send_custom_email(
    request: SendEmailRequest,
    authorization: str = Header(None)
):
    """
    Send a custom email (Admin only)
    
    Requires admin authentication via Authorization header:
    Authorization: Bearer YOUR_ADMIN_SECRET
    """
    verify_admin_token(authorization)
    
    success = email_service.send_email(
        to_email=request.to_email,
        subject=request.subject,
        body_text=request.body_text,
        body_html=request.body_html
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"message": "Email sent successfully", "to": request.to_email}


@router.post("/welcome")
async def send_welcome_email(
    request: SendWelcomeEmailRequest
):
    """
    Send welcome email to new user
    No auth required - called automatically after signup
    """
    success = email_service.send_welcome_email(
        user_email=request.user_email,
        user_name=request.user_name
    )
    
    if not success:
        # Don't fail the signup if email fails
        return {"message": "Welcome email failed (non-critical)", "sent": False}
    
    return {"message": "Welcome email sent successfully", "to": request.user_email, "sent": True}


@router.post("/announcement")
async def send_announcement_email(
    request: SendAnnouncementRequest,
    authorization: str = Header(None)
):
    """
    Send announcement email to user (Admin only)
    
    Requires admin authentication via Authorization header:
    Authorization: Bearer YOUR_ADMIN_SECRET
    """
    verify_admin_token(authorization)
    
    success = email_service.send_announcement(
        user_email=request.user_email,
        user_name=request.user_name,
        announcement_title=request.announcement_title,
        announcement_body=request.announcement_body
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send announcement")
    
    return {"message": "Announcement sent successfully", "to": request.user_email}


@router.post("/signin-notification")
async def send_signin_notification(
    user_email: EmailStr,
    user_name: str,
    signin_time: str,
    device_info: str = "Unknown device"
):
    """
    Send sign-in notification (called by frontend after successful login)
    No auth required - called automatically
    """
    success = email_service.send_signin_email(
        user_email=user_email,
        user_name=user_name,
        signin_time=signin_time,
        device_info=device_info
    )
    
    if not success:
        # Don't fail the login if email fails
        return {"message": "Sign-in notification failed (non-critical)", "sent": False}
    
    return {"message": "Sign-in notification sent", "sent": True}


@router.post("/profile-update-notification")
async def send_profile_update_notification(
    user_email: EmailStr,
    user_name: str,
    update_type: str
):
    """
    Send profile update notification
    No auth required - called automatically after profile updates
    """
    success = email_service.send_profile_update_email(
        user_email=user_email,
        user_name=user_name,
        update_type=update_type
    )
    
    if not success:
        return {"message": "Profile update notification failed (non-critical)", "sent": False}
    
    return {"message": "Profile update notification sent", "sent": True}


@router.post("/settings-update-notification")
async def send_settings_update_notification(
    user_email: EmailStr,
    user_name: str,
    settings: dict
):
    """
    Send settings update notification with all current settings
    No auth required - called automatically after settings updates
    """
    success = email_service.send_settings_update_email(
        user_email=user_email,
        user_name=user_name,
        settings=settings
    )
    
    if not success:
        return {"message": "Settings update notification failed (non-critical)", "sent": False}
    
    return {"message": "Settings update notification sent", "sent": True}


@router.post("/account-deletion-notification")
async def send_account_deletion_notification(
    user_email: EmailStr,
    user_name: str
):
    """
    Send account deletion confirmation
    No auth required - called automatically after account deletion
    """
    success = email_service.send_account_deletion_email(
        user_email=user_email,
        user_name=user_name
    )
    
    if not success:
        return {"message": "Account deletion notification failed (non-critical)", "sent": False}
    
    return {"message": "Account deletion notification sent", "sent": True}


@router.get("/test")
async def test_email_config(authorization: str = Header(None)):
    """
    Test email configuration (Admin only)
    
    Requires admin authentication via Authorization header:
    Authorization: Bearer YOUR_ADMIN_SECRET
    """
    verify_admin_token(authorization)
    
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_email or not smtp_password:
        return {
            "configured": False,
            "message": "Email credentials not configured in .env file"
        }
    
    return {
        "configured": True,
        "smtp_email": smtp_email,
        "message": "Email service is configured"
    }

