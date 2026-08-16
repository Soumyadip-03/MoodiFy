"""
MoodiFy Email Service
Sends official admin messages via Gmail SMTP
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from datetime import datetime


class EmailService:
    """Service for sending official MoodiFy emails"""
    
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not self.smtp_email or not self.smtp_password:
            print("⚠️  Warning: Email credentials not configured. Check .env file.")
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email from MoodiFy official account
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body_text: Plain text body
            body_html: HTML body (optional)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not self.smtp_email or not self.smtp_password:
            print("❌ Email not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"MoodiFy <{self.smtp_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)
            
            # Attach plain text
            part_text = MIMEText(body_text, 'plain', 'utf-8')
            msg.attach(part_text)
            
            # Attach HTML if provided
            if body_html:
                part_html = MIMEText(body_html, 'html', 'utf-8')
                msg.attach(part_html)
            
            # Build recipient list
            recipients = [to_email]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_email, self.smtp_password)
                server.sendmail(self.smtp_email, recipients, msg.as_string())
            
            print(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Email send failed: {e}")
            return False
    
    def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new users"""
        subject = "Welcome to MoodiFy! 🎵"
        
        body_text = f"""
Hi {user_name}!

Welcome to MoodiFy — where your emotions meet the perfect soundtrack!

🎭 What's Next?
1. Connect your Spotify Premium account
2. Allow camera access for mood detection
3. Let AI read your face and play music that matches your vibe

💡 Pro Tip: MoodiFy works best with Spotify Premium for seamless playback.

Need help? Reply to this email or visit our support page.

Enjoy the vibes,
The MoodiFy Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F4; color: #3a2a20;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #f05a20 100%); padding: 32px 24px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: white; margin-bottom: 8px;">
                🎵 MoodiFy
            </div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.9);">
                Your emotions, your soundtrack
            </div>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #3a2a20;">
                Hi {user_name}! 👋
            </h2>
            
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #5a3e2b;">
                Welcome to <strong>MoodiFy</strong> — where your emotions meet the perfect soundtrack! We're excited to have you on board.
            </p>
            
            <div style="background: #FFF5F0; border-left: 4px solid #FF6B35; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <div style="font-size: 16px; font-weight: 700; color: #FF6B35; margin-bottom: 12px;">
                    🎭 What's Next?
                </div>
                <ol style="margin: 0; padding-left: 20px; color: #5a3e2b; font-size: 14px; line-height: 1.8;">
                    <li>Connect your Spotify Premium account</li>
                    <li>Allow camera access for mood detection</li>
                    <li>Let AI read your face and play music that matches your vibe</li>
                </ol>
            </div>
            
            <div style="background: #FFF8F4; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <div style="font-size: 14px; color: #7A6055;">
                    <strong>💡 Pro Tip:</strong> MoodiFy works best with Spotify Premium for seamless playback.
                </div>
            </div>
            
            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #7A6055;">
                Need help? Simply reply to this email or visit our support page.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #FFF8F4; padding: 24px; text-align: center; border-top: 1px solid #FFDDD2;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #3a2a20;">
                Enjoy the vibes! 🎶
            </p>
            <p style="margin: 0; font-size: 12px; color: #7A6055;">
                The MoodiFy Team
            </p>
        </div>
        
    </div>
</body>
</html>
        """.strip()
        
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_signin_email(self, user_email: str, user_name: str, signin_time: str, device_info: str = "Unknown device") -> bool:
        """Send sign-in notification email"""
        subject = "New Sign-In to Your MoodiFy Account"
        
        body_text = f"""
Hi {user_name},

We noticed a new sign-in to your MoodiFy account.

Time: {signin_time}
Device: {device_info}

If this was you, you can safely ignore this email.

If you didn't sign in, please secure your account immediately:
1. Change your password
2. Review recent activity
3. Contact us at notification.moodify@gmail.com

Stay secure,
The MoodiFy Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F4; color: #3a2a20;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #f05a20 100%); padding: 24px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: white;">
                🔐 MoodiFy
            </div>
        </div>
        
        <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #3a2a20;">
                Hi {user_name},
            </h2>
            
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #5a3e2b;">
                We noticed a new sign-in to your MoodiFy account.
            </p>
            
            <div style="background: #FFF5F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 13px; color: #7A6055; margin-bottom: 8px;">
                    <strong>Time:</strong> {signin_time}
                </div>
                <div style="font-size: 13px; color: #7A6055;">
                    <strong>Device:</strong> {device_info}
                </div>
            </div>
            
            <p style="margin: 16px 0; font-size: 14px; line-height: 1.6; color: #5a3e2b;">
                If this was you, you can safely ignore this email.
            </p>
            
            <div style="background: #FFF8F4; border-left: 4px solid #FF6B35; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <div style="font-size: 14px; font-weight: 700; color: #FF6B35; margin-bottom: 8px;">
                    ⚠️ Wasn't you?
                </div>
                <ol style="margin: 0; padding-left: 20px; color: #5a3e2b; font-size: 13px; line-height: 1.8;">
                    <li>Change your password immediately</li>
                    <li>Review recent activity in your account</li>
                    <li>Contact us at notification.moodify@gmail.com</li>
                </ol>
            </div>
        </div>
        
        <div style="background: #FFF8F4; padding: 20px; text-align: center; border-top: 1px solid #FFDDD2;">
            <p style="margin: 0; font-size: 12px; color: #7A6055;">
                Stay secure,<br>The MoodiFy Team
            </p>
        </div>
        
    </div>
</body>
</html>
        """.strip()
        
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_profile_update_email(self, user_email: str, user_name: str, update_type: str) -> bool:
        """Send profile update notification"""
        subject = f"MoodiFy Profile Update: {update_type}"
        
        body_text = f"""
Hi {user_name},

Your MoodiFy profile has been updated.

Change: {update_type}

If you didn't make this change, please contact us immediately at notification.moodify@gmail.com

Best regards,
The MoodiFy Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F4; color: #3a2a20;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #f05a20 100%); padding: 24px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: white;">
                ✏️ MoodiFy
            </div>
        </div>
        
        <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #3a2a20;">
                Profile Updated
            </h2>
            
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #5a3e2b;">
                Hi {user_name}, your MoodiFy profile has been updated.
            </p>
            
            <div style="background: #FFF5F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 14px; color: #7A6055;">
                    <strong>Change:</strong> {update_type}
                </div>
            </div>
            
            <p style="margin: 16px 0; font-size: 14px; line-height: 1.6; color: #7A6055;">
                If you didn't make this change, please contact us immediately at <a href="mailto:notification.moodify@gmail.com" style="color: #FF6B35;">notification.moodify@gmail.com</a>
            </p>
        </div>
        
        <div style="background: #FFF8F4; padding: 20px; text-align: center; border-top: 1px solid #FFDDD2;">
            <p style="margin: 0; font-size: 12px; color: #7A6055;">
                Best regards,<br>The MoodiFy Team
            </p>
        </div>
        
    </div>
</body>
</html>
        """.strip()
        
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_settings_update_email(self, user_email: str, user_name: str, settings: dict) -> bool:
        """Send settings update notification with all current settings"""
        subject = "MoodiFy Settings Updated"
        
        settings_text = "\n".join([f"- {key}: {value}" for key, value in settings.items()])
        settings_html = "".join([f"<div style='margin-bottom: 8px;'><strong>{key}:</strong> {value}</div>" for key, value in settings.items()])
        
        body_text = f"""
Hi {user_name},

Your MoodiFy settings have been updated. Here are your current settings:

{settings_text}

If you didn't make these changes, please contact us at notification.moodify@gmail.com

Best regards,
The MoodiFy Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F4; color: #3a2a20;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #f05a20 100%); padding: 24px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: white;">
                ⚙️ MoodiFy
            </div>
        </div>
        
        <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #3a2a20;">
                Settings Updated
            </h2>
            
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #5a3e2b;">
                Hi {user_name}, your MoodiFy settings have been updated. Here are your current settings:
            </p>
            
            <div style="background: #FFF5F0; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 14px; color: #5a3e2b;">
                {settings_html}
            </div>
            
            <p style="margin: 16px 0; font-size: 14px; line-height: 1.6; color: #7A6055;">
                If you didn't make these changes, please contact us at <a href="mailto:notification.moodify@gmail.com" style="color: #FF6B35;">notification.moodify@gmail.com</a>
            </p>
        </div>
        
        <div style="background: #FFF8F4; padding: 20px; text-align: center; border-top: 1px solid #FFDDD2;">
            <p style="margin: 0; font-size: 12px; color: #7A6055;">
                Best regards,<br>The MoodiFy Team
            </p>
        </div>
        
    </div>
</body>
</html>
        """.strip()
        
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_account_deletion_email(self, user_email: str, user_name: str) -> bool:
        """Send account deletion confirmation"""
        subject = "Your MoodiFy Account Has Been Deleted"
        
        body_text = f"""
Hi {user_name},

We're sad to see you go. Your MoodiFy account has been permanently deleted.

All your data including:
- Profile information
- Mood history
- Playlists and liked tracks
- Settings and preferences

...has been removed from our servers.

If you change your mind, you're always welcome back! Simply create a new account at https://moodify.app

We'd love to hear why you left. Reply to this email with your feedback.

Take care,
The MoodiFy Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F4; color: #3a2a20;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #f05a20 100%); padding: 24px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: white;">
                👋 MoodiFy
            </div>
        </div>
        
        <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #3a2a20;">
                Account Deleted
            </h2>
            
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #5a3e2b;">
                Hi {user_name}, we're sad to see you go. Your MoodiFy account has been permanently deleted.
            </p>
            
            <div style="background: #FFF5F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="font-size: 14px; font-weight: 600; color: #3a2a20; margin-bottom: 12px;">
                    All your data has been removed:
                </div>
                <ul style="margin: 0; padding-left: 20px; color: #5a3e2b; font-size: 14px; line-height: 1.8;">
                    <li>Profile information</li>
                    <li>Mood history</li>
                    <li>Playlists and liked tracks</li>
                    <li>Settings and preferences</li>
                </ul>
            </div>
            
            <p style="margin: 16px 0; font-size: 14px; line-height: 1.6; color: #5a3e2b;">
                If you change your mind, you're always welcome back! Simply create a new account.
            </p>
            
            <p style="margin: 16px 0; font-size: 14px; line-height: 1.6; color: #7A6055;">
                We'd love to hear why you left. Reply to this email with your feedback.
            </p>
        </div>
        
        <div style="background: #FFF8F4; padding: 20px; text-align: center; border-top: 1px solid #FFDDD2;">
            <p style="margin: 0; font-size: 12px; color: #7A6055;">
                Take care,<br>The MoodiFy Team
            </p>
        </div>
        
    </div>
</body>
</html>
        """.strip()
        
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_announcement(
        self,
        user_email: str,
        user_name: str,
        announcement_title: str,
        announcement_body: str
    ) -> bool:
        """Send announcement to user"""
        subject = f"MoodiFy Announcement: {announcement_title}"
        
        body_text = f"""
Hi {user_name},

{announcement_body}

Best regards,
The MoodiFy Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F4; color: #3a2a20;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #f05a20 100%); padding: 24px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: white;">
                🎵 MoodiFy
            </div>
        </div>
        
        <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #3a2a20;">
                Hi {user_name},
            </h2>
            
            <h3 style="margin: 24px 0 16px 0; font-size: 18px; font-weight: 700; color: #FF6B35;">
                {announcement_title}
            </h3>
            
            <div style="font-size: 15px; line-height: 1.6; color: #5a3e2b;">
                {announcement_body.replace(chr(10), '<br>')}
            </div>
        </div>
        
        <div style="background: #FFF8F4; padding: 24px; text-align: center; border-top: 1px solid #FFDDD2;">
            <p style="margin: 0; font-size: 12px; color: #7A6055;">
                Best regards,<br>The MoodiFy Team
            </p>
        </div>
        
    </div>
</body>
</html>
        """.strip()
        
        return self.send_email(user_email, subject, body_text, body_html)


# Singleton instance
email_service = EmailService()
