"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { ResumeUploader } from "@/components/analyzer/ResumeUploader";
import { Resume } from "@/types/resume";
import { 
  History as HistoryIcon, 
  Sparkles, 
  Wand2, 
  FileEdit,
  ArrowRight,
  Loader2,
  Lock,
  RefreshCw
} from "lucide-react";
import { JobDescriptionInput } from "@/components/analyzer/JobDescriptionInput";
import { MatchScoreCard } from "@/components/analyzer/MatchScoreCard";
import { SkillGapsCard } from "@/components/analyzer/SkillGapsCard";
import { SuggestionsCard } from "@/components/analyzer/SuggestionsCard";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";

const DAILY_LIMIT = 5;

export default function AnalyzerPage() {
  const { user } = useUser();
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // Analysis results (all from ONE API call)
  const [matchScore, setMatchScore] = useState(0);
  const [analysisReason, setAnalysisReason] = useState("");
  const [skillGaps, setSkillGaps] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Quota and redundancy
  const [lastAnalyzedResumeId, setLastAnalyzedResumeId] = useState<string | null>(null);
  const [lastAnalyzedJD, setLastAnalyzedJD] = useState("");
  const [dailyAnalyses, setDailyAnalyses] = useState(0);

  const handleResumeChange = (resume: Resume | null) => {
    setSelectedResume(resume);
    if (!resume) {
      resetResults();
    }
  };

  const resetResults = () => {
    setJobDescription("");
    setJobUrl("");
    setMatchScore(0);
    setAnalysisReason("");
    setSkillGaps([]);
    setSuggestions([]);
    setLastAnalyzedResumeId(null);
    setLastAnalyzedJD("");
    setAnalysisComplete(false);
  };

  // Load daily quota from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const storedData = localStorage.getItem(`jobpilot_quota_${user?.id || "guest"}`);

    if (storedData) {
      const { date, count } = JSON.parse(storedData);
      setDailyAnalyses(date === today ? count : 0);
    }
  }, [user]);

  const incrementQuota = () => {
    const today = new Date().toISOString().split("T")[0];
    const newCount = dailyAnalyses + 1;
    setDailyAnalyses(newCount);
    localStorage.setItem(
      `jobpilot_quota_${user?.id || "guest"}`,
      JSON.stringify({ date: today, count: newCount })
    );
  };

  const isRedundant = selectedResume?.id === lastAnalyzedResumeId && jobDescription === lastAnalyzedJD;
  const isLimitReached = dailyAnalyses >= DAILY_LIMIT;

  const handleAnalyze = async () => {
    if (!selectedResume || !jobDescription || isLimitReached || isRedundant) return;

    try {
      setAnalyzing(true);
      setMatchScore(0);
      setAnalysisReason("");
      setSkillGaps([]);
      setSuggestions([]);
      setAnalysisComplete(false);

      // Step 1: Download file from Supabase and extract text
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("resumes")
        .download(selectedResume.file_path);

      if (downloadError) throw new Error("Failed to download resume file.");

      const formData = new FormData();
      formData.append("file", fileData);

      const extractRes = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      // Safe JSON parsing for extract response
      const contentType = extractRes.headers.get("content-type");
      let extractData;
      if (contentType && contentType.includes("application/json")) {
        extractData = await extractRes.json();
      } else {
        const textError = await extractRes.text();
        throw new Error(`Text extraction failed: ${textError}`);
      }

      const { text: resumeText, error: extractErr } = extractData;
      if (extractErr) throw new Error(extractErr);

      // Step 2: SINGLE API call for ALL analysis
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      const data = await analyzeRes.json();

      if (analyzeRes.ok) {
        // Set ALL results from the single response
        setMatchScore(data.matchScore);
        setAnalysisReason(data.reason);
        setSkillGaps(data.skillGaps || []);
        setSuggestions(data.suggestions || []);
        setAnalysisComplete(true);

        setLastAnalyzedResumeId(selectedResume.id);
        setLastAnalyzedJD(jobDescription);
        incrementQuota();
        toast.success("Analysis complete — scroll down for full results");
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest leading-none mt-0.5">AI SERVICE</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">Resume AI Analyzer</h1>
          <p className="text-muted-text text-lg font-medium leading-relaxed">
            Optimize your resume against specific job descriptions with our advanced LLM-powered insights.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-muted-text hover:text-white font-bold text-sm transition-all flex items-center gap-2 group">
            <HistoryIcon size={18} className="group-hover:rotate-[-15deg] transition-transform" />
            <span className="relative">
              Analysis Count
              <span className="absolute -top-6 -right-2 px-1.5 py-0.5 bg-blue-500 rounded text-[9px] font-black text-white">{dailyAnalyses}/{DAILY_LIMIT}</span>
            </span>
          </button>
          <button 
            onClick={handleAnalyze}
            disabled={!selectedResume || !jobDescription || analyzing || isLimitReached || isRedundant}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group disabled:opacity-50 disabled:grayscale disabled:pointer-events-none min-w-[240px] justify-center"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : isLimitReached ? (
              <>
                <Lock size={18} className="text-white/60" />
                Daily Limit Reached
              </>
            ) : isRedundant ? (
              <>
                <RefreshCw size={18} className="text-white/60" />
                Analysis Up To Date
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Resume
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column - INPUTS */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          
          {/* Resume Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 uppercase">01</span>
              <h3 className="text-xs font-black text-muted-text uppercase tracking-widest leading-none">Master Talent Profile</h3>
            </div>
            {user?.id && (
              <ResumeUploader 
                userId={user.id} 
                selectedResume={selectedResume}
                onSelect={(resume) => handleResumeChange(resume)}
              />
            )}
          </div>

          {/* Job Description Section */}
          <div className="space-y-4">
            <JobDescriptionInput 
              value={jobDescription}
              onChange={setJobDescription}
              jobUrl={jobUrl}
              onUrlChange={setJobUrl}
              loading={analyzing}
            />
          </div>
        </div>

        {/* Right Column - RESULTS */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6 transition-all duration-1000">
          
          {/* Match Score */}
          <MatchScoreCard score={matchScore} reason={analysisReason} loading={analyzing} />

          {/* Skill Gaps — real AI data */}
          <SkillGapsCard gaps={skillGaps} active={analysisComplete} />

          {/* AI Suggestions — real AI data */}
          <SuggestionsCard suggestions={suggestions} active={analysisComplete} />
        </div>

      </div>

      {/* Footer Tools Area (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5 opacity-50 grayscale blur-[1px] pointer-events-none">
        
        {/* Cover Letter Block */}
        <div className="bg-gradient-to-br from-[#111827] to-[#0B1220] border border-white/5 rounded-[40px] p-10 flex items-center justify-between group">
          <div className="space-y-4 max-w-sm">
            <h3 className="text-2xl font-black text-white leading-tight">Generate a tailored cover letter</h3>
            <p className="text-muted-text text-sm font-medium leading-relaxed">
              Our AI can draft a professional letter that highlights your strengths while addressing the gaps identified.
            </p>
            <button className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl">
              Draft Now
            </button>
          </div>
          <div className="relative hidden lg:block">
            <div className="w-32 h-32 bg-blue-500/20 rounded-full blur-3xl absolute inset-0 animate-pulse" />
            <Wand2 size={80} className="text-muted-text/30" strokeWidth={1} />
          </div>
        </div>

        {/* Quick Fix Block */}
        <div className="bg-[#111827] border border-white/5 rounded-[40px] p-10 flex items-center justify-between">
          <div className="space-y-4 max-w-sm">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
              <FileEdit size={24} />
            </div>
            <h3 className="text-2xl font-black text-white leading-tight">Quick Fix</h3>
            <p className="text-muted-text text-sm font-medium leading-relaxed">
              We found formatting errors that might trip up legacy ATS systems. Click to auto-repair.
            </p>
            <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
              Repair Document
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
