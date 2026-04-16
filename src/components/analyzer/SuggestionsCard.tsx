"use client";

import { Lightbulb, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface SuggestionsCardProps {
  suggestions: string[];
  active: boolean;
}

export function SuggestionsCard({ suggestions, active }: SuggestionsCardProps) {
  const hasSuggestions = active && suggestions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`
        bg-[#111827] border border-white/5 rounded-[32px] p-8 space-y-6 transition-all duration-700
        ${hasSuggestions ? "opacity-100" : "opacity-30 grayscale blur-[1px] pointer-events-none"}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-400">
          <Lightbulb size={18} />
          <h3 className="text-xs font-black uppercase tracking-widest">AI Suggestions</h3>
        </div>
        {hasSuggestions && (
          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400">
            {suggestions.length} TIPS
          </span>
        )}
      </div>

      <div className="space-y-3">
        {(hasSuggestions ? suggestions : ["Improvement suggestion placeholder..."]).map((suggestion, i) => (
          <motion.div
            key={i}
            initial={hasSuggestions ? { opacity: 0, x: -10 } : {}}
            animate={hasSuggestions ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 * i, duration: 0.3 }}
            className="p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <ChevronRight
                size={14}
                className="text-blue-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform"
              />
              <p className="text-[12px] text-white/80 font-medium leading-relaxed">
                {suggestion}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
