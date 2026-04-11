"use client";

import { Copy, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MessageCardProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  wordCount: number;
  onCopy: () => void;
  copyLabel?: string;
  onRegenerate?: () => void;
  subject?: string;
  loading?: boolean;
  highlightTerms?: string[];
  className?: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedMessage({
  content,
  highlightTerms = [],
}: {
  content: string;
  highlightTerms?: string[];
}) {
  const normalizedTerms = Array.from(
    new Set(highlightTerms.map((term) => term.trim()).filter(Boolean))
  );

  if (!normalizedTerms.length) {
    return <span>{content}</span>;
  }

  const matcher = new RegExp(
    `(${normalizedTerms.map((term) => escapeRegExp(term)).join("|")})`,
    "gi"
  );

  const parts = content.split(matcher);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = normalizedTerms.some(
          (term) => term.toLowerCase() === part.toLowerCase()
        );

        if (!isMatch) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <mark
            key={`${part}-${index}`}
            className="rounded-md bg-cyan-400/15 px-1 py-0.5 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

export function MessageCard({
  title,
  icon,
  content,
  wordCount,
  onCopy,
  copyLabel = "Copy",
  onRegenerate,
  subject,
  loading = false,
  highlightTerms = [],
  className,
}: MessageCardProps) {
  return (
    <motion.div
      layout
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[40px] border border-white/5 bg-[#111827] p-8 shadow-2xl transition-all duration-300 hover:border-white/10 group h-full min-h-[400px]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.06),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_35%)]" />
      
      <div className="relative flex flex-col h-full space-y-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-xl shadow-cyan-950/20">
              {icon}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  AI Generated
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
                <span>{wordCount} words</span>
                {subject && <span className="h-1 w-1 rounded-full bg-slate-700 mx-2" />}
                {subject && (
                  <p className="line-clamp-1 italic">
                    Subject: <span className="text-slate-300">{subject}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-center sm:self-auto">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                title="Regenerate"
              >
                <RefreshCw size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onCopy}
              className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-200 transition-all hover:scale-[1.02] hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              <Copy size={16} />
              {copyLabel}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "relative flex-1 min-h-[250px] rounded-[32px] border border-white/5 bg-slate-950/40 p-7 text-[15px] leading-relaxed text-slate-300 shadow-inner overflow-y-auto custom-scrollbar",
            loading && "animate-pulse"
          )}
        >
          {loading ? (
            <div className="space-y-4 pt-2">
              <div className="h-4 w-full rounded-full bg-white/5" />
              <div className="h-4 w-11/12 rounded-full bg-white/5" />
              <div className="h-4 w-10/12 rounded-full bg-white/5" />
              <div className="h-4 w-9/12 rounded-full bg-white/5" />
            </div>
          ) : content ? (
            <div className="whitespace-pre-wrap font-medium">
              <HighlightedMessage content={content} highlightTerms={highlightTerms} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-600">
              <Sparkles size={24} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">Awaiting Generation</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
