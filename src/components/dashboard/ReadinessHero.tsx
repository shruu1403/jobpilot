"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { Sparkles, Upload, ArrowRight, Loader2, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import rocketLogo from "@/assets/rocket.png";

interface ReadinessData {
  readiness: number;
  summary: string;
  improvements: string[];
}

// Animated circular progress ring
function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 10,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 200);
    return () => clearTimeout(timer);
  }, [progress]);

  const offset = circumference - (animatedProgress / 100) * circumference;

  // Color gradient based on score
  const getColor = (score: number) => {
    if (score >= 75) return { start: "#22c55e", end: "#10b981" }; // Green
    if (score >= 50) return { start: "#3b82f6", end: "#6366f1" }; // Blue
    if (score >= 25) return { start: "#f59e0b", end: "#f97316" }; // Amber
    return { start: "#ef4444", end: "#dc2626" }; // Red
  };

  const colors = getColor(animatedProgress);
  const gradientId = "readiness-gradient";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 20px ${colors.start}40)` }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={animatedProgress}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl font-black text-white tracking-tight"
        >
          {animatedProgress}%
        </motion.span>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-text mt-1">
          Readiness
        </span>
      </div>
    </div>
  );
}

// Animated counter for the progress number
function useAnimatedCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return count;
}

export default function ReadinessHero({
  onInsightsLoaded,
  isDemo,
}: {
  onInsightsLoaded?: (improvements: string[], loading: boolean) => void;
  isDemo?: boolean;
}) {
  const { user, userName, loading: userLoading } = useUser();
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlow, setIsSlow] = useState(false);

  const fetchReadiness = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      setIsSlow(false);
      if (onInsightsLoaded) onInsightsLoaded([], true);

      // Show "taking longer" indicator after 8s
      const slowTimer = setTimeout(() => setIsSlow(true), 8000);

      if (isDemo) {
        clearTimeout(slowTimer);
        const demoData = {
          readiness: 85,
          summary: "Your resume shows strong alignment with your target roles—adding a portfolio link can help you stand out even more.",
          improvements: ["Add a portfolio link", "Quantify your impacts", "Highlight Next.js experience", "Gain more context on React Server Components", "Focus on clean architecture"]
        };
        setData(demoData);
        setLoading(false);
        if (onInsightsLoaded) onInsightsLoaded(demoData.improvements, false);
        return;
      }

      // 1. Fetch resume + analysis + cached insight IN PARALLEL
      const [resumeResult, analysisResult, insightResult] = await Promise.all([
        supabase
          .from("resumes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("analyses")
          .select("id, match_score, skill_gaps, suggestions")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("dashboard_insights")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      const resumes = resumeResult.data;
      const analyses = analysisResult.data;
      const cachedInsight = insightResult.data;

      if (!resumes || resumes.length === 0) {
        clearTimeout(slowTimer);
        const emptyData = {
          readiness: 0,
          summary: "Upload your resume to see your job readiness score. Let's get started!",
          improvements: ["Upload your first resume", "Add relevant skills and projects", "Complete your profile"],
        };
        setData(emptyData);
        setLoading(false);
        if (onInsightsLoaded) onInsightsLoaded(emptyData.improvements, false);
        return;
      }

      const latestResume = resumes[0];
      const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null;

      // 2. Check cache validity
      const isCacheValid = 
        cachedInsight && 
        cachedInsight.source_resume_id === latestResume.id && 
        cachedInsight.source_analysis_id === (latestAnalysis?.id ?? null);

      if (isCacheValid) {
        clearTimeout(slowTimer);
        console.log("[ReadinessHero] Using cached insight (inputs haven't changed)");
        const cachedData = {
          readiness: cachedInsight.readiness,
          summary: cachedInsight.summary,
          improvements: cachedInsight.improvements || [],
        };
        setData(cachedData);
        setLoading(false);
        if (onInsightsLoaded) onInsightsLoaded(cachedData.improvements, false);
        return;
      }

      console.log("[ReadinessHero] Cache miss or inputs changed. Requesting new AI calculation...");

      // 3. Extract resume text
      const { data: fileData, error: dlError } = await supabase.storage
        .from("resumes")
        .download(latestResume.file_path);

      if (dlError || !fileData) {
        throw new Error("Failed to download resume file.");
      }

      const formData = new FormData();
      formData.append("file", fileData);
      const extractRes = await fetchWithTimeout("/api/extract", { method: "POST", body: formData }, 15_000);
      const extractData = await extractRes.json();

      if (extractData.error) throw new Error(extractData.error);

      // 4. Call readiness AI — with timeout
      const readinessRes = await fetchWithTimeout("/api/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extractData.text,
          matchScore: latestAnalysis?.match_score ?? null,
          skillGaps: latestAnalysis?.skill_gaps ?? [],
        }),
      }, 25_000);

      clearTimeout(slowTimer);

      const readinessData = await readinessRes.json();

      if (!readinessRes.ok) throw new Error(readinessData.error || "Failed to compute readiness");

      setData(readinessData);
      if (onInsightsLoaded) onInsightsLoaded(readinessData.improvements, false);

      // 5. Cache the result in Supabase (non-blocking)
      try {
        // Upsert: delete old row, insert new
        await supabase
          .from("dashboard_insights")
          .delete()
          .eq("user_id", userId);

        await supabase
          .from("dashboard_insights")
          .insert({
            user_id: userId,
            readiness: readinessData.readiness,
            summary: readinessData.summary,
            improvements: readinessData.improvements,
            source_analysis_id: latestAnalysis?.id ?? null,
            source_resume_id: latestResume.id,
            updated_at: new Date().toISOString(),
          });

        console.log("[ReadinessHero] Cached insight to DB");
      } catch (cacheErr) {
        console.warn("[ReadinessHero] Failed to cache insight:", cacheErr);
        // Non-blocking — insight still shows
      }
    } catch (err: any) {
      console.error("[ReadinessHero] Error:", err);
      const isTimeout = err?.isTimeout || err?.message?.includes("timed out");
      setError(isTimeout 
        ? "AI is taking too long — please retry" 
        : err.message || "Something went wrong"
      );
      // Provide fallback data so UI doesn't stay empty
      const fallbackData = {
        readiness: 0,
        summary: "We couldn't compute your readiness right now. Please try again later.",
        improvements: [],
      };
      setData(fallbackData);
      if (onInsightsLoaded) onInsightsLoaded(fallbackData.improvements, false);
    } finally {
      setLoading(false);
      setIsSlow(false);
    }
  }, [onInsightsLoaded]);

  useEffect(() => {
    if (isDemo) {
      fetchReadiness("demo");
      return;
    }
    if (user?.id) {
      fetchReadiness(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isDemo]);

  const isNew = data?.readiness === 0 && !error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0f1729] via-[#111d35] to-[#0d1526] border border-white/[0.06] p-8 md:p-10 lg:p-12"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-blue-500/[0.07] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-radial from-purple-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
        {/* LEFT SIDE */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          {/* Greeting */}
          <AnimatePresence mode="wait">
            {userLoading ? (
              <motion.div
                key="loading-name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-10 w-48 bg-white/5 rounded-2xl animate-pulse"
              />
            ) : (
              <motion.h1
                key="greeting"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl font-black text-white tracking-tight"
              >
                Hi {isDemo ? "Alex" : userName}{" "}
                <Image 
                  src={rocketLogo} 
                  alt="JobPilot Rocket" 
                  className="inline-block w-8 h-8 md:w-10 md:h-10 ml-1 object-contain scale-[1.3] md:scale-150 origin-bottom" 
                  priority
                />
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Summary text */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="h-4 w-full max-w-md bg-white/5 rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 max-w-sm bg-white/5 rounded-lg animate-pulse" />
                {/* "Taking longer" indicator */}
                {isSlow && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-amber-400/80 font-medium mt-3 flex items-center gap-1.5"
                  >
                    <Loader2 size={12} className="animate-spin" />
                    AI is processing — hang tight...
                  </motion.p>
                )}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error-msg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => user?.id && fetchReadiness(user.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-text text-[15px] leading-relaxed max-w-lg"
              >
                {data?.readiness ? (
                  <>
                    You&apos;re{" "}
                    <span className="text-white font-bold">{data.readiness}% ready</span>{" "}
                    for your target roles.{" "}
                    {data.summary}
                  </>
                ) : (
                  data?.summary
                )}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Improvements chips removed and moved to AiInsights */}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2"
          >
            <Link href="/analyzer">
              <button className="group px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2.5">
                <Sparkles size={16} />
                Analyze Resume
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </Link>
            <Link href="/resumes">
              <button className="px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2.5">
                <Upload size={16} className="text-muted-text" />
                Upload Resume
              </button>
            </Link>
          </motion.div>
        </div>

        {/* RIGHT SIDE — Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex-shrink-0 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-[180px] h-[180px] rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Loader2 size={32} className="text-muted-text animate-spin" />
            </div>
          ) : isNew ? (
            <div className="w-[180px] h-[180px] rounded-full bg-white/[0.02] border-2 border-dashed border-white/20 flex flex-col items-center justify-center hover:border-blue-400/40 transition-colors">
              <Upload size={32} className="text-white/40 mb-3" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                Start Here
              </span>
            </div>
          ) : (
            <ProgressRing progress={data?.readiness ?? 0} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
