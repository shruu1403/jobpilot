"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { FileText, Search, Briefcase, Users, Sparkles, Target, BarChart3, MessageSquare, Zap, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import rocketImg from "@/assets/rocket.png";

/* ── Constants ──────────────────────────────────── */

const STORAGE_KEY = "hasSeenIntroAnimation";

type Phase = "init" | "flying" | "landing" | "features" | "hero";

const SPARK_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#06B6D4",
  "#60A5FA",
  "#A78BFA",
  "#22D3EE",
];

const features = [
  {
    icon: FileText,
    icon2: Sparkles,
    label: "Resume Intelligence",
    title: "Resume Intelligence",
    main: "Know exactly what’s holding your resume back",
    sub: "Get instant feedback in seconds",
    hoverLine: "Higher interview chances",
    color: "#3B82F6",
    path: "/resumes",
    pos: { x: -220, y: -170 },
    mPos: { x: -120, y: -130 },
  },
  {
    icon: Target,
    label: "Smart Job Match",
    title: "Smart Job Match",
    main: "See how well you match before applying",
    sub: "Avoid blind applications",
    hoverLine: "Save hours of effort",
    color: "#8B5CF6",
    path: "/analyzer",
    pos: { x: 220, y: -170 },
    mPos: { x: 120, y: -130 },
  },
  {
    icon: BarChart3,
    label: "Track & Improve",
    title: "Track & Improve",
    main: "Turn your applications into results",
    sub: "Monitor and boost your success rate",
    hoverLine: "Improve outcomes faster",
    color: "#06B6D4",
    path: "/jobs",
    pos: { x: 220, y: 170 },
    mPos: { x: 120, y: 130 },
  },
  {
    icon: MessageSquare,
    label: "Get Referred Faster",
    title: "Get Referred Faster",
    main: "Messages that actually get replies",
    sub: "Stand out instantly",
    hoverLine: "Connect with insiders",
    color: "#10B981",
    path: "/referrals",
    pos: { x: -220, y: 170 },
    mPos: { x: -120, y: 130 },
  },
];

/* ── Helpers ────────────────────────────────────── */

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Component ──────────────────────────────────── */

