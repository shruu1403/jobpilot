"use client";

import { Analysis } from "@/types/analysis";
import { 
  Eye, 
  RotateCcw, 
  Trash2, 
  Briefcase, 
  Building2, 
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { motion } from "framer-motion";

interface HistoryItemCardProps {
  analysis: Analysis;
  index: number;
  isSelected: boolean;
  onView: (analysis: Analysis) => void;
  onReanalyze: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
}

export function HistoryItemCard({ 
  analysis, 
  index, 
  isSelected, 
  onView, 
  onReanalyze, 
  onDelete 
}: HistoryItemCardProps) {
  const score = analysis.match_score;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-blue-400";
    if (s >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-green-500/10 border-green-500/20";
    if (s >= 60) return "bg-blue-500/10 border-blue-500/20";
    if (s >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getScoreIcon = (s: number) => {
    if (s >= 70) return <TrendingUp size={14} />;
    if (s >= 40) return <Minus size={14} />;
    return <TrendingDown size={14} />;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Strong";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Low";
  };

  const formattedDate = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer
        ${isSelected 
          ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.12)]" 
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
        }
      `}
      onClick={() => onView(analysis)}
    >
      {/* Top Row: Job Title + Score */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={14} className="text-blue-400 shrink-0" />
            <h4 className="text-white font-bold text-sm truncate">
              {analysis.job_title || "Untitled Role"}
            </h4>
          </div>
          {analysis.company && (
            <div className="flex items-center gap-1.5 ml-[22px]">
              <Building2 size={12} className="text-muted-text shrink-0" />
              <span className="text-muted-text text-xs font-medium truncate">
                {analysis.company}
              </span>
            </div>
          )}
        </div>

        {/* Score Badge */}
        <div className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shrink-0
          ${getScoreBg(score)}
        `}>
          {getScoreIcon(score)}
          <span className={`text-lg font-black ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-3 mb-3 ml-[22px]">
        <div className="flex items-center gap-1 text-muted-text">
          <Calendar size={11} />
          <span className="text-[11px] font-medium">{formattedDate}</span>
        </div>
        {analysis.resume_name && (
          <div className="flex items-center gap-1 text-muted-text">
            <FileText size={11} />
            <span className="text-[11px] font-medium truncate max-w-[120px]">{analysis.resume_name}</span>
          </div>
        )}
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getScoreBg(score)} ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>

      {/* Tags */}
      {analysis.tags && analysis.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 ml-[22px]">
          {analysis.tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-white/[0.04] border border-white/5 rounded-md text-[10px] font-bold text-white/50 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5 ml-[22px]">
        <button
          onClick={(e) => { e.stopPropagation(); onView(analysis); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <Eye size={12} />
          View
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReanalyze(analysis); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-purple-400 text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw size={12} />
          Re-analyze
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(analysis.id); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ml-auto"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}
