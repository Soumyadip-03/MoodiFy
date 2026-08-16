import type { Metadata } from "next";
import { Pacifico, Comfortaa } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ArtistAlbumProvider } from "@/context/ArtistAlbumContext";
import { PlayerProvider } from "@/context/PlayerContext";
import ModalRenderer from "@/components/ui/ModalRenderer";
import { Toaster } from "sonner";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MoodiFy",
  description: "AI Mood-Based Music Player",
  icons: {
    icon: [
      { url: "/MoodiFy.svg", type: "image/svg+xml" },
      { url: "/MoodiFy.svg", sizes: "any" },
    ],
    apple: "/MoodiFy.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('moodify-theme');document.documentElement.setAttribute('data-theme',t||'dark');})();`,
          }}
        />
      </head>
      <body className={`${pacifico.variable} ${comfortaa.variable} font-comfortaa`}>
        <ThemeProvider>
          <AuthProvider>
            <ArtistAlbumProvider>
              <PlayerProvider>
                {children}
                <ModalRenderer />
                <Toaster 
                  position="bottom-right" 
                  expand={false}
                  richColors 
                  closeButton
                  duration={3000}
                />
              </PlayerProvider>
            </ArtistAlbumProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
