"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Code2,
  BarChart3,
  AlertTriangle,
  Play,
  Clock,
  Upload,
  ChevronRight,
  Flame,
  Sparkles,
} from "lucide-react";

// ---------------------
// Types
// ---------------------
interface PriorityAction {
  id: string;
  type: "missing_skills" | "resume_improvement" | "low_match" | "apply_jobs" | "inactivity" | "no_resume";
  icon: string;
  title: string;
  description: string;
  route: string;
  priority: number;
}

interface AnalysisSummary {
  id?: string;
  match_score?: number | null;
  skill_gaps?: string[] | null;
  suggestions?: string[] | null;
}

interface JobSummary {
  company?: string | null;
  status?: string | null;
  applied_date?: string | null;
}

// ---------------------
// Icon mapping
// ---------------------
const iconMap: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  code:   { Icon: Code2,          color: "#22d3ee", bg: "rgba(34,211,238,0.1)" },
  chart:  { Icon: BarChart3,      color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  alert:  { Icon: AlertTriangle,  color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  play:   { Icon: Play,           color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  clock:  { Icon: Clock,          color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  upload: { Icon: Upload,         color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
};

type ActionSourceData = {
  hasResume: boolean;
  latestAnalysis: AnalysisSummary | null;
  highMatchJobs: JobSummary[];
  lastApplicationDate: string | null;
};

function ensureMinimumActions(actions: PriorityAction[], data: ActionSourceData): PriorityAction[] {
  const normalized = [...actions]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  if (normalized.length >= 3) {
    return normalized;
  }

  const fallbackPool: PriorityAction[] = data.hasResume
    ? [
        {
          id: "fallback-refresh-resume",
          type: "resume_improvement",
          icon: "chart",
          title: data.latestAnalysis ? "Refresh your resume check" : "Analyze your resume",
          description: data.latestAnalysis
            ? "Run another analysis after your latest resume updates"
            : "Get tailored feedback before your next application",
          route: "/analyzer",
          priority: 90,
        },
        {
          id: "fallback-update-resume",
          type: "missing_skills",
          icon: "upload",
          title: "Update your resume",
          description: "Add fresh wins, metrics, and skills to stay interview-ready",
          route: "/resumes",
          priority: 91,
        },
        {
          id: "fallback-save-jobs",
          type: "apply_jobs",
          icon: "play",
          title: data.highMatchJobs.length > 0 ? "Apply to saved matches" : "Save target jobs",
          description: data.highMatchJobs.length > 0
            ? "Turn your saved matches into active applications"
            : "Bookmark a few roles to focus your search",
          route: "/jobs",
          priority: 92,
        },
        {
          id: "fallback-review-settings",
          type: "inactivity",
          icon: "clock",
          title: "Review your setup",
          description: "Fine-tune your preferences to keep recommendations relevant",
          route: "/settings",
          priority: 93,
        },
      ]
    : [
        {
          id: "no-resume",
          type: "no_resume",
          icon: "upload",
          title: "Upload your resume",
          description: "Start by uploading your resume to unlock all features",
          route: "/resumes",
          priority: 0,
        },
        {
          id: "fallback-explore-jobs",
          type: "apply_jobs",
          icon: "play",
          title: "Explore target jobs",
          description: "Save a few roles so you know what to tailor your resume for",
          route: "/jobs",
          priority: 91,
        },
        {
          id: "fallback-plan-search",
          type: "resume_improvement",
          icon: "chart",
          title: "Plan your search",
          description: "Review your preferences before you start applying",
          route: "/settings",
          priority: 92,
        },
      ];

  const seenIds = new Set(normalized.map((action) => action.id));

  for (const action of fallbackPool) {
    if (normalized.length >= 3) {
      break;
    }

    if (seenIds.has(action.id)) {
      continue;
    }

    normalized.push(action);
    seenIds.add(action.id);
  }

  return normalized
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
}

// ---------------------
// Rule-based action generation (runs client-side)
// ---------------------
function generateActions(data: ActionSourceData): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const { hasResume, latestAnalysis, highMatchJobs, lastApplicationDate } = data;

  if (!hasResume) {
    actions.push({
      id: "no-resume",
      type: "no_resume",
      icon: "upload",
      title: "Upload your resume",
      description: "Start by uploading your resume to unlock all features",
      route: "/resumes",
      priority: 0,
    });
    return ensureMinimumActions(actions, data);
  }

  // 1. MISSING SKILLS
  if (latestAnalysis?.skill_gaps && Array.isArray(latestAnalysis.skill_gaps) && latestAnalysis.skill_gaps.length > 0) {
    const topSkills = latestAnalysis.skill_gaps.slice(0, 2).join(", ");
    actions.push({
      id: "missing-skills",
      type: "missing_skills",
      icon: "code",
      title: `Add missing skills: ${topSkills}`,
      description: "Top requirement for your matching roles",
      route: "/analyzer",
      priority: 1,
    });
  }

  // 2. RESUME IMPROVEMENT
  if (latestAnalysis?.suggestions && Array.isArray(latestAnalysis.suggestions) && latestAnalysis.suggestions.length > 0) {
    const firstSuggestion = latestAnalysis.suggestions[0];
    const trimmed = typeof firstSuggestion === "string"
      ? firstSuggestion.length > 80 ? firstSuggestion.slice(0, 77) + "..." : firstSuggestion
      : "Review and implement suggested improvements";
    actions.push({
      id: "resume-improvement",
      type: "resume_improvement",
      icon: "chart",
      title: "Improve your resume impact",
      description: trimmed,
      route: "/analyzer",
      priority: 2,
    });
  }

  // 3. LOW MATCH SCORE
  if (latestAnalysis?.match_score != null && latestAnalysis.match_score < 60) {
    actions.push({
      id: "low-match",
      type: "low_match",
      icon: "alert",
      title: "Your resume needs improvement",
      description: "Low match score detected. Re-analyze with an updated resume",
      route: "/analyzer",
      priority: 3,
    });
  }

  // 4. APPLY TO JOBS
  if (highMatchJobs.length > 0) {
    const companies = highMatchJobs
      .slice(0, 3)
      .map((j) => j.company)
      .filter((c, i, arr) => c && arr.indexOf(c) === i)
      .join(", ");
    actions.push({
      id: "apply-jobs",
      type: "apply_jobs",
      icon: "play",
      title: `Apply to ${highMatchJobs.length} matching job${highMatchJobs.length > 1 ? "s" : ""}`,
      description: `Recommended companies: ${companies}`,
      route: "/jobs",
      priority: 4,
    });
  }

  // 5. INACTIVITY
  if (lastApplicationDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastApplicationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 3) {
      actions.push({
        id: "inactivity",
        type: "inactivity",
        icon: "clock",
        title: "Stay active",
        description: "You haven't applied recently. Keep the momentum going",
        route: "/jobs",
        priority: 5,
      });
    }
  } else if (hasResume) {
    actions.push({
      id: "inactivity",
      type: "inactivity",
      icon: "clock",
      title: "Start applying",
      description: "You haven't tracked any applications yet. Build momentum",
      route: "/jobs",
      priority: 5,
    });
  }

  actions.sort((a, b) => a.priority - b.priority);
  return ensureMinimumActions(actions, data);
}

// ---------------------
// Action Card Component
// ---------------------
function ActionCard({
  action,
  index,
}: {
  action: PriorityAction;
  index: number;
}) {
  const iconData = iconMap[action.icon] || iconMap.code;
  const { Icon, color, bg } = iconData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.1, ease: "easeOut" }}
    >
      <Link href={action.route}>
        <div className="group relative overflow-hidden rounded-xl bg-[#111827]/80 border border-white/[0.07] hover:border-white/[0.15] p-4 flex items-center gap-4 cursor-pointer transition-all duration-400 hover:shadow-[0_4px_24px_rgba(139,92,246,0.08)] hover:-translate-y-[1px]">
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, ${color}08, transparent 70%)`,
            }}
          />

          {/* Icon */}
          <div
            className="relative z-10 flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              background: bg,
              border: `1px solid ${color}20`,
            }}
          >
            <Icon size={20} style={{ color }} />
          </div>

          {/* Text */}
          <div className="relative z-10 flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-white leading-snug truncate group-hover:text-white/95 transition-colors">
              {action.title}
            </h4>
            <p className="text-[11px] text-muted-text leading-snug mt-0.5 truncate">
              {action.description}
            </p>
          </div>

          {/* Arrow */}
          <div className="relative z-10 flex-shrink-0">
            <ChevronRight
              size={16}
              className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------
// Skeleton Loader
// ---------------------
function ActionSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl bg-[#111827]/60 border border-white/[0.05] p-4 flex items-center gap-4"
    >
      <div className="w-11 h-11 rounded-xl bg-white/[0.04] animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 bg-white/[0.04] rounded-md animate-pulse" />
        <div className="h-2.5 w-1/2 bg-white/[0.03] rounded-md animate-pulse" />
      </div>
      <div className="w-4 h-4 bg-white/[0.03] rounded animate-pulse" />
    </motion.div>
  );
}

// ---------------------
// Main Component
// ---------------------
export default function PriorityActions({ isDemo }: { isDemo?: boolean }) {
  const { user } = useUser();
  const [actions, setActions] = useState<PriorityAction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndGenerate = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      if (isDemo) {
        setActions([
          {
            id: "demo-1",
            type: "missing_skills",
            icon: "code",
            title: "Add missing skills: React, TypeScript",
            description: "Top requirement for your matching roles",
            route: "/signup",
            priority: 1,
          },
          {
            id: "demo-2",
            type: "resume_improvement",
            icon: "chart",
            title: "Improve your resume impact",
            description: "Quantify your achievements with exact metrics to stand out",
            route: "/signup",
            priority: 2,
          },
          {
            id: "demo-3",
            type: "apply_jobs",
            icon: "play",
            title: "Apply to 3 matching jobs",
            description: "Recommended companies: Stripe, Vercel, Meta",
            route: "/signup",
            priority: 3,
          }
        ]);
        setLoading(false);
        return;
      }

      // 1. Fetch ALL source data in PARALLEL
      const [resumeResult, analysisResult, jobsResult] = await Promise.all([
        supabase.from("resumes").select("id").eq("user_id", userId).limit(1),
        supabase.from("analyses").select("id, match_score, skill_gaps, suggestions").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
        supabase.from("jobs").select("id, company, status, applied_date").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      const hasResume = !!(resumeResult.data && resumeResult.data.length > 0);
      const latestAnalysis = analysisResult.data && analysisResult.data.length > 0 ? analysisResult.data[0] : null;
      const jobs = jobsResult.data || [];
      const highMatchJobs = jobs.filter((j) => j.status === "saved" || j.status === "Saved" || j.status === "wishlist");
      const appliedJobs = jobs.filter((j) => j.status === "applied" || j.status === "Applied");
      const lastApplicationDate = appliedJobs.length > 0 ? appliedJobs[0].applied_date : null;

      // 2. Generate static rule-based actions with REAL DATA
      const rawActions = generateActions({ hasResume, latestAnalysis, highMatchJobs, lastApplicationDate });

      if (rawActions[0]?.type === "no_resume") {
        setActions(rawActions);
        setLoading(false);
        return;
      }

      // 3. Simple base64 hash of source states
      const hashInput = JSON.stringify({
        hasResume,
        analysisId: latestAnalysis?.id,
        jobsCount: highMatchJobs.length,
        lastDate: lastApplicationDate,
      });
      const sourceHash = btoa(hashInput);

      // 4. Check DB Cache
      const { data: cached } = await supabase.from("priority_actions").select("*").eq("user_id", userId).maybeSingle();

      if (cached && cached.source_hash === sourceHash) {
        setActions(ensureMinimumActions(cached.actions || [], { hasResume, latestAnalysis, highMatchJobs, lastApplicationDate }));
        setLoading(false);
        return;
      }

      // 5. Ask Gemini AI API to refine — WITH TIMEOUT + FALLBACK
      let finalActions = rawActions;
      try {
        const aiRes = await fetchWithTimeout("/api/priority-actions", {
          method: "POST",
          body: JSON.stringify({ actions: rawActions }),
          headers: { "Content-Type": "application/json" }
        }, 18_000);
        
        const aiData = await aiRes.json();
        if (aiData.actions && Array.isArray(aiData.actions)) {
           finalActions = aiData.actions;
        }
      } catch(err) {
        console.warn("[PriorityActions] AI refinement timed out or failed, using raw actions", err);
        // Graceful fallback — raw actions are already good enough
      }

      finalActions = ensureMinimumActions(finalActions, { hasResume, latestAnalysis, highMatchJobs, lastApplicationDate });

      // 6. Store AI result in Supabase DB (non-blocking)
      try {
        if (cached) {
           await supabase
             .from("priority_actions")
             .update({ actions: finalActions, source_hash: sourceHash, updated_at: new Date().toISOString() })
             .eq("user_id", userId);
        } else {
           await supabase
             .from("priority_actions")
             .insert({ user_id: userId, actions: finalActions, source_hash: sourceHash });
        }
      } catch (dbErr) {
        console.warn("[PriorityActions] DB cache write failed:", dbErr);
      }

      setActions(finalActions);

    } catch (err: unknown) {
      console.error("[PriorityActions] Error:", err);
      setActions(ensureMinimumActions([
        {
          id: "fallback",
          type: "resume_improvement",
          icon: "chart",
          title: "Analyze your resume",
          description: "Get personalized feedback to improve your job readiness",
          route: "/analyzer",
          priority: 0,
        },
      ], {
        hasResume: true,
        latestAnalysis: null,
        highMatchJobs: [],
        lastApplicationDate: null,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      fetchAndGenerate("demo");
      return;
    }
    if (user?.id) {
      fetchAndGenerate(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isDemo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Flame size={20} className="text-orange-400" />
          <h2 className="text-lg font-black text-white tracking-tight">
            Priority Actions
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full">
          <Sparkles size={10} className="text-purple-400" />
          <span className="text-[9px] font-black text-muted-text uppercase tracking-[0.2em]">
            AI Generated
          </span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-2.5">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {[0, 1, 2].map((i) => (
                <ActionSkeleton key={i} index={i} />
              ))}
            </motion.div>
          ) : actions.length > 0 ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {actions.map((action, i) => (
                <ActionCard key={action.id} action={action} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-[#111827]/60 border border-white/[0.05] p-6 text-center"
            >
              <p className="text-sm text-muted-text">
                No actions right now. You&apos;re all caught up! 🎉
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