export default function LandingPage() {
  const [phase, setPhase] = useState<Phase>("init");
  const [ready, setReady] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [mobile, setMobile] = useState(false);

  const [stars, setStars] = useState<
    { id: number; x: number; y: number; s: number; d: number; dl: number }[]
  >([]);
  const [particles, setParticles] = useState<
    {
      id: number;
      px: number;
      py: number;
      s: number;
      c: string;
      d: number;
      dl: number;
    }[]
  >([]);

  const rocketCtrl = useAnimation();
  const glowCtrl = useAnimation();
  const alive = useRef(true);

  /* ── Boot ──────────────────────────────────── */

  useEffect(() => {
    const mob = window.innerWidth < 768;
    setMobile(mob);

    // Stars
    setStars(
      Array.from({ length: mob ? 35 : 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 0.8,
        d: Math.random() * 4 + 2,
        dl: Math.random() * 5,
      }))
    );

    // Landing particles
    setParticles(
      Array.from({ length: mob ? 12 : 24 }, (_, i) => {
        const angle = (i / (mob ? 12 : 24)) * Math.PI * 2;
        const dist = 100 + Math.random() * 180;
        return {
          id: i,
          px: Math.cos(angle) * dist,
          py: Math.sin(angle) * dist,
          s: Math.random() * 4 + 2,
          c: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          d: Math.random() * 0.6 + 0.5,
          dl: Math.random() * 0.25,
        };
      })
    );

    const seen = localStorage.getItem(STORAGE_KEY) === "true";
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (seen || reduced) {
      setPhase("hero");
    } else {
      setShowSkip(true);
      runSequence(mob);
    }

    setReady(true);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Animation Sequence ────────────────────── */

  async function runSequence(mob: boolean) {
    const s = mob ? 0.55 : 1; // speed factor

    await wait(300 * s);
    if (!alive.current) return;

    /* ── Phase 1: Rocket Flight ── */
    setPhase("flying");

    await rocketCtrl.start({
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.6 * s,
        ease: [0.25, 0.46, 0.45, 0.94], 
      },
    });
    if (!alive.current) return;

    /* ── Phase 2: Landing ── */
    setPhase("landing");

    // Glow ring expand
    glowCtrl.start({
      scale: [0, 3.5],
      opacity: [0.65, 0],
      transition: { duration: 1 * s, ease: "easeOut" },
    });

    // Bounce
    await rocketCtrl.start({
      scale: [1, 1.18, 0.92, 1.06, 1],
      transition: { duration: 0.65 * s, ease: "easeOut" },
    });
    if (!alive.current) return;

    await wait(300 * s);

    /* ── Phase 3: Feature Cards ── */
    setPhase("features");
    await wait(2000 * s);
    if (!alive.current) return;

    /* ── Done ── */
    finish();
  }

  function finish() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowSkip(false);
    setPhase("hero");
  }

  const skipAnim = useCallback(() => {
    alive.current = false;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Loading guard ─────────────────────────── */

  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0B1220",
          zIndex: 100,
        }}
      />
    );
  }

  const animating = phase !== "hero";
  const rocketSize = mobile ? 80 : 120;

  /* ══════════════════════════════════════════════ */
  /*                  RENDER                       */
  /* ══════════════════════════════════════════════ */

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0B1220",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        fontFamily: "inherit",
      }}
    >
      {/* ═══════════ BACKGROUND LAYERS ═══════════ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, #111827 0%, #0B1220 100%)",
        }}
      >
        {stars.map((st) => (
          <div
            key={st.id}
            style={{
              position: "absolute",
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.s,
              height: st.s,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.5)",
              animation: `ldg-twinkle ${st.d}s ease-in-out infinite ${st.dl}s`,
            }}
          />
        ))}

        {/* Dynamic Background Glow */}
        <motion.div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: mobile ? 600 : 900,
            height: mobile ? 600 : 900,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.08) 40%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <AnimatePresence mode="wait">
        {animating ? (
          <motion.div
            key="anim"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Intro Rocket & Particles logic */}
            <motion.div
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              initial={{
                x: mobile ? "-35vw" : "-42vw",
                y: "38vh",
                rotate: -40,
                scale: mobile ? 0.5 : 0.35,
                opacity: 0,
              }}
              animate={rocketCtrl}
            >
              <Image src={rocketImg} alt="Rocket" width={rocketSize} height={rocketSize} priority />
            </motion.div>

            {/* Orbiting Features during intro */}
            {phase === "features" && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                  {features.map((f, i) => {
                    const target = mobile ? f.mPos : f.pos;
                    return (
                        <motion.div
                          key={f.label}
                          style={{ position: "absolute" }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1, x: target.x, y: target.y }}
                        >
                           <div style={{ transform: "translate(-50%, -50%)" }}>
                              <div style={{ padding: 12, borderRadius: 12, background: `${f.color}20`, border: `1px solid ${f.color}40`, backdropFilter: "blur(12px)" }}>
                                 <f.icon size={24} color={f.color} />
                              </div>
                           </div>
                        </motion.div>
                    );
                  })}
                </div>
            )}

            {showSkip && (
              <motion.button
                onClick={skipAnim}
                style={{
                  position: "fixed",
                  bottom: mobile ? 20 : 36,
                  right: mobile ? 20 : 36,
                  padding: "10px 24px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 100,
                  color: "white",
                  cursor: "pointer",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Skip Intro →
              </motion.button>
            )}
          </motion.div>
        ) : (
          /* ──────────────────────────────────── */
          /*             HERO SECTION            */
          /* ──────────────────────────────────── */
          <motion.div
            key="hero"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              width: "100%",
              padding: mobile ? "24px 20px" : "32px",
              textAlign: "center",
              position: "relative",
              zIndex: 10,
              gap: mobile ? 20 : 40,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* CENTRAL ROCKET VISUAL */}
            <motion.div
              style={{
                position: "absolute",
                top: "12%",
                left: "50%",
                x: "-50%",
                zIndex: -1,
                filter: "drop-shadow(0 0 30px rgba(99,102,241,0.2))",
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 1, 0, -1, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Image
                src={rocketImg}
                alt="Rocket"
                width={mobile ? 120 : 180}
                height={mobile ? 120 : 180}
                priority
                style={{ opacity: 0.5 }}
              />
            </motion.div>

            {/* Logo + Brand */}
            <motion.div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Image
                  src="/logo.png"
                  alt="JobPilot"
                  width={32}
                  height={32}
                  priority
                  style={{ borderRadius: 8 }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "white",
                    opacity: 0.8,
                  }}
                >
                  JobPilot
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  fontWeight: 500,
                  fontStyle: "italic",
                }}
              >
                Built for students & developers aiming for top roles
              </p>
            </motion.div>

            {/* Headline Section */}
            <div style={{ maxWidth: 900, width: "100%" }}>
              <motion.h1
                style={{
                  fontSize: mobile ? "2.1rem" : "4.3rem",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: "-0.04em",
                  color: "#FFFFFF",
                  marginBottom: 20,
                  filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))",
                }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Stop Guessing, <br />
                <motion.span
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #6366F1 0%, #A855F7 30%, #06B6D4 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 30px rgba(99,102,241,0.3)",
                  }}
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  Start Getting Interviews
                </motion.span>
              </motion.h1>

              <motion.p
                style={{
                  fontSize: mobile ? 14 : 20,
                  color: "#94A3B8",
                  maxWidth: 640,
                  margin: "0 auto",
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                Optimize your resume, discover high-match roles, and generate referrals — all powered by AI.
              </motion.p>
            </div>

            {/* Compact Feature Cards Grid */}
            <motion.div
              style={{
                display: "grid",
                gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)",
                gap: 16,
                maxWidth: 1100,
                width: "100%",
                padding: "0 20px",
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {features.map((f, i) => (
                <Link key={f.title} href={f.path} style={{ textDecoration: "none" }}>
                  <motion.div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "18px 24px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 20,
                      backdropFilter: "blur(16px)",
                      cursor: "pointer",
                      textAlign: "left",
                      opacity: 0.95,
                    }}
                    whileHover={{
                      y: -5,
                      opacity: 1,
                      scale: 1.02,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      boxShadow: `0 15px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${f.color}20`,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${f.color}40` }}>
                      <f.icon size={18} color={f.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 2 }}>{f.title}</h3>
                      <p style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{f.hoverLine}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>

            {/* CTA Section */}
            <motion.div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                marginTop: 8,
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
            >
              <div style={{ display: "flex", gap: 16 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/analyzer"
                    style={{
                      display: "block",
                      padding: "18px 48px",
                      background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 17,
                      borderRadius: 20,
                      boxShadow: "0 10px 40px rgba(99,102,241,0.4)",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 15px 50px rgba(99,102,241,0.6)";
                      e.currentTarget.style.filter = "brightness(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 10px 40px rgba(99,102,241,0.4)";
                      e.currentTarget.style.filter = "brightness(1)";
                    }}
                  >
                    Analyze My Resume →
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/signup"
                    style={{
                      display: "block",
                      padding: "18px 36px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: 16,
                      borderRadius: 20,
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>

              <div style={{ textAlign: "center", gap: 4, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 15, color: "#64748B", fontWeight: 600 }}>No signup required to try your first analysis and refferal generation</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
