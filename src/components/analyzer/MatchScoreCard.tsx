"use client";

import { useEffect, useState } from "react";
import { 
  Target, 
  Trophy, 
  CheckCircle2, 
  Info,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface MatchScoreCardProps {
  score: number;
  reason?: string;
  loading?: boolean;
  analysisComplete?: boolean;
}

export function MatchScoreCard({ score, reason, loading, analysisComplete }: MatchScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (score > 0) {
      const timeout = setTimeout(() => setDisplayScore(score), 500);
      return () => clearTimeout(timeout);
    } else {
      setDisplayScore(0);
    }
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-blue-400";
    if (s >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreMessage = (s: number) => {
    if (s >= 80) return "Your profile is a strong contender for this role.";
    if (s >= 60) return "You have a solid match with some key areas to improve.";
    if (s >= 40) return "Your skills partially align; consider tailoring your resume.";
    return "Significant gaps detected; additional experience may be needed.";
  };

  // Show unblurred when analysis is complete (even at 0%) or when score > 0
  const isVisible = analysisComplete || score > 0;

  return (
    <div className={`w-full transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-70 grayscale blur-[1px] pointer-events-none'}`}>
      {/* Heading Moved Outside */}
      <div className="flex items-center gap-3 ml-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <Trophy size={14} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-xs font-black text-muted-text uppercase tracking-[0.2em]">Match Probability</h3>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] border border-white/5 rounded-[32px] p-8 sm:p-10 text-center space-y-8 relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
        
        <div className="space-y-4">
          {/* Circular Progress */}
          <div className="relative inline-flex items-center justify-center p-4">
            <svg className="w-56 h-56 transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="100"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-white/[0.03]"
            />
            <motion.circle
              cx="112"
              cy="112"
              r="100"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 100}
              initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 100 * (1 - displayScore / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              className={getScoreColor(displayScore)}
            />
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span className={`text-6xl font-black tracking-tighter ${getScoreColor(displayScore)}`}>
              {displayScore}<span className="text-3xl opacity-50">%</span>
            </span>
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/[0.05] border border-white/5 rounded-full">
              {displayScore >= 80 ? (
                <CheckCircle2 size={12} className="text-green-400" />
              ) : (
                <Info size={12} className="text-muted-text" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                {displayScore >= 80 ? "High Match" : displayScore >= 40 ? "Moderate" : "Low Match"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10 pt-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-2">
          <Target size={14} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">AI Match Insight</span>
        </div>
        <p className="text-white/80 text-sm font-medium leading-relaxed max-w-[280px] mx-auto min-h-[60px]">
          {reason || getScoreMessage(displayScore)}
        </p>
      </div>

      {score >= 80 && (
        <div className="absolute top-6 left-6 text-green-400/20">
        </div>
      )}
    </motion.div>
    </div>
  );
}
