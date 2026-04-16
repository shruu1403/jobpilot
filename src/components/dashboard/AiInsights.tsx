"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

interface AiInsightsProps {
  improvements: string[];
  loading: boolean;
}

export default function AiInsights({ improvements, loading }: AiInsightsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="flex flex-col rounded-[28px] border border-dashed border-white/[0.05] bg-[#0d1526]/50 p-6 h-full relative overflow-hidden group min-h-[300px]"
    >
      <div 
        className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-radial from-purple-500/[0.05] to-transparent rounded-full blur-2xl pointer-events-none"
      />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-purple-400" />
          </div>
          <h2 className="text-[17px] font-black text-white tracking-tight">AI Insights</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 w-full"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[52px] w-full bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </motion.div>
          ) : improvements.length > 0 ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 w-full"
            >
              {improvements.map((imp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-[#111827]/80 hover:bg-white/[0.04] border border-white/[0.03] hover:border-white/[0.08] rounded-xl transition-all shadow-sm"
                >
                  <TrendingUp size={16} className="text-blue-400 mt-[2px] shrink-0" />
                  <p className="text-[12px] text-white/90 leading-snug">{imp}</p>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <Sparkles className="text-white/20 mb-3" size={24} />
              <p className="text-sm font-medium text-white/40">
                Run an analysis to get personalized insights.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      
    </motion.div>
  );
}
