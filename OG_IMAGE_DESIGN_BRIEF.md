# MoodiFy — OG Image Design Brief

**Designer:** Sulagna  
**Date:** August 2026
**Project:** MoodiFy Social Media Share Images

---

## 📋 **What We Need**

Create **2 images** for social media link previews (Open Graph):

1. **Facebook/LinkedIn/WhatsApp Image** — `og-image.png`
   - Size: **1200 x 630 pixels**
   - Format: PNG or JPG

2. **Twitter/X Card Image** — `twitter-image.png`
   - Size: **1200 x 600 pixels** (slightly shorter)
   - Format: PNG or JPG

---

## 🎨 **Design Specifications**

### **Layout Structure**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                 ┃
┃   🌅 GRADIENT BACKGROUND                       ┃
┃   (Peach → Orange: #FFE8D6 → #FF6B35)         ┃
┃                                                 ┃
┃   ┌─────────────────────────────────────┐     ┃
┃   │                                     │     ┃
┃   │   🪩 [Disco Ball]                   │     ┃
┃   │   (Left side, medium size)          │     ┃
┃   │                                     │     ┃
┃   │         MoodiFy                     │     ┃
┃   │   (Pacifico font, 100-120px)       │     ┃
┃   │                                     │     ┃
┃   │   AI Mood-Based Music Player       │     ┃
┃   │   (Comfortaa font, 36-42px)        │     ┃
┃   │                                     │     ┃
┃   │   😊 😢 😍 😌 😠 🎉 💪              │     ┃
┃   │   (7 mood emojis in a row)         │     ┃
┃   │                                     │     ┃
┃   │   Detect your mood • Get playlists │     ┃
┃   │   (Small tagline, 24-28px)         │     ┃
┃   │                                     │     ┃
┃   └─────────────────────────────────────┘     ┃
┃                                                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎨 **Color Palette**

| Element | Color | Hex Code |
|---------|-------|----------|
| **Background Gradient** | Peach to Orange | `#FFE8D6` → `#FF6B35` |
| **Primary Text (Logo)** | White | `#FFFFFF` |
| **Secondary Text** | White / Light Cream | `#FFFFFF` or `#FFF5F0` |
| **Accent** | Orange | `#FF6B35` |
| **Optional Dark Text** | Dark Brown | `#3a2a20` |

**Gradient Direction:** Diagonal (135° or top-left to bottom-right)

---

## 📝 **Typography**

### **Logo Text: "MoodiFy"**
- **Font:** Pacifico (same as app logo)
- **Size:** 100-120px
- **Weight:** Regular
- **Color:** White (`#FFFFFF`)
- **Effect:** Subtle drop shadow for depth
  - Shadow: 2px offset, 8px blur, `rgba(0,0,0,0.3)`

### **Tagline: "AI Mood-Based Music Player"**
- **Font:** Comfortaa (same as app body text)
- **Size:** 36-42px
- **Weight:** SemiBold (600)
- **Color:** White (`#FFFFFF`)
- **Effect:** Light drop shadow
  - Shadow: 1px offset, 4px blur, `rgba(0,0,0,0.2)`

### **Sub-tagline: "Detect your mood • Get playlists"**
- **Font:** Comfortaa
- **Size:** 24-28px
- **Weight:** Regular (400)
- **Color:** White with 90% opacity or `#FFF5F0`
- **Effect:** Optional subtle shadow

---

## 🎭 **Visual Elements**

### **1. Disco Ball 🪩**
- **Position:** Left side, slightly above center
- **Size:** Medium (150-200px)
- **Style:** 3D, shiny, reflective disco ball
- **Effect:** Glowing aura or subtle orange glow around it
- **Source:** Use existing `disco-ball.png` from `/public/` or create new

### **2. Mood Emojis**
Display all 7 moods in a horizontal row:
- 😊 **Happy**
- 😢 **Melancholy**
- 😍 **Romantic**
- 😌 **Chill**
- 😠 **Intense**
- 🎉 **Upbeat**
- 💪 **Energetic** (or use 🔥)

**Size:** 48-60px each  
**Spacing:** 20-30px between emojis  
**Effect:** Optional subtle glow or shadow for depth

### **3. Optional: Musical Notes 🎵**
- Small decorative music notes scattered in background
- Very subtle, low opacity (10-20%)
- Don't distract from main content

---

## 📐 **Layout Guidelines**

### **Spacing & Alignment**
```
Top margin: 80-100px
Bottom margin: 80-100px
Left/Right padding: 100-120px

Vertical spacing between elements:
- Disco Ball → Logo: 40px
- Logo → Tagline: 20px
- Tagline → Emojis: 40px
- Emojis → Sub-tagline: 30px
```

### **Content Positioning**
- **Horizontal:** Center-aligned
- **Vertical:** Center-aligned (slight bias toward top 45%)
- **Disco Ball:** Left side, overlapping the left margin slightly
- **Text hierarchy:** Clear visual hierarchy with size contrast

---

## 🎯 **Design Goals**

1. **Eye-catching** — Should stand out in social media feeds
2. **Brand consistent** — Match existing MoodiFy UI design language
3. **Readable** — Text must be clear even at small sizes (thumbnails)
4. **Professional** — Modern, polished, trustworthy appearance
5. **Energetic** — Convey music, mood, and AI innovation

---

## ✨ **Style References**

### **Match These Existing MoodiFy Design Elements:**
1. **Landing Page Hero** — Similar gradient and vibe
2. **Logo Treatment** — Pacifico font with glow/shadow
3. **Color System** — Peach/orange theme with white text
4. **Mood Cards** — Emoji usage and styling
5. **Overall Aesthetic** — Modern, vibrant, friendly, tech-forward

### **Inspiration Style:**
- Modern SaaS landing pages (Spotify, Figma, Linear)
- Music streaming service branding (warm, inviting)
- AI product marketing (innovative, cutting-edge)

---

## 📦 **Deliverables**

### **Files to Create:**

1. **`og-image.png`**
   - Dimensions: 1200 x 630 pixels
   - Format: PNG (preferred) or JPG (quality 90+)
   - File size: Under 1MB
   - Use for: Facebook, LinkedIn, WhatsApp, Discord, Slack

2. **`twitter-image.png`**
   - Dimensions: 1200 x 600 pixels (30px shorter)
   - Format: PNG (preferred) or JPG (quality 90+)
   - File size: Under 1MB
   - Use for: Twitter/X card

3. **Optional: `og-image@2x.png`**
   - Dimensions: 2400 x 1260 pixels (2x resolution for retina)
   - For high-DPI displays

### **Save Location:**
Place files in:
```
MoodiFy/frontend/public/
├── og-image.png
└── twitter-image.png
```

---

## 🔍 **Design Checklist**

Before finalizing, ensure:

- [ ] Text is readable at 400px width (mobile preview size)
- [ ] All text has sufficient contrast (white on gradient background)
- [ ] Logo "MoodiFy" is the most prominent element
- [ ] Gradient flows smoothly without banding
- [ ] No important content in bottom 70px (can be cut off in some previews)
- [ ] File size under 1MB for fast loading
- [ ] Colors match MoodiFy brand palette exactly
- [ ] Fonts match app (Pacifico for logo, Comfortaa for body)
- [ ] Design looks good in both light and dark social media UI themes

---

## 🖼️ **Sample Mockup Description**

**What the final image should look like:**

> A vibrant 1200x630px banner with a diagonal peach-to-orange gradient background. On the left side, a 3D disco ball with a subtle glow. Center-aligned, large white "MoodiFy" text in elegant Pacifico font with a drop shadow. Below it, "AI Mood-Based Music Player" in smaller Comfortaa font. A row of 7 colorful mood emojis (😊😢😍😌😠🎉💪) sits below the tagline. At the bottom, small text reads "Detect your mood • Get playlists". The overall aesthetic is modern, energetic, and professional — perfect for sharing on social media.

---

## 📞 **Questions or Clarifications?**

If anything is unclear, reach out to Soumyadip.

**Design tools you can use:**
- Figma (recommended)
- Adobe Illustrator
- Canva Pro
- Photoshop
- Sketch

---

## 🎉 **Thank You, Sulagna!**

Your designs for the Home, Playlist, and History pages are beautiful. Can't wait to see the OG images! 🚀

---

**End of Brief**
