/**
 * Email Notification Utilities
 * Automatically send email notifications for user events
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Send welcome email to new user (call after signup)
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/email/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization needed - this is called automatically
      },
      body: JSON.stringify({
        user_email: userEmail,
        user_name: userName,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send welcome email:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send sign-in notification (call after successful login)
 */
export async function sendSignInNotification(
  userEmail: string,
  userName: string,
  deviceInfo?: string
): Promise<boolean> {
  try {
    const now = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Get device info from user agent
    const device = deviceInfo || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown device');

    const params = new URLSearchParams({
      user_email: userEmail,
      user_name: userName,
      signin_time: now,
      device_info: device,
    });

    const response = await fetch(`${BACKEND_URL}/api/email/signin-notification?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to send sign-in notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending sign-in notification:', error);
    return false;
  }
}

/**
 * Send profile update notification (call after profile changes)
 */
export async function sendProfileUpdateNotification(
  userEmail: string,
  userName: string,
  updateType: string
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      user_email: userEmail,
      user_name: userName,
      update_type: updateType,
    });

    const response = await fetch(`${BACKEND_URL}/api/email/profile-update-notification?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to send profile update notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending profile update notification:', error);
    return false;
  }
}

/**
 * Send settings update notification with all current settings
 */
export async function sendSettingsUpdateNotification(
  userEmail: string,
  userName: string,
  settings: Record<string, string | boolean | undefined>
): Promise<boolean> {
  try {
    // Format settings for email
    const formattedSettings: Record<string, string> = {};
    
    if (settings.trackTrendingEnabled !== undefined) {
      formattedSettings['Track Trending Plays'] = settings.trackTrendingEnabled ? 'Enabled' : 'Disabled';
    }
    if (settings.trackPlaylistEnabled !== undefined) {
      formattedSettings['Track Playlist Plays'] = settings.trackPlaylistEnabled ? 'Enabled' : 'Disabled';
    }
    if (settings.spotifyConnected !== undefined) {
      formattedSettings['Spotify Account'] = settings.spotifyConnected ? 'Connected' : 'Disconnected';
    }
    if (settings.animationsEnabled !== undefined) {
      formattedSettings['Animations'] = settings.animationsEnabled ? 'Enabled' : 'Disabled';
    }

    const params = new URLSearchParams({
      user_email: userEmail,
      user_name: userName,
    });

    const response = await fetch(`${BACKEND_URL}/api/email/settings-update-notification?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: formattedSettings,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send settings update notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending settings update notification:', error);
    return false;
  }
}

/**
 * Send account deletion confirmation (call before deleting account)
 */
export async function sendAccountDeletionNotification(
  userEmail: string,
  userName: string
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      user_email: userEmail,
      user_name: userName,
    });
    
    const response = await fetch(`${BACKEND_URL}/api/email/account-deletion-notification?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to send account deletion notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending account deletion notification:', error);
    return false;
  }
}
