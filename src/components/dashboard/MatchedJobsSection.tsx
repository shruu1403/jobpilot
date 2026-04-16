"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HistoryModal } from "@/components/analyzer/HistoryModal";
import { Briefcase, Building2, ExternalLink, Loader2, Play, ChevronRight } from "lucide-react";
import { Analysis } from "@/types/analysis";

interface JobCardProps {
  analysis: Analysis;
  index: number;
}

function JobCard({ analysis, index }: JobCardProps) {
  // Extract info from analysis
  const jobTitle = analysis.job_title || "Unknown Role";
  const company = analysis.company || "Unknown Company";
  const matchScore = analysis.match_score || 0;
  
  // High match: green, Medium: blue, Low: yellow/orange
  const isHighMatch = matchScore >= 80;
  const isMediumMatch = matchScore >= 60 && matchScore < 80;
  
  const scoreColorClass = isHighMatch
    ? "text-green-400 bg-green-400/10 border-green-400/20"
    : isMediumMatch
    ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
    : "text-amber-400 bg-amber-400/10 border-amber-400/20";

  // Use stored reasoning, or a basic fallback
  let aiReason = analysis.reason;
  if (!aiReason && analysis.suggestions && analysis.suggestions.length > 0) {
    aiReason = analysis.suggestions[0];
  }
  if (!aiReason) {
    aiReason = "Based on your recent resume analysis, this role aligns with your experience profile.";
  }
  
  // Truncate aiReason to a reasonable length
  if (aiReason.length > 120) {
    aiReason = aiReason.substring(0, 117) + "...";
  }

  // Tags: if available, use inverse of skill gaps? Or just show a few tags
  // For UI, if analysis has `tags` array use it. If not, maybe use part of job_title.
  let tags: string[] = [];
  if (analysis.tags && Array.isArray(analysis.tags) && analysis.tags.length > 0) {
    tags = analysis.tags.slice(0, 3);
  } else {
    // Fallback: Make 2-3 standard looking tags from common words in job title
    tags = jobTitle.split(" ").filter(w => w.length > 3).slice(0, 3);
    if (tags.length === 0) tags = ["Relevant Experience"];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#111827] border border-white/10 p-5 transition-all duration-400 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:border-white/20 h-full"
    >
      {/* Ambient hover glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at top right, ${isHighMatch ? 'rgba(74, 222, 128, 0.05)' : 'rgba(56, 189, 248, 0.05)'}, transparent 60%)`
        }}
      />

      <div className="relative z-10 flex-1">
        {/* Header Info */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex gap-3 items-center">
            {/* Company Logo Placeholder */}
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white/40" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white leading-tight line-clamp-1">{jobTitle}</h3>
              <p className="text-xs text-muted-text mt-1">{company} &bull; Match</p>
            </div>
          </div>
          
          {/* Match Badge */}
          <div className={`px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center justify-center whitespace-nowrap ${scoreColorClass}`}>
            <span className="flex flex-col items-center leading-none">
              <span className="text-[12px]">{matchScore}%</span>
              <span className="text-[8px] opacity-80 mt-[2px]">Match</span>
            </span>
          </div>
        </div>

        {/* AI Reason */}
        <div className="mb-4">
          <p className="text-[13px] text-muted-text italic leading-relaxed line-clamp-3">
            &quot;AI Reason: {aiReason}&quot;
          </p>
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag, i) => (
            <span key={i} className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md text-[11px] font-medium text-white/70">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="relative z-10 mt-auto">
        <Link href="/jobs" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.2] transition-colors rounded-xl text-sm font-bold text-white">
          <Play size={14} className="text-white/60" />
          Quick Apply
        </Link>
      </div>
    </motion.div>
  );
}

export default function MatchedJobsSection() {
  const { user } = useUser();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    async function fetchMatches() {
      if (!user?.id || hasFetched.current) return;
      hasFetched.current = true;
      
      try {
        setLoading(true);
        // Step 1: Fetch latest analyses
        const { data, error } = await supabase
          .from("analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10); // Fetch enough to filter

        if (error) throw error;
        
        let fetchedData = (data as Analysis[]) || [];
        
        // Step 2 & 3: Filter High Match & Sort
        const highMatches = fetchedData
          .filter(a => a.match_score >= 70)
          .sort((a, b) => b.match_score - a.match_score);
          
        let displayList = [];
        
        if (highMatches.length > 0) {
          // Step 4: Show top 2 results
          displayList = highMatches.slice(0, 2);
        } else {
          // Step 5: Fallback - show latest 2 runs
          displayList = fetchedData.slice(0, 2);
        }
        
        setAnalyses(displayList);
      } catch (err) {
        console.error("Failed to load matched jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-white/[0.05] rounded-lg" />
          <div className="h-4 w-16 bg-white/[0.05] rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map(i => (
             <div key={i} className="h-[280px] rounded-2xl bg-[#111827]/60 border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // If literally no data, hide section or show empty state
  if (analyses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Matched Jobs
        </h2>
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 group cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
        >
          View All
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        <AnimatePresence>
          {analyses.map((analysis, i) => (
            <JobCard key={analysis.id || i} analysis={analysis} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {user?.id && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          userId={user.id}
          onView={(analysis) => {
            // Optional: You could pass an ID back or use localStorage 
            // to persist the active analysis between page loads
            router.push("/analyzer");
          }}
          onReanalyze={(analysis) => {
            router.push("/analyzer");
          }}
        />
      )}
    </div>
  );
}
