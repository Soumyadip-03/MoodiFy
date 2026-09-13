export type EmailTemplateType = "announcement" | "info" | "warning" | "success" | "news" | "custom";

export interface EmailData {
  title: string;
  body: string;
  userName: string;
  logoUrl?: string;
}

export function generateEmailHTML(type: EmailTemplateType, data: EmailData): string {
  if (type === "custom") {
    return data.body;
  }

  const config = {
    announcement: {
      color: "#FF6B35",
      bg: "#FFF0E8", // softer peach/orange
      label: "Announcement",
      icon: "📢"
    },
    info: {
      color: "#3B82F6",
      bg: "#EFF6FF",
      label: "Information",
      icon: "💡"
    },
    warning: {
      color: "#F43F5E", // Rose/Red
      bg: "#FFE4E6", // Very soft rose
      label: "Action Required",
      icon: "⚠️"
    },
    success: {
      color: "#10B981",
      bg: "#ECFDF5",
      label: "Success",
      icon: "✨"
    },
    news: {
      color: "#6366F1",
      bg: "#EEF2FF",
      label: "Latest News",
      icon: "📰"
    }
  }[type];

  const formattedBody = data.body.replace(/\n/g, "<br>");
  const logoImage = data.logoUrl 
    ? `<img src="${data.logoUrl}" alt="Logo" width="28" height="28" style="display: block; margin-right: 10px;" />`
    : `<span style="font-size: 24px; margin-right: 10px;">🎵</span>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Import Project Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Pacifico&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Pacifico&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 750px; margin: 40px auto; padding: 20px;">
        
        <!-- Main Card -->
        <div style="background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025); overflow: hidden;">
            
            <!-- Top Accent Banner -->
            <div style="background-color: ${config.color}; padding: 12px 36px; text-align: center;">
                <span style="font-size: 14px; font-family: 'Comfortaa', sans-serif; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${config.icon} <span style="margin-left: 6px;">${config.label}</span>
                </span>
            </div>

            <!-- Header -->
            <div style="padding: 28px 36px 0; display: flex; align-items: center;">
                <div style="display: flex; align-items: center;">
                    ${logoImage}
                    <span style="font-family: 'Pacifico', cursive; font-size: 26px; color: #111827; margin-top: -4px;">
                        Moodi<span style="color: #FF6B35;">Fy</span>
                    </span>
                </div>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px 36px 32px;">

                <!-- Title -->
                <h1 style="margin: 0 0 20px 0; font-family: 'Comfortaa', sans-serif; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">
                    ${data.title}
                </h1>
                
                <!-- Body -->
                <div style="font-family: 'Comfortaa', sans-serif; font-size: 15px; line-height: 1.7; color: #4B5563;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: #1F2937;">Hi ${data.userName},</p>
                    <div style="margin: 0; color: #4B5563;">
                        ${formattedBody}
                    </div>
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
                &copy; ${new Date().getFullYear()} MoodiFy. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>
  `.trim();
}

