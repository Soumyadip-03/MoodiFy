"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, MouseEvent, useState, useEffect } from "react";
import { GitFork, Link as LinkIcon, FolderOpen } from "lucide-react";

// ── Wave SVG divider ──────────────────────────────────────────────────────────
function WaveDivider({ flip = false, isDark }: { flip?: boolean; isDark: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""}`} style={{ height: 56 }}>
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z"
          fill={isDark ? "#111111" : "#fff8f4"}
          fillOpacity="0.9"
        />
        <path
          d="M0,38 C360,10 720,52 1080,20 C1260,8 1380,36 1440,38 L1440,56 L0,56 Z"
          fill={isDark ? "#FF6B35" : "#FF6B35"}
          fillOpacity={isDark ? "0.06" : "0.08"}
        />
      </svg>
    </div>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;   // -0.5 → 0.5
    const y = (e.clientY - top)  / height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale3d(1.04,1.04,1.04)`;
    el.style.boxShadow = `${-x * 18}px ${y * 18}px 40px rgba(255,107,53,0.18)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    el.style.boxShadow = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transition: "transform 0.15s ease, box-shadow 0.15s ease", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

const STACK = [
  { icon: "⚛️",  label: "Next.js 14" },
  { icon: "🐍",  label: "FastAPI" },
  { icon: "🧠",  label: "deepface" },
  { icon: "🔥",  label: "Firebase" },
  { icon: "🎵",  label: "Spotify API" },
  { icon: "📷",  label: "OpenCV" },
  { icon: "🗄️",  label: "Firestore" },
  { icon: "🎨",  label: "Tailwind CSS" },
  { icon: "🔐",  label: "OAuth 2.0" },
  { icon: "🌐",  label: "WebSocket" },
];

const MOODS = [
  { emoji: "😊", mood: "Happy",      genres: "Pop · Dance",        color: "from-yellow-400/20 to-orange-400/10",  ring: "hover:ring-yellow-400/50" },
  { emoji: "😍", mood: "Upbeat",     genres: "Dance · Electronic",  color: "from-pink-400/20 to-rose-400/10",     ring: "hover:ring-pink-400/50" },
  { emoji: "😎", mood: "Chill",      genres: "Ambient · Lo-fi",     color: "from-blue-400/20 to-cyan-400/10",     ring: "hover:ring-blue-400/50" },
  { emoji: "😔", mood: "Melancholy", genres: "Indie · Sad",         color: "from-purple-400/20 to-violet-400/10", ring: "hover:ring-purple-400/50" },
  { emoji: "😌", mood: "Relaxing",   genres: "Acoustic · Sleep",    color: "from-green-400/20 to-teal-400/10",    ring: "hover:ring-green-400/50" },
  { emoji: "⚡", mood: "Energetic",  genres: "Rock · Workout",      color: "from-red-400/20 to-orange-500/10",    ring: "hover:ring-red-400/50" },
  { emoji: "😠", mood: "Intense",    genres: "Metal · Hardcore",    color: "from-gray-400/20 to-zinc-400/10",     ring: "hover:ring-gray-400/50" },
];

const STEPS = [
  {
    icon: "🎥",
    step: "01",
    title: "Allow Camera",
    desc: "One-click camera access. MoodiFy never stores your video — detection happens entirely on-device in real time.",
  },
  {
    icon: "🧠",
    step: "02",
    title: "AI Reads Your Face",
    desc: "deepface analyzes micro-expressions frame by frame and maps them to one of 7 emotional states in under a second.",
  },
  {
    icon: "🎵",
    step: "03",
    title: "Music Starts Playing",
    desc: "Spotify serves a personalized playlist blended with your listening history — perfectly tuned to how you feel right now.",
  },
];

const FEATURES = [
  { icon: "🔒", title: "Privacy First",       desc: "Your camera feed never leaves your device. Zero video storage, ever." },
  { icon: "⚡", title: "Under 1 Second",      desc: "Mood detected and playlist loaded before you can blink." },
  { icon: "🎯", title: "Personalized",        desc: "Blends your Spotify listening history with real-time mood for spot-on picks." },
  { icon: "🌍", title: "6 Languages",         desc: "Filter tracks by English, Hindi, Spanish, French, Japanese, or Korean." },
  { icon: "👑", title: "Premium Streaming",   desc: "Spotify Premium users get full-song playback directly inside MoodiFy." },
  { icon: "📊", title: "Mood History",        desc: "Track your emotional patterns over time with a weekly mood chart." },
];

const STATS = [
  { value: "7",   display: 7,     prefix: "",   suffix: "",  label: "Mood States" },
  { value: "< 1s",display: null,  prefix: "< ", suffix: "s", label: "Detection Speed" },
  { value: "6",   display: 6,     prefix: "",   suffix: "",  label: "Languages" },
  { value: "∞",   display: null,  prefix: "",   suffix: "",  label: "Tracks" },
];

function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const duration = 900;
      const step = Math.ceil(duration / target);
      const id = setInterval(() => {
        start++;
        setCount(start);
        if (start >= target) clearInterval(id);
      }, step);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function useTypewriter(text: string, speed = 68, startDelay = 520) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(id); setDone(true); }
      }, speed);
      return () => clearInterval(id);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const CREDITS_IMAGES = [
  { src: "/credits/Home.jpeg",     label: "Home — Mood Detection" },
  { src: "/credits/PlayList.jpeg", label: "Playlist Page" },
  { src: "/credits/History.jpeg",  label: "History Page" },
  { src: "/credits/Logo.jpeg",     label: "Brand Logo" },
];

const TEAM = [
  {
    name: "Soumyadip",
    role: "Full-Stack Developer & UI/UX",
    github: "https://github.com/Soumyadip-03",
    linkedin: "https://www.linkedin.com/in/soumyadip-khan-sarkar-8bbb6331b/",
    avatar: "https://avatars.githubusercontent.com/Soumyadip-03",
    desc: "Built MoodiFy end-to-end — from the FastAPI WebSocket emotion pipeline and Spotify OAuth integration to the Next.js frontend, Firestore data layer, and the full UI/UX design system.",
    designs: false,
  },
  {
    name: "Sulagna",
    role: "UI Designer",
    github: "https://github.com/Sulagna2005",
    linkedin: "https://www.linkedin.com/in/sulagna-bhattacharya-145993377/",
    avatar: "https://avatars.githubusercontent.com/Sulagna2005",
    desc: "Crafted the visual identity of MoodiFy — designing the brand logo, screen layouts, and the peach-orange design language that gives the app its warm, expressive feel.",
    designs: true,
  },
];

function SweepCard({
  front, back, className = "",
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border cursor-pointer ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Front */}
      <div className="relative z-10">{front}</div>

      {/* Sweep overlay — orange gradient wipes left→right */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
        style={{
          background: "linear-gradient(105deg, #ff8f5e 0%, #FF6B35 50%, #f05a20 100%)",
          clipPath: hovered ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
          transition: "clip-path 0.52s cubic-bezier(0.77,0,0.18,1)",
        }}
      />

      {/* Back — fades in after sweep covers the card */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-6 overflow-hidden"
        style={{
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease" + (hovered ? " 0.35s" : " 0s"),
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        {back}
      </div>
    </div>
  );
}

function CreditsSection({ isDark, card, text, muted, border }: { isDark: boolean; card: string; text: string; muted: string; border: string }) {
  const [showDesigns, setShowDesigns] = useState(false);

  const cardStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const cardSlide = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show:   { opacity: 1, y: 0,  scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
    exit:   { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <section id="credits" className={`py-24 transition-colors duration-300 ${isDark ? "bg-[#111111]" : "bg-[#fff8f4]"}`}>
      <div className="w-full px-[4vw]">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#FF6B35]">Credits</p>
          <h2 className={`text-4xl font-bold ${text}`}>The people behind MoodiFy</h2>
        </motion.div>

        {/* Team cards — reveal sweep */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
          {TEAM.map((member) => (
            <motion.div key={member.name} variants={fadeUp} className="h-full">
              <SweepCard
                className={`h-full min-h-[220px] ${card}`}
                front={
                  <div className="p-7 flex flex-col gap-4 min-h-[220px]">
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={member.avatar} alt={member.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-[#FF6B35]/40"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div>
                        <p className={`font-bold text-base ${text}`}>{member.name}</p>
                        <p className={`text-xs ${muted}`}>{member.role}</p>
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${muted}`}>{member.desc}</p>
                  </div>
                }
                back={
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.avatar} alt={member.name}
                      className="w-11 h-11 rounded-full object-cover ring-4 ring-white/40 shadow-lg flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="text-center">
                      <p className="font-bold text-sm text-white leading-tight">{member.name}</p>
                      <p className="text-[11px] text-white/70 mt-0.5">{member.role}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      <a href={member.github} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <GitFork size={12} /> GitHub
                      </a>
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <LinkIcon size={12} /> LinkedIn
                      </a>
                      {member.designs && (
                        <button
                          onClick={() => setShowDesigns(v => !v)}
                          className="flex items-center justify-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all ring-4 ring-white/60 hover:ring-white animate-pulse-ring"
                        >
                          <FolderOpen size={12} /> {showDesigns ? "Hide Designs" : "View Designs"}
                        </button>
                      )}
                    </div>
                  </>
                }
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Sliding design gallery */}
        <AnimatePresence>
          {showDesigns && (
            <motion.div
              key="designs"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.div
                variants={cardStagger}
                initial="hidden"
                animate="show"
                exit="exit"
                className="grid grid-cols-4 gap-4 max-w-5xl mx-auto mt-10"
              >
                {CREDITS_IMAGES.map((img, i) => (
                  <motion.div key={img.src} variants={cardSlide}
                    whileHover={{ scale: 1.04, rotate: i % 2 === 0 ? 1 : -1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="cursor-pointer group"
                  >
                    <div className={`relative rounded-2xl border overflow-hidden aspect-[4/3] shadow-lg group-hover:shadow-[#FF6B35]/25 group-hover:border-[#FF6B35]/60 transition-all duration-300 ${border}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <p className="text-white text-xs font-semibold">{img.label}</p>
                      </div>
                      <a
                        href={img.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                      >
                        <span className="text-white text-xs font-bold leading-none">&#8599;</span>
                      </a>
                    </div>
                    <p className={`text-xs text-center mt-2 font-medium ${muted}`}>{img.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

export default function LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg     = isDark ? "bg-[#0a0a0a]"                      : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]";
  const card   = isDark ? "bg-[#111111] border-[#2a2a2a]"     : "bg-white/80 border-[#FFDDD2]";
  const text   = isDark ? "text-white"                         : "text-[#3a2a20]";
  const muted  = isDark ? "text-[#aaa]"                        : "text-[#7A6055]";
  const border = isDark ? "border-[#2a2a2a]"                   : "border-[#FFDDD2]";
  const statBg = isDark ? "bg-[#111] border-[#2a2a2a]"        : "bg-white/70 border-[#FFDDD2]";
  const { displayed: typed, done: typeDone } = useTypewriter("tonight\u2019s playlist");

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${bg}`}>

      {/* ── Navbar ── */}
      <header className={`sticky top-0 z-50 w-screen left-0 border-b transition-colors duration-300 backdrop-blur-md ${isDark ? "bg-[#0a0a0a]/80 border-[#2a2a2a]" : "bg-white/60 border-[#FFDDD2]"}`}>
        <div className="w-full px-[4vw] py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="MoodiFy" width={36} height={36} className="rounded-full" />
            <span className="text-xl font-pacifico text-[#FF6B35]">MoodiFy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["How It Works", "Moods", "Features", "Credits"].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                className={`text-sm font-medium transition-colors hover:text-[#FF6B35] ${muted}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors ${isDark ? "border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#FF6B35]" : "border-[#FFDDD2] text-[#7A6055] hover:text-[#FF6B35] hover:border-[#FF6B35]"}`}>
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-semibold px-4 py-2 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] text-white transition-all hover:scale-105 shadow-md shadow-[#FF6B35]/30">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative w-full px-[4vw] pt-28 pb-24 flex flex-col items-center text-center gap-7 overflow-hidden">

          {/* SVG noise texture */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] opacity-[0.045]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
            }}
          />

          {/* Floating emoji particles */}
          <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
            {[
              { e: "😊", left: "8%",  delay: "0s",    dur: "9s",  size: "1.6rem" },
              { e: "😔", left: "20%", delay: "2.5s",  dur: "12s", size: "1.3rem" },
              { e: "⚡", left: "35%", delay: "1s",    dur: "8s",  size: "1.5rem" },
              { e: "😎", left: "52%", delay: "4s",    dur: "11s", size: "1.4rem" },
              { e: "😍", left: "67%", delay: "0.5s",  dur: "10s", size: "1.6rem" },
              { e: "😌", left: "80%", delay: "3s",    dur: "13s", size: "1.2rem" },
              { e: "😠", left: "92%", delay: "1.8s",  dur: "9.5s",size: "1.5rem" },
            ].map(({ e, left, delay, dur, size }) => (
              <span
                key={e}
                className="absolute bottom-0 select-none"
                style={{
                  left,
                  fontSize: size,
                  animation: `float-up ${dur} ${delay} ease-in-out infinite`,
                  opacity: 0,
                }}
              >{e}</span>
            ))}
          </div>

          {/* Animated gradient mesh */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className={`absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-3xl ${isDark ? "opacity-[0.18]" : "opacity-[0.22]"} bg-[#FF6B35]`}
              animate={{ x: [0, 60, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.15, 0.95, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className={`absolute top-1/2 -right-40 w-[440px] h-[440px] rounded-full blur-3xl ${isDark ? "opacity-[0.14]" : "opacity-[0.18]"} bg-orange-400`}
              animate={{ x: [0, -70, 40, 0], y: [0, 50, -60, 0], scale: [1, 0.9, 1.2, 1] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            />
            <motion.div
              className={`absolute -bottom-20 left-1/3 w-[380px] h-[380px] rounded-full blur-3xl ${isDark ? "opacity-[0.12]" : "opacity-[0.15]"} bg-rose-400`}
              animate={{ x: [0, 80, -50, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.92, 1] }}
              transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 6 }}
            />
            <motion.div
              className={`absolute top-10 right-1/4 w-[280px] h-[280px] rounded-full blur-3xl ${isDark ? "opacity-[0.10]" : "opacity-[0.12]"} bg-amber-300`}
              animate={{ x: [0, -40, 60, 0], y: [0, 60, -30, 0], scale: [1, 1.2, 0.88, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 9 }}
            />
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold text-[#FF6B35] border-[#FF6B35]/40 bg-[#FF6B35]/10">
            ✨ Powered by deepface + Spotify Web API
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="show"
            className={`text-6xl md:text-7xl font-bold leading-[1.1] max-w-3xl tracking-tight ${text}`}>
            Your face picks<br />
            <span className="font-pacifico text-[#FF6B35]">
              {typed}{!typeDone && <span className="animate-pulse">|</span>}
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
            className={`text-lg max-w-lg leading-relaxed ${muted}`}>
            MoodiFy reads your expression in real time via AI and instantly serves a Spotify playlist that matches exactly how you feel — no searching, no skipping.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mt-1">
            <Link href="/signup"
              className="px-9 py-3.5 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-semibold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF6B35]/30 animate-pulse-ring">
              Try It Free →
            </Link>
            <Link href="/login"
              className={`px-9 py-3.5 rounded-full border font-semibold text-sm transition-all hover:scale-105 ${isDark ? "border-[#2a2a2a] text-white hover:border-[#FF6B35]" : "border-[#FFDDD2] text-[#3a2a20] hover:border-[#FF6B35]"}`}>
              Sign In
            </Link>
          </motion.div>

          {/* Pipeline pill */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}
            className={`mt-6 flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-sm font-medium flex-wrap justify-center shadow-sm ${card}`}>
            {["📷 Webcam", "→", "🧠 deepface", "→", "😊 Mood", "→", "🎵 Spotify"].map((item, i) => (
              <span key={i} className={item === "→" ? `${muted} text-base px-1` : `${text} font-semibold`}>{item}</span>
            ))}
          </motion.div>
        </section>

        {/* ── Marquee Tech Stack ── */}
        <div className={`w-full overflow-hidden py-4 transition-colors duration-300 ${isDark ? "bg-[#0a0a0a]" : "bg-transparent"}`}>
          <div className="flex animate-marquee whitespace-nowrap w-max">
            {[...STACK, ...STACK].map((item, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 mx-3 px-4 py-1.5 rounded-full border text-xs font-semibold transition-colors duration-300
                  ${isDark ? "bg-[#111] border-[#2a2a2a] text-[#aaa]" : "bg-white/70 border-[#FFDDD2] text-[#7A6055]"}`}
              >
                <span>{item.icon}</span>{item.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <WaveDivider isDark={isDark} />
        <section className={`py-10 transition-colors duration-300 ${isDark ? "bg-[#111111]" : "bg-[#fff8f4]"}`}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="w-full px-[4vw] grid grid-cols-4 gap-4">
            {STATS.map(({ value, display, prefix, suffix, label }) => (
              <motion.div key={label} variants={fadeUp}>
                <TiltCard className={`rounded-2xl border p-5 flex flex-col items-center gap-1 ${statBg}`}>
                  <span className="text-3xl font-bold text-[#FF6B35]">
                    {display !== null
                      ? <CountUp target={display} prefix={prefix} suffix={suffix} />
                      : value}
                  </span>
                  <span className={`text-xs font-medium ${muted}`}>{label}</span>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <WaveDivider flip isDark={isDark} />

        {/* ── How It Works ── */}
        <section id="how-it-works" className="w-full px-[4vw] py-24">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#FF6B35]">How It Works</p>
            <h2 className={`text-4xl font-bold ${text}`}>Zero effort. Pure music.</h2>
            <p className={`mt-3 text-base max-w-md mx-auto ${muted}`}>From camera open to first beat in under three seconds.</p>
          </motion.div>

          <div className="relative">
            {/* Dashed connector line */}
            <motion.div
              className="absolute top-[52px] left-0 w-full pointer-events-none"
              initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}
            >
              <svg width="100%" height="4" className="overflow-visible">
                <motion.line
                  x1="16.67%" y1="2" x2="83.33%" y2="2"
                  stroke="#FF6B35" strokeWidth="2" strokeDasharray="8 6"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 600, opacity: 0 }}
                  whileInView={{ strokeDashoffset: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
                />
                {/* Arrow dots at 1/3 and 2/3 */}
                {["33.33%", "66.67%"].map((cx) => (
                  <motion.circle
                    key={cx} cx={cx} cy="2" r="4"
                    fill="#FF6B35"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                    style={{ transformOrigin: `${cx} 2px` }}
                  />
                ))}
              </svg>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="grid grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <TiltCard className={`relative rounded-2xl border p-8 flex flex-col gap-5 hover:border-[#FF6B35]/50 ${card}`}>
                    <span className="absolute top-6 right-6 text-5xl font-black text-[#FF6B35]/10 select-none">{step.step}</span>
                    <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/15 flex items-center justify-center text-3xl">
                      {step.icon}
                    </div>
                    <div>
                      <p className={`text-lg font-bold mb-2 ${text}`}>{step.title}</p>
                      <p className={`text-sm leading-relaxed ${muted}`}>{step.desc}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Mood Showcase ── */}
        <WaveDivider isDark={isDark} />
        <section id="moods" className={`py-24 transition-colors duration-300 ${isDark ? "bg-[#111111]" : "bg-[#fff8f4]"}`}>
          <div className="w-full px-[4vw]">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#FF6B35]">7 Moods</p>
              <h2 className={`text-4xl font-bold ${text}`}>Every feeling has its soundtrack</h2>
              <p className={`mt-3 text-base max-w-md mx-auto ${muted}`}>MoodiFy maps your expression to one of seven emotional states — each with its own curated genre blend.</p>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="grid grid-cols-7 gap-3">
              {MOODS.map(({ emoji, mood, genres, color, ring }) => (
                <motion.div key={mood} variants={fadeUp}>
                  <TiltCard className={`rounded-2xl border p-5 flex flex-col items-center gap-3 text-center ring-2 ring-transparent ${ring} cursor-default bg-gradient-to-br ${color} ${border} group`}>
                    <motion.span
                      className="text-4xl inline-block"
                      whileHover={{ scale: 1.4, y: -6 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    >{emoji}</motion.span>
                    <p className={`text-sm font-bold ${text}`}>{mood}</p>
                    <p className={`text-[10px] leading-relaxed ${muted}`}>{genres}</p>
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <WaveDivider flip isDark={isDark} />

        {/* ── Features Grid ── */}
        <section id="features" className="w-full px-[4vw] py-24">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#FF6B35]">Features</p>
            <h2 className={`text-4xl font-bold ${text}`}>Built for music lovers</h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}>
                <TiltCard className={`rounded-2xl border p-6 flex gap-4 items-start hover:border-[#FF6B35]/50 ${card}`}>
                  <div className="w-11 h-11 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center text-2xl flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className={`font-bold text-sm mb-1 ${text}`}>{title}</p>
                    <p className={`text-xs leading-relaxed ${muted}`}>{desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Credits ── */}
        <WaveDivider isDark={isDark} />
        <CreditsSection isDark={isDark} card={card} text={text} muted={muted} border={border} />
        <WaveDivider flip isDark={isDark} />

        {/* ── CTA Banner ── */}
        <section className="w-full px-[4vw] py-24">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-[#FF6B35] via-[#f05a20] to-[#c94a10] overflow-hidden shadow-2xl shadow-[#FF6B35]/30">

            {/* Noise texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: "128px 128px",
              }}
            />

            {/* Soft bg blobs */}
            <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#c94a10]/60 blur-3xl" />

            <div className="relative z-10 grid grid-cols-2 items-center gap-0">

              {/* Left — text + buttons */}
              <div className="flex flex-col gap-6 p-14">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Ready to vibe?</p>
                <h2 className="text-5xl font-bold text-white leading-[1.15]">
                  Your mood.<br />Your music.<br />
                  <span className="font-pacifico text-[1.15em]">Right now.</span>
                </h2>
                <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                  No playlists to build. No genres to pick. Just open MoodiFy, look at the camera, and let the music find you.
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <Link href="/signup"
                    className="px-8 py-3.5 rounded-full bg-white text-[#FF6B35] font-bold text-sm hover:bg-[#FFF5F0] transition-all hover:scale-105 shadow-xl shadow-black/20">
                    Create Free Account →
                  </Link>
                  <Link href="/login"
                    className="px-8 py-3.5 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:border-white/70 hover:bg-white/10 transition-all">
                    Sign In
                  </Link>
                </div>
                <p className="text-white/40 text-xs">No credit card required · Free forever for core features</p>
              </div>

              {/* Right — floating emoji orb */}
              <div className="relative flex items-center justify-center h-full min-h-[340px]">
                {/* Glowing orb */}
                <div className="absolute w-52 h-52 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute w-36 h-36 rounded-full bg-amber-200/20 blur-xl" />

                {/* Orbiting emojis */}
                {[
                  { e: "😊", angle: 0,   r: 100, dur: 14 },
                  { e: "😔", angle: 90,  r: 110, dur: 18 },
                  { e: "⚡", angle: 180, r: 95,  dur: 12 },
                  { e: "😎", angle: 270, r: 105, dur: 16 },
                ].map(({ e, angle, r, dur }) => (
                  <motion.span
                    key={e}
                    className="absolute text-2xl select-none"
                    animate={{ rotate: 360 }}
                    transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
                    style={{
                      transformOrigin: "center",
                      x: Math.cos((angle * Math.PI) / 180) * r,
                      y: Math.sin((angle * Math.PI) / 180) * r,
                    }}
                  >{e}</motion.span>
                ))}

                {/* Centre logo */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30">
                  <Image src="/logo.png" alt="MoodiFy" width={44} height={44} className="rounded-full" />
                </div>
              </div>

            </div>
          </motion.div>
        </section>

      </main>

      {/* ── Footer ── */}
      <WaveDivider isDark={isDark} />
      <footer className={`w-screen left-0 py-5 transition-colors duration-300 ${isDark ? "bg-[#111111]" : "bg-[#fff8f4]"}`}>
        <div className="w-full px-[4vw] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="MoodiFy" width={28} height={28} className="rounded-full" />
            <span className="font-pacifico text-[#FF6B35] text-base">MoodiFy</span>
            <span className={`text-xs ${muted}`}>— AI Mood-Based Music Player</span>
          </div>
          <span className={`text-xs ${muted}`}>© 2026 Soumyadip Khan Sarkar</span>
        </div>
      </footer>

    </div>
  );
}
