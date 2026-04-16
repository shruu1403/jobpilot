"use client";

import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface SkillGapsCardProps {
  gaps: string[];
  active: boolean;
}

export function SkillGapsCard({ gaps, active }: SkillGapsCardProps) {
  const hasGaps = active && gaps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`
        bg-[#111827] border border-white/5 rounded-[32px] p-8 space-y-5 transition-all duration-700
        ${hasGaps ? "opacity-100" : "opacity-30 grayscale blur-[1px] pointer-events-none"}
      `}
    >
      <div className="flex items-center gap-2 text-orange-400">
        <AlertTriangle size={18} />
        <h3 className="text-xs font-black uppercase tracking-widest">Critical Skill Gaps</h3>
        {hasGaps && (
          <span className="ml-auto px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[9px] font-black text-orange-400">
            {gaps.length} FOUND
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(hasGaps ? gaps : ["Skill 1", "Skill 2", "Skill 3"]).map((gap, i) => (
          <motion.span
            key={gap + i}
            initial={hasGaps ? { opacity: 0, scale: 0.8 } : {}}
            animate={hasGaps ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
            className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-400"
          >
            {gap}
          </motion.span>
        ))}
      </div>

      {hasGaps && (
        <p className="text-[11px] text-muted-text leading-relaxed pt-1">
          These skills were mentioned in the job description but not found in your resume. Consider adding relevant experience or certifications.
        </p>
      )}
    </motion.div>
  );
}
