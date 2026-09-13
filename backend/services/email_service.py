import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
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

    def _generate_html_template(self, title: str, content_html: str, banner_color: str = "#FF6B35", banner_icon: str = "📢", banner_label: str = "ANNOUNCEMENT") -> str:
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Pacifico&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 750px; margin: 40px auto; padding: 20px;">
        <div style="background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025); overflow: hidden;">
            <!-- Top Accent Banner -->
            <div style="background-color: {banner_color}; padding: 12px 36px; text-align: center;">
                <span style="font-size: 14px; font-family: 'Comfortaa', sans-serif; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase;">
                    {banner_icon} <span style="margin-left: 6px;">{banner_label}</span>
                </span>
            </div>
            <!-- Header -->
            <div style="padding: 28px 36px 0; display: flex; align-items: center;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 24px; margin-right: 10px;">🎵</span>
                    <span style="font-family: 'Pacifico', cursive; font-size: 26px; color: #111827; margin-top: -4px;">
                        Moodi<span style="color: #FF6B35;">Fy</span>
                    </span>
                </div>
            </div>
            <!-- Content -->
            <div style="padding: 24px 36px 32px;">
                <h1 style="margin: 0 0 20px 0; font-family: 'Comfortaa', sans-serif; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">
                    {title}
                </h1>
                <div style="font-family: 'Comfortaa', sans-serif; font-size: 15px; line-height: 1.7; color: #4B5563;">
                    {content_html}
                </div>
            </div>
            <!-- Footer Divider -->
            <div style="border-top: 1px solid #F3F4F6; margin: 0 40px;"></div>
            <!-- Footer -->
            <div style="padding: 24px 36px; background-color: #FAFAFA;">
                <div style="margin: 0; font-size: 14px; color: #6B7280; font-weight: 500; font-family: 'Comfortaa', sans-serif;">
                    <p style="margin: 0 0 6px 0;">Best regards,</p>
                    <p style="margin: 0; color: #374151; font-weight: 700;">The MoodiFy Team</p>
                </div>
            </div>
        </div>
        <!-- Meta Footer -->
        <div style="text-align: center; margin-top: 24px; padding: 0 20px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #9CA3AF; font-family: 'Comfortaa', sans-serif;">
                You're receiving this email because you are a registered user of MoodiFy.
            </p>
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; font-family: 'Comfortaa', sans-serif;">
                &copy; {datetime.utcnow().year} MoodiFy. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        """.strip()

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[dict]] = None
    ) -> bool:
        if not self.smtp_email or not self.smtp_password:
            print("❌ Email not configured")
            return False
        
        try:
            msg = MIMEMultipart('mixed')
            alt_part = MIMEMultipart('alternative')
            
            msg['From'] = f"MoodiFy <{self.smtp_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)
            
            part_text = MIMEText(body_text, 'plain', 'utf-8')
            alt_part.attach(part_text)
            
            if body_html:
                part_html = MIMEText(body_html, 'html', 'utf-8')
                alt_part.attach(part_html)
                
            msg.attach(alt_part)
            
            if attachments:
                for att in attachments:
                    part = MIMEApplication(att['content'], Name=att['filename'])
                    part['Content-Disposition'] = f'attachment; filename="{att["filename"]}"'
                    msg.attach(part)
            
            recipients = [to_email]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)
            
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
        """.strip()
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi {user_name},</p>
<p style="margin: 0 0 16px 0;">Welcome to <strong>MoodiFy</strong> — where your emotions meet the perfect soundtrack! We're excited to have you on board.</p>
<div style="background-color: #F3F4F6; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
    <p style="margin: 0 0 8px 0; font-weight: 700; color: #111827;">🎭 What's Next?</p>
    <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 4px;">Connect your Spotify Premium account</li>
        <li style="margin-bottom: 4px;">Allow camera access for mood detection</li>
        <li>Let AI read your face and play music that matches your vibe</li>
    </ul>
</div>
<p style="margin: 0 0 16px 0; font-size: 14px;"><strong>💡 Pro Tip:</strong> MoodiFy works best with Spotify Premium for seamless playback.</p>
<p style="margin: 0;">Need help? Simply reply to this email or visit our support page.</p>
        """.strip()
        
        body_html = self._generate_html_template(
            title="Welcome to MoodiFy! 👋", 
            content_html=content_html,
            banner_color="#10B981", 
            banner_icon="✨", 
            banner_label="WELCOME"
        )
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_signin_email(self, user_email: str, user_name: str, signin_time: str, device_info: str = "Unknown device") -> bool:
        subject = "New Sign-In to Your MoodiFy Account"
        
        body_text = f"""
Hi {user_name},

We noticed a new sign-in to your MoodiFy account.
Time: {signin_time}
Device: {device_info}

