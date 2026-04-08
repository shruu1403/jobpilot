"use client";

import { useState } from "react";
import { 
  Target, 
  Link as LinkIcon, 
  Loader2, 
  Sparkles, 
  FileText,
  ScanSearch,
  Globe
} from "lucide-react";
import toast from "react-hot-toast";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  jobUrl: string;
  onUrlChange: (url: string) => void;
  loading?: boolean;
}

export function JobDescriptionInput({ 
  value, 
  onChange, 
  jobUrl, 
  onUrlChange, 
  loading 
}: JobDescriptionInputProps) {
  const [fetching, setFetching] = useState(false);

  const handleFetchJD = async () => {
    if (!jobUrl) {
      toast.error("Please enter a job posting URL");
      return;
    }

    try {
      setFetching(true);
      const response = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job description");
      }

      if (data.text) {
        onChange(data.text);
        toast.success("Job description extracted!");
        onUrlChange("");
      }
    } catch (error: any) {
      toast.error(error.message || "Error fetching URL");
    } finally {
      setFetching(false);
    }
  };

  const charCount = value.length;
  const maxChars = 2000;

  const isUrlMode = jobUrl.length > 0;
  const isManualMode = value.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between ml-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ScanSearch size={22} className={`transition-colors ${isUrlMode ? 'text-muted-text/30' : 'text-purple-400'}`} />
          </div>
          <div>
            <h3 className={`text-xs font-black uppercase tracking-[0.25em] transition-colors ${isUrlMode ? 'text-muted-text/30' : 'text-muted-text'}`}>Opportunity Intelligence</h3>
            <p className={`text-[11px] font-bold tracking-widest uppercase mt-0.5 transition-colors ${isUrlMode ? 'text-muted-text/20' : 'text-white/40'}`}>Job Description</p>
          </div>
        </div>
        {!isUrlMode && (
          <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full animate-in fade-in">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">{charCount}/{maxChars} chars</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Main Textarea */}
        <div className={`relative group ${isUrlMode ? 'opacity-20 pointer-events-none cursor-not-allowed transition-opacity' : 'transition-opacity'}`}>
          <textarea
            value={value}
            disabled={isUrlMode}
            onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
            placeholder={isUrlMode ? "Clear URL below to manually edit..." : "Paste the job description here for the AI to compare against your resume..."}
            className="w-full h-[400px] bg-[#111827] border border-white/5 rounded-[40px] p-10 text-white placeholder:text-muted-text/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-medium resize-none shadow-2xl backdrop-blur-3xl scrollbar-hide"
          />
          
          <div className="absolute top-10 right-10 text-muted-text/5 group-focus-within:text-purple-500/10 transition-colors pointer-events-none">
            <Target size={180} strokeWidth={0.5} />
          </div>

          <div className="absolute bottom-8 right-8 flex items-center gap-3 text-white/5 group-focus-within:text-white/20 transition-all">
            <Sparkles size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Engine Primed</span>
          </div>
        </div>

        {/* URL Fetch Tool */}
        <div className={`bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 transition-opacity ${isManualMode ? 'opacity-20 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/5">
              <Globe size={20} className={isManualMode ? 'text-muted-text/30' : 'text-muted-text'} />
            </div>
            <div className="flex-1 relative group">
              <input
                type="url"
                disabled={isManualMode}
                placeholder={isManualMode ? "Clear Manual JD to enter URL..." : "Or paste job posting URL"}
                value={jobUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-2xl text-white placeholder:text-muted-text/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium text-sm disabled:cursor-not-allowed"
              />
              <LinkIcon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isManualMode ? 'text-muted-text/20' : 'text-muted-text group-focus-within:text-blue-400'}`} />
            </div>
          </div>
          
          <button
            onClick={handleFetchJD}
            disabled={fetching || !jobUrl || isManualMode}
            className="w-full md:w-auto px-10 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            {fetching ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}
            Fetch Intelligence
          </button>
        </div>
      </div>
    </div>
  );
}
