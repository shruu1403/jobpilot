"use client";

import { useState, useEffect, Suspense } from "react";
import { useUser } from "@/hooks/useUser";
import { useSearchParams } from "next/navigation";
import { getResumes } from "@/services/getResumes";
import { ResumeUploader } from "@/components/analyzer/ResumeUploader";
import { Resume } from "@/types/resume";
import { Analysis } from "@/types/analysis";
import {
  History as HistoryIcon,
  Sparkles,
  FileEdit,
  ArrowRight,
  Loader2,
  Lock,
  RefreshCw,
  AlertOctagon,
  Download
} from "lucide-react";
import Image from "next/image";
import { JobDescriptionInput } from "@/components/analyzer/JobDescriptionInput";
import { MatchScoreCard } from "@/components/analyzer/MatchScoreCard";
import { SkillGapsCard } from "@/components/analyzer/SkillGapsCard";
import { SuggestionsCard } from "@/components/analyzer/SuggestionsCard";
import { HistoryModal } from "@/components/analyzer/HistoryModal";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabaseClient";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { exportToPDF, exportToDOCX } from "@/lib/exportUtils";

// Quotas are fetched from server now

export default function AnalyzerPage() {
  const { user, loading: authLoading } = useUser();
  const searchParams = useSearchParams();
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // Raw extracted resume text (needed for secondary actions)
  const [rawResumeText, setRawResumeText] = useState("");

  // Guest-mode: raw File object for direct text extraction (no Supabase)
  const [guestFile, setGuestFile] = useState<File | null>(null);

  // Primary Analysis results
  const [matchScore, setMatchScore] = useState(0);
  const [analysisReason, setAnalysisReason] = useState("");
  const [skillGaps, setSkillGaps] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [atsIssues, setAtsIssues] = useState<string[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Secondary Features States
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingLetter, setGeneratingLetter] = useState(false);

  const [fixedResume, setFixedResume] = useState<any>(null);
  const [atsImprovements, setAtsImprovements] = useState<string[]>([]);
  const [fixingResume, setFixingResume] = useState(false);

  // Quota and redundancy
  const [lastAnalyzedResumeId, setLastAnalyzedResumeId] = useState<string | null>(null);
  const [lastAnalyzedJD, setLastAnalyzedJD] = useState("");
  const [dailyAnalyses, setDailyAnalyses] = useState(0);

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false);

  // Auto-selection flag
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const isAuthenticated = !!user;
  const [DAILY_LIMIT, setDAILY_LIMIT] = useState(3);

  const handleResumeChange = (resume: Resume | null) => {
    setSelectedResume(resume);
    if (!resume) {
      resetResults();
      setGuestFile(null);
    }
  };

  const resetResults = () => {
    setJobDescription("");
    setJobUrl("");
    setMatchScore(0);
    setAnalysisReason("");
    setSkillGaps([]);
    setSuggestions([]);
    setAtsIssues([]);
    setRawResumeText("");
    setCoverLetter("");
    setFixedResume(null);
    setLastAnalyzedResumeId(null);
    setLastAnalyzedJD("");
    setAnalysisComplete(false);
  };

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const params = new URLSearchParams({ feature: "analyzer" });
        if (user?.id) params.set("userId", user.id);
        const res = await fetch(`/api/quota?${params}`);
        if (res.ok) {
          const data = await res.json();
          setDailyAnalyses(data.count || 0);
          setDAILY_LIMIT(data.limit || 3);
        }
      } catch (err) {
        console.error("Failed to fetch quota:", err);
      }
    };
    fetchUsage();
  }, [user]);

  // Handle auto-selection of resume from library redirect
  useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    if (user?.id && resumeId && !hasAutoSelected) {
      const autoSelectResume = async () => {
        setHasAutoSelected(true);
        try {
          const resumes = await getResumes(user.id);
          const found = resumes.find(r => r.id === resumeId);
          if (found) {
            setSelectedResume(found);
            // Wait a bit before showing success to ensure UI has settled
            setTimeout(() => toast.success("Resume loaded from library"), 100);
          }
        } catch (error) {
          console.error("Auto-selection failed:", error);
        }
      };
      autoSelectResume();
    }
  }, [user, searchParams, hasAutoSelected]);

  const incrementQuota = async () => {
    try {
      const params = new URLSearchParams({ feature: "analyzer" });
      if (user?.id) params.set("userId", user.id);
      const res = await fetch(`/api/quota?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDailyAnalyses(data.count || 0);
      }
    } catch {
      setDailyAnalyses((prev) => prev + 1);
    }
  };

  const isRedundant = selectedResume?.id === lastAnalyzedResumeId && jobDescription === lastAnalyzedJD;
  const isLimitReached = dailyAnalyses >= DAILY_LIMIT;
  // A "meaningful" analysis has a score > 0 — random docs / irrelevant JDs yield 0
  const isMeaningfulAnalysis = analysisComplete && matchScore > 0;

  const handleAnalyze = async () => {
    if (!selectedResume || !jobDescription || isLimitReached || isRedundant) return;

    try {
      setAnalyzing(true);
      setMatchScore(0);
      setAnalysisReason("");
      setSkillGaps([]);
      setSuggestions([]);
      setAtsIssues([]);
      setCoverLetter("");
      setFixedResume(null);
      setAnalysisComplete(false);

      let resumeText = "";

      if (!isAuthenticated && guestFile) {
        // Guest mode: extract text directly from the local File object
        const formData = new FormData();
        formData.append("file", guestFile);

        const extractRes = await fetchWithTimeout("/api/extract", { method: "POST", body: formData }, 15_000);

        const contentType = extractRes.headers.get("content-type");
        let extractData;
        if (contentType && contentType.includes("application/json")) {
          extractData = await extractRes.json();
        } else {
          const textError = await extractRes.text();
          throw new Error(`Text extraction failed: ${textError}`);
        }

        const { text, error: extractErr } = extractData;
        if (extractErr) throw new Error(extractErr);
        resumeText = text;
      } else {
        // Authenticated mode: download from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("resumes")
          .download(selectedResume.file_path);

        if (downloadError) throw new Error("Failed to download resume file.");

        const formData = new FormData();
        formData.append("file", fileData);

        const extractRes = await fetchWithTimeout("/api/extract", { method: "POST", body: formData }, 15_000);

        const contentType = extractRes.headers.get("content-type");
        let extractData;
        if (contentType && contentType.includes("application/json")) {
          extractData = await extractRes.json();
        } else {
          const textError = await extractRes.text();
          throw new Error(`Text extraction failed: ${textError}`);
        }

        const { text, error: extractErr } = extractData;
        if (extractErr) throw new Error(extractErr);
        resumeText = text;
      }

      setRawResumeText(resumeText); // Save for quick-fix/cover letter

      // AI Analysis
      const analyzeRes = await fetchWithTimeout("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, userId: user?.id }),
      }, 30_000);

      const data = await analyzeRes.json();

      if (analyzeRes.ok) {
        setMatchScore(data.matchScore);
        setAnalysisReason(data.reason);
        setSkillGaps(data.skillGaps || []);
        setSuggestions(data.suggestions || []);
        setAtsIssues(data.atsIssues || []);
        setAnalysisComplete(true);
        setLastAnalyzedResumeId(selectedResume.id);
        setLastAnalyzedJD(jobDescription);
        incrementQuota();
        toast.success("Analysis complete");

        // Auto-save analysis to Supabase (only for authenticated users)
        console.log("[History] Current user at save time:", user?.id || "NOT FOUND");
        if (user?.id) {
          const payload = {
            user_id: user.id,
            resume_name: selectedResume.file_name,
            job_title: data.jobTitle || extractJobTitle(jobDescription),
            company: (data.company && data.company !== "Unknown Company") ? data.company : extractCompany(jobDescription),
            job_description: jobDescription,
            match_score: data.matchScore,
            skill_gaps: data.skillGaps || [],
            suggestions: data.suggestions || [],
          };
          console.log("[History] Saving analysis:", payload);
          const { error: insertError } = await supabase.from("analyses").insert(payload);
          if (insertError) {
            console.error("[History] Supabase insert error:", insertError);
            toast.error("Failed to save to history: " + insertError.message);
          } else {
            console.log("[History] Analysis saved successfully");
            import("@/services/activityLogs").then(({ logActivity }) => {
              logActivity(
                user.id,
                'analysis',
                'Analyzed Resume',
                selectedResume.file_name
              );
            });
          }
        } else {
          console.warn("[History] Guest user — analysis not saved to history");
        }
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error: any) {
      let msg = error.message || "Analysis failed";
      if (error?.isTimeout || msg.includes("timed out")) {
        msg = "Analysis timed out — the AI service may be busy. Please try again.";
      } else if (msg.includes("503") || msg.includes("high demand") || msg.includes("Service Unavailable")) {
        msg = "AI service is currently under high demand. Please try again in a moment.";
      } else if (msg.includes("[GoogleGenerativeAI Error]")) {
        msg = "AI service is temporarily unavailable. Please try again later.";
      }
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // ----------------------------------------------------
  // SECONDARY ACTION: Quick Fix Resume (ATS Repair)
  // ----------------------------------------------------
  const handleQuickFix = async () => {
    if (!rawResumeText) {
      toast.error("You must run analysis first");
      return;
    }

    try {
      setFixingResume(true);
      const res = await fetchWithTimeout("/api/quick-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: rawResumeText })
      }, 40_000);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFixedResume({
        header: data.header,
        summary: data.summary,
        skills: data.skills,
        projects: data.projects,
        education: data.education,
      });
      setAtsImprovements(data.improvements || []);
      toast.success("Resume repaired and formatting optimized!");
    } catch (err: any) {
      const msg = err?.isTimeout 
        ? "Resume optimization timed out — please try again." 
        : err.message || "Quick Fix failed";
      toast.error(msg);
    } finally {
      setFixingResume(false);
    }
  };

  // ----------------------------------------------------
  // SECONDARY ACTION: Cover Letter Generation
  // ----------------------------------------------------
  const handleDraftCoverLetter = async () => {
    if (!rawResumeText || !jobDescription) {
      toast.error("You must provide both a resume and job description.");
      return;
    }

    try {
      setGeneratingLetter(true);
      const res = await fetchWithTimeout("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: rawResumeText, jobDescription })
      }, 30_000);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCoverLetter(data.coverLetter);
      toast.success("Cover letter generated!");
    } catch (error: any) {
      const isTimeout = error && typeof error === 'object' && 'isTimeout' in error;
      const msg = isTimeout 
        ? "AI is busy. Please try again." 
        : (error instanceof Error ? error.message : error?.message || "Generation failed");
      toast.error(msg);
    } finally {
      setGeneratingLetter(false);
    }
  };

  // Helper to render a contact item (clickable if it has a URL)
  const renderContactItem = (item: any, idx: number, total: number) => (
    <span key={idx}>
      {item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item.text}</a>
      ) : (
        <span>{item.text}</span>
      )}
      {idx < total - 1 && <span className="text-gray-400 mx-1">|</span>}
    </span>
  );

  // -----------------------------------------------
  // History Handlers
  // -----------------------------------------------
  const handleHistoryView = (analysis: Analysis) => {
    setMatchScore(analysis.match_score);
    setAnalysisReason(analysis.reason);
    setSkillGaps(analysis.skill_gaps || []);
    setSuggestions(analysis.suggestions || []);
    setAtsIssues(analysis.ats_issues || []);
    setJobDescription(analysis.job_description);
    setAnalysisComplete(true);
    setCoverLetter("");
    setFixedResume(null);
    toast.success("Loaded analysis from history");
  };

  const handleHistoryReanalyze = (analysis: Analysis) => {
    setJobDescription(analysis.job_description);
    setCoverLetter("");
    setFixedResume(null);
    setAnalysisComplete(false);
    setLastAnalyzedResumeId(null);
    setLastAnalyzedJD("");
    toast("Job description loaded — select a resume and click Analyze", { icon: "🔄" });
  };

  // -----------------------------------------------
  // Helpers: extract job title, company, tags from JD
  // -----------------------------------------------
  function extractJobTitle(jd: string): string {
    const lines = jd.split("\n").map((l) => l.trim()).filter(Boolean);
    // Common patterns: "Job Title: ...", "Role: ...", or just first short line
    for (const line of lines.slice(0, 5)) {
      const titleMatch = line.match(/^(?:job\s*title|role|position)\s*[:–\-]\s*(.+)/i);
      if (titleMatch) return titleMatch[1].trim().slice(0, 100);
    }
    // Fallback: first line under 80 chars is likely the title
    const shortLine = lines.find((l) => l.length > 3 && l.length < 80);
    return shortLine?.slice(0, 100) || "Untitled Role";
  }

  function extractCompany(jd: string): string | null {
    const lines = jd.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 10)) {
      const compMatch = line.match(/^(?:company|organization|employer)\s*[:–\-]\s*(.+)/i);
      if (compMatch) return compMatch[1].trim().slice(0, 100);
    }
    return null;
  }

  function extractTags(jd: string): string[] {
    const tags: string[] = [];
    const lower = jd.toLowerCase();
    if (lower.includes("remote")) tags.push("Remote");
    if (lower.includes("hybrid")) tags.push("Hybrid");
    if (lower.includes("on-site") || lower.includes("onsite")) tags.push("On-site");
    if (lower.includes("full-time") || lower.includes("full time")) tags.push("Full-time");
    if (lower.includes("part-time") || lower.includes("part time")) tags.push("Part-time");
    if (lower.includes("contract")) tags.push("Contract");
    if (lower.includes("internship") || lower.includes("intern")) tags.push("Internship");
    return tags;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8 md:pb-10">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest leading-none mt-0.5">AI SERVICE</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resume AI Analyzer</h1>
          <p className="text-muted-text text-sm font-medium leading-relaxed">
            Optimize your resume against specific job descriptions with our advanced LLM-powered insights.
          </p>
        </div>

        <div className="flex flex-wrap justify-start md:justify-end items-center gap-3 sm:gap-4 mt-4 md:mt-0">
          {/* History Button — disabled for guest users */}
          {isAuthenticated ? (
            <button
              onClick={() => setHistoryOpen(true)}
              className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-muted-text hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 sm:gap-3 group hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/20 whitespace-nowrap"
            >
              <HistoryIcon size={18} className="group-hover:rotate-[-15deg] transition-transform" />
              <span>View History</span>
            </button>
          ) : (
            <button
              disabled
              className="px-6 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-white/20 font-bold text-sm flex items-center gap-3 cursor-not-allowed whitespace-nowrap"
              title="Sign in to access your analysis history"
            >
              <Lock size={16} className="text-white/20" />
              <span>View History</span>
            </button>
          )}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-muted-text text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap">
            <span className="text-blue-400 font-black">{dailyAnalyses} / {DAILY_LIMIT}</span>
            <span className="text-white/20 text-xs ml-0.5">today</span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!selectedResume || !jobDescription || analyzing || isLimitReached || isRedundant}
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group disabled:opacity-50 disabled:grayscale disabled:pointer-events-none min-w-0 sm:min-w-[240px] justify-center"
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
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 uppercase">01</span>
              <h3 className="text-xs font-black text-muted-text uppercase tracking-widest leading-none">Master Talent Profile</h3>
            </div>
            <ResumeUploader
              userId={user?.id || "guest"}
              selectedResume={selectedResume}
              onSelect={handleResumeChange}
              isAuthenticated={isAuthenticated}
              onGuestFileSelect={setGuestFile}
            />
          </div>
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

        <div className="lg:col-span-12 xl:col-span-4 space-y-6 transition-all duration-1000 xl:mt-[0rem]">
          <MatchScoreCard score={matchScore} reason={analysisReason} loading={analyzing} analysisComplete={analysisComplete} />
          
          {/* Placeholder instances in sidebar before analysis begins */}
          {(!isMeaningfulAnalysis && !analyzing) && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <SkillGapsCard gaps={[]} active={false} />
              <SuggestionsCard suggestions={[]} active={false} />
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Section (Expanded below the main grid for better readability) */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 transition-all duration-1000 overflow-hidden ${isMeaningfulAnalysis || analyzing ? "opacity-100 max-h-[2000px] mt-8" : "opacity-0 max-h-0 mt-0"}`}>
        <SkillGapsCard gaps={skillGaps} active={isMeaningfulAnalysis} />
        <SuggestionsCard suggestions={suggestions} active={isMeaningfulAnalysis} />
      </div>

      {/* NEW: Secondary Features Section (Visible after Analyze) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-8 sm:pt-10 border-t border-white/5 transition-all duration-1000 ${isMeaningfulAnalysis ? "opacity-100" : "opacity-30 grayscale blur-[1px] pointer-events-none"}`}>

        {/* Cover Letter Block */}
        <div className="bg-gradient-to-br from-[#111827] to-[#0B1220] border border-white/5 rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 flex flex-col justify-start gap-6 relative overflow-hidden group h-fit">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
            <div className="space-y-4 max-w-full sm:max-w-[260px]">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">Generate a tailored cover letter</h3>
              <p className="text-muted-text text-sm font-medium leading-relaxed">
                Draft a professional letter that highlights your strengths while addressing the gaps identified.
              </p>
              {!coverLetter ? (
                <button
                  onClick={handleDraftCoverLetter}
                  disabled={generatingLetter}
                  className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {generatingLetter ? <Loader2 size={14} className="animate-spin" /> : "Draft Now"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => exportToPDF(coverLetter, "Cover_Letter")} className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold text-xs uppercase rounded-xl hover:bg-blue-500/30 transition flex items-center gap-1">
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={() => exportToDOCX(coverLetter, "Cover_Letter")} className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold text-xs uppercase rounded-xl hover:bg-blue-500/30 transition flex items-center gap-1">
                    <Download size={14} /> DOCX
                  </button>
                </div>
              )}
            </div>

            {/* Replaced 'A' symbol with Logo image */}
            <div className="relative mr-0 sm:mr-4 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 hidden sm:block">
              <Image
                src="/logo.png"
                alt="Logo"
                width={120}
                height={120}
                className={`transition-transform duration-1000 ${generatingLetter ? "animate-pulse scale-110" : ""}`}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent mix-blend-overlay"></div>
            </div>
          </div>

          {/* Cover Letter Output Preview */}
          {coverLetter && (
            <div className="mt-4 p-5 bg-black/40 border border-white/5 rounded-2xl max-h-[220px] overflow-y-auto custom-scrollbar relative z-10 text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
              {coverLetter}
            </div>
          )}
        </div>

        {/* Quick Fix Block / ATS Section Combine */}
        <div className="bg-[#111827] border border-white/5 rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 flex flex-col relative overflow-hidden group h-fit">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 z-10 relative">
            <div className="space-y-4 max-w-sm">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">Quick Fix (ATS)</h3>

              {atsIssues.length > 0 && !fixedResume && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl space-y-1">
                  <div className="flex items-center text-red-400 font-bold text-xs gap-1.5 uppercase mb-2">
                    <AlertOctagon size={14} /> We found {atsIssues.length} ATS issues
                  </div>
                  <ul className="list-disc pl-4 text-[11px] text-red-400/80 space-y-1">
                    {atsIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {atsIssues.length === 0 && !fixedResume && (
                <p className="text-muted-text text-sm font-medium leading-relaxed">
                  No critical formatting issues, but click below to heavily optimize your action verbs and phrasing for ATS parsing bots.
                </p>
              )}

              {!fixedResume ? (
                <button
                  onClick={handleQuickFix}
                  disabled={fixingResume}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 flex items-center gap-2 mt-4"
                >
                  {fixingResume ? <Loader2 size={14} className="animate-spin" /> : "Repair Document"}
                </button>
              ) : (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => exportToPDF(fixedResume, "ATS_Optimized_Resume")} className="px-4 py-2 bg-purple-500/20 text-purple-400 font-bold text-xs uppercase rounded-xl hover:bg-purple-500/30 transition flex items-center gap-1">
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={() => exportToDOCX(fixedResume, "ATS_Optimized_Resume")} className="px-4 py-2 bg-purple-500/20 text-purple-400 font-bold text-xs uppercase rounded-xl hover:bg-purple-500/30 transition flex items-center gap-1">
                    <Download size={14} /> DOCX
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Fix Output Preview — matches PDF layout exactly */}
          {fixedResume && (
            <div className="mt-6 flex flex-col gap-4 relative z-10 w-full">
              <div className="flex flex-wrap gap-2">
                {atsImprovements.map((imp, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-bold uppercase rounded-md">
                    {imp}
                  </span>
                ))}
              </div>

              <div className="p-8 bg-white max-h-[550px] overflow-y-auto custom-scrollbar text-black shadow-lg mb-4" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>

                {/* Header */}
                {fixedResume.header && (
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-black tracking-tight" style={{ margin: 0 }}>{fixedResume.header.name}</h2>
                    <p className="text-[11px] text-gray-700 mt-1">
                      {fixedResume.header.contact?.items && Array.isArray(fixedResume.header.contact.items)
                        ? fixedResume.header.contact.items.map((item: any, idx: number) =>
                          renderContactItem(item, idx, fixedResume.header.contact.items.length)
                        )
                        : typeof fixedResume.header.contact === "string"
                          ? fixedResume.header.contact
                          : null
                      }
                    </p>
                  </div>
                )}

                {/* Summary */}
                {fixedResume.summary && (
                  <div className="mb-4">
                    <h3 className="text-[14px] font-bold uppercase text-black mb-1 border-b-[1.5px] border-black pb-1">Professional Summary</h3>
                    <p className="text-[12px] text-black leading-relaxed mt-2">{fixedResume.summary}</p>
                  </div>
                )}

                {/* Skills */}
                {fixedResume.skills && Object.keys(fixedResume.skills).length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[14px] font-bold uppercase text-black mb-1 border-b-[1.5px] border-black pb-1">Technical Skills</h3>
                    <div className="mt-2 space-y-0.5">
                      {Object.entries(fixedResume.skills).map(([category, skillsGroup]: [string, any]) => {
                        const arr = Array.isArray(skillsGroup) ? skillsGroup : [];
                        return (
                          <p key={category} className="text-[12px] text-black" style={{ margin: 0 }}>
                            <span className="font-bold">{category}: </span>
                            {arr.join(", ")}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Projects & Experience */}
                {fixedResume.projects && fixedResume.projects.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[14px] font-bold uppercase text-black mb-1 border-b-[1.5px] border-black pb-1">Experience & Projects</h3>
                    <div className="space-y-3 mt-2">
                      {fixedResume.projects.map((proj: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h4 className="text-[13px] font-bold text-black" style={{ margin: 0 }}>{proj.title || "Project"}</h4>
                            {proj.techStack && (
                              <span className="text-[11px] italic text-gray-500">[{proj.techStack}]</span>
                            )}
                          </div>
                          {/* Project links */}
                          {proj.links && Array.isArray(proj.links) && proj.links.length > 0 && (
                            <p className="text-[11px] mt-0.5 mb-1">
                              {proj.links.map((link: any, linkIdx: number) => (
                                <span key={linkIdx}>
                                  <span className="text-gray-600">{link.label}: </span>
                                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link.url}</a>
                                  {linkIdx < proj.links.length - 1 && <span className="text-gray-400 mx-1">|</span>}
                                </span>
                              ))}
                            </p>
                          )}
                          <ul className="list-disc pl-5 mt-1 space-y-0.5">
                            {Array.isArray(proj.description) && proj.description.map((desc: string, descIdx: number) => (
                              <li key={descIdx} className="text-[12px] text-black leading-relaxed">{desc}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {fixedResume.education && fixedResume.education.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[14px] font-bold uppercase text-black mb-1 border-b-[1.5px] border-black pb-1">Education</h3>
                    <div className="space-y-2 mt-2">
                      {fixedResume.education.map((edu: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between items-start">
                            <h4 className="text-[13px] font-bold text-black" style={{ margin: 0 }}>{edu.institution}</h4>
                            {edu.year && <span className="text-[12px] text-gray-600">{edu.year}</span>}
                          </div>
                          <p className="text-[12px] text-black" style={{ margin: 0 }}>{edu.degree}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* History Modal — only rendered for authenticated users */}
      {isAuthenticated && (
        <HistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          userId={user?.id || ""}
          onView={handleHistoryView}
          onReanalyze={handleHistoryReanalyze}
        />
      )}
    </div>
  );
}