If this was you, you can safely ignore this email.
If you didn't sign in, please secure your account immediately.
        """.strip()
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi {user_name},</p>
<p style="margin: 0 0 16px 0;">We noticed a new sign-in to your MoodiFy account.</p>
<div style="background-color: #F3F4F6; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 14px;">
    <strong>Time:</strong> {signin_time}<br>
    <strong>Device:</strong> {device_info}
</div>
<p style="margin: 0 0 16px 0;">If this was you, you can safely ignore this email.</p>
<p style="margin: 0;"><strong>⚠️ Wasn't you?</strong> Change your password immediately and contact us at notification.moodify@gmail.com</p>
        """.strip()
        
        body_html = self._generate_html_template(
            title="New Sign-In Detected", 
            content_html=content_html,
            banner_color="#3B82F6", 
            banner_icon="🔐", 
            banner_label="SECURITY ALERT"
        )
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_profile_update_email(self, user_email: str, user_name: str, update_type: str) -> bool:
        subject = f"MoodiFy Profile Update: {update_type}"
        
        body_text = f"""
Hi {user_name},

Your MoodiFy profile has been updated.
Change: {update_type}
        """.strip()
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi {user_name},</p>
<p style="margin: 0 0 16px 0;">Your MoodiFy profile has been updated.</p>
<div style="background-color: #F3F4F6; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 14px;">
    <strong>Change:</strong> {update_type}
</div>
<p style="margin: 0;">If you didn't make this change, please contact us immediately.</p>
        """.strip()
        
        body_html = self._generate_html_template(
            title="Profile Updated", 
            content_html=content_html,
            banner_color="#6366F1", 
            banner_icon="✏️", 
            banner_label="ACCOUNT UPDATE"
        )
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_settings_update_email(self, user_email: str, user_name: str, settings: dict) -> bool:
        subject = "MoodiFy Settings Updated"
        actual_settings = settings.get("settings", settings) if isinstance(settings, dict) else settings
        
        settings_text = "\\n".join([f"- {key}: {value}" for key, value in actual_settings.items()])
        settings_html = "".join([f"""
<div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;'>
    <strong style='color: #374151; font-size: 14px;'>{key}</strong> 
    <span style='color: #1F2937; background-color: #E5E7EB; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;'>{value}</span>
</div>""" for key, value in actual_settings.items()])
        
        body_text = f"""
Hi {user_name},

Your MoodiFy settings have been updated.
{settings_text}
        """.strip()
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi {user_name},</p>
<p style="margin: 0 0 16px 0;">Your MoodiFy settings have been updated. Here are your current settings:</p>
<div style="background-color: #F3F4F6; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 14px;">
    {settings_html}
</div>
<p style="margin: 0;">If you didn't make these changes, please contact us immediately.</p>
        """.strip()
        
        body_html = self._generate_html_template(
            title="Settings Updated", 
            content_html=content_html,
            banner_color="#6366F1", 
            banner_icon="⚙️", 
            banner_label="ACCOUNT UPDATE"
        )
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_account_deletion_email(self, user_email: str, user_name: str) -> bool:
        subject = "Your MoodiFy Account Has Been Deleted"
        
        body_text = f"""
Hi {user_name},

We're sad to see you go. Your account has been deleted.
        """.strip()
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi {user_name},</p>
<p style="margin: 0 0 16px 0;">We're sad to see you go. Your MoodiFy account has been permanently deleted.</p>
<p style="margin: 0 0 16px 0;">All your data (profile, mood history, playlists, settings) has been removed from our servers.</p>
<p style="margin: 0;">If you change your mind, you're always welcome back! Simply create a new account.</p>
        """.strip()
        
        body_html = self._generate_html_template(
            title="Account Deleted", 
            content_html=content_html,
            banner_color="#F43F5E", 
            banner_icon="👋", 
            banner_label="ACCOUNT REMOVED"
        )
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_announcement(self, user_email: str, user_name: str, announcement_title: str, announcement_body: str) -> bool:
        subject = f"MoodiFy Announcement: {announcement_title}"
        
        body_text = f"""
Hi {user_name},

{announcement_body}
        """.strip()
        
        formatted_body = announcement_body.replace(chr(10), '<br>')
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi {user_name},</p>
<p style="margin: 0;">{formatted_body}</p>
        """.strip()
        
        body_html = self._generate_html_template(
            title=announcement_title, 
            content_html=content_html,
            banner_color="#FF6B35", 
            banner_icon="📢", 
            banner_label="ANNOUNCEMENT"
        )
        return self.send_email(user_email, subject, body_text, body_html)
    
    def send_feedback_email(self, user_email: str, user_name: str, message: str, attachments: Optional[List[dict]] = None) -> bool:
        subject = f"MoodiFy Feedback from {user_name}"
        
        body_text = f"""
New feedback received!
From: {user_name} ({user_email})
Message:
{message}
        """.strip()
        
        formatted_body = message.replace(chr(10), '<br>')
        
        content_html = f"""
<p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">From: {user_name} ({user_email})</p>
<div style="background-color: #F3F4F6; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 14px;">
    {formatted_body}
</div>
        """.strip()
        
        body_html = self._generate_html_template(
            title="Feedback Received", 
            content_html=content_html,
            banner_color="#FF6B35", 
            banner_icon="💬", 
            banner_label="USER FEEDBACK"
        )
        return self.send_email(self.smtp_email, subject, body_text, body_html, attachments=attachments)

# Singleton instance
email_service = EmailService()
