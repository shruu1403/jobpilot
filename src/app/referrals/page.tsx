"use client";

import { startTransition, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ReferralForm } from "@/components/referrals/ReferralForm";
import { OutputPanel } from "@/components/referrals/OutputPanel";
import { getResumes } from "@/services/getResumes";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Sparkles } from "lucide-react";
import { ResumeSelectModal } from "@/components/analyzer/ResumeSelectModal";
import type { ReferralFormValues, ReferralResponse } from "@/types/referral";
import type { Resume } from "@/types/resume";

const DAILY_LIMIT = 15;

const initialValues: ReferralFormValues = {
  jobRole: "",
  company: "",
  tone: "Professional",
  recipientName: "",
  background: "",
  keySkills: "",
  whyCompany: "",
  connectionContext: "Cold outreach",
  jobLink: "",
  portfolioLink: "",
  messageLength: "Short",
  callToAction: "Ask for referral",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ReferralsPage() {
  const { user } = useUser();
  const [formValues, setFormValues] = useState<ReferralFormValues>(initialValues);
  const [result, setResult] = useState<ReferralResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [usingResume, setUsingResume] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [variationSeed, setVariationSeed] = useState(0);
  const [selectModalOpen, setSelectModalOpen] = useState(false);

  // New States for Intelligence
  const [resumeText, setResumeText] = useState("");
  const [isAutofilled, setIsAutofilled] = useState(false);

  // Stats Tracker
  const [usageCount, setUsageCount] = useState<number>(0);
  const [fetchingUsage, setFetchingUsage] = useState(true);

  // Fetch today's usage from Supabase or LocalStorage
  const fetchUsage = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      if (user) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { count, error } = await supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", todayStart.toISOString())
          .lte("created_at", todayEnd.toISOString());

        if (error) throw error;
        setUsageCount(count || 0);
      } else {
        const storedData = localStorage.getItem("jobpilot_referral_quota_guest");
        if (storedData) {
          const { date, count } = JSON.parse(storedData);
          setUsageCount(date === today ? count : 0);
        } else {
          setUsageCount(0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch referral usage:", err);
    } finally {
      setFetchingUsage(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  const updateField = <K extends keyof ReferralFormValues>(
    field: K,
    value: ReferralFormValues[K]
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const hasHitLimit = usageCount >= DAILY_LIMIT;

  const generateDrafts = async (nextVariation = variationSeed) => {
    if (!formValues.jobRole.trim() || !formValues.company.trim()) {
      return;
    }

    try {
      setGenerating(true);

      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValues,
          variationSeed: nextVariation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate referral drafts.");
      }

      startTransition(() => {
        setResult(data);
      });

      // Insert record to track usage
      if (user) {
        await supabase.from("referrals").insert({
          user_id: user.id,
          job_role: formValues.jobRole,
          company: formValues.company,
          created_at: new Date().toISOString()
        });

        import("@/services/activityLogs").then(({ logActivity }) => {
          logActivity(
            user.id,
            'referral',
            'Requested Referral',
            `For ${formValues.company}`
          );
        });
      }

      setUsageCount((prev) => {
        const newCount = prev + 1;
        if (!user) {
          const today = new Date().toISOString().split("T")[0];
          localStorage.setItem(
            "jobpilot_referral_quota_guest",
            JSON.stringify({ date: today, count: newCount })
          );
        }
        return newCount;
      });

      toast.success("Referral drafts generated");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Generation failed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    setVariationSeed(0);
    await generateDrafts(0);
  };

  const handleRegenerate = async () => {
    const nextVariation = variationSeed + 1;
    setVariationSeed(nextVariation);
    await generateDrafts(nextVariation);
  };

  const handleUseResume = () => {
    if (!user?.id) {
      toast('Sign in to pull your info from a library resume', {
        icon: '🔒',
        duration: 6000,
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(59,130,246,0.3)',
        },
      });
      return;
    }
    setSelectModalOpen(true);
  };

  const handleResumeSelect = async (resume: Resume) => {
    try {
      setUsingResume(true);
      setSelectModalOpen(false);

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("resumes")
        .download(resume.file_path);

      if (downloadError || !fileBlob) {
        throw new Error("Could not download your resume.");
      }

      const formData = new FormData();
      formData.append("file", fileBlob, resume.file_name);

      // Pass current job info for context-aware extraction
      if (formValues.jobRole) formData.append("jobRole", formValues.jobRole);
      if (formValues.company) formData.append("company", formValues.company);

      const autofillRes = await fetch("/api/referrals/autofill", {
        method: "POST",
        body: formData,
      });

      const data = await autofillRes.json();

      if (!autofillRes.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setFormValues((current) => ({
        ...current,
        background: data.background || current.background,
        keySkills: data.keySkills || current.keySkills,
        portfolioLink: data.portfolioLink || current.portfolioLink,
        whyCompany: data.whyCompany || current.whyCompany,
      }));

      // Store raw text for future "Refine" calls if we decide to implement text-based refinement
      // For now, let's keep it simple. If we want faster refinement, we can extract text once.
      setIsAutofilled(true);
      toast.success("Smart info pulled from resume!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to pull from resume"));
    } finally {
      setUsingResume(false);
    }
  };

  const handleRefine = async () => {
    if (!isAutofilled) {
      toast.error("Autofill from a resume first.");
      return;
    }
    // Re-trigger the logic using the current form values for better mapping
    // To avoid downloading again, we'd need to have stored the text.
    // Let's implement background text-based refinement.
    toast.error("Please re-select resume for fresh refinement.");
    setSelectModalOpen(true);
  };

  const highlightTerms = [
    formValues.company,
    formValues.jobRole,
    formValues.recipientName,
    ...formValues.keySkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 4),
  ].filter(Boolean);

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden px-4 md:px-6 pb-12">
      <div className="pointer-events-none absolute inset-0 bg-[#0B1220]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.06),transparent_40%)]" />

      {/* Top Header Section — Full Width */}
      <div className="relative mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-4">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Referral Generator</h1>
          <p className="max-w-xl text-base md:text-md leading-relaxed text-slate-400">
            Craft thoughtful, company-specific outreach that looks like it came from an insider, not a bot.
          </p>
        </div>

        {/* Daily Limit Tracker Box */}
        {!fetchingUsage && (
          <div className="bg-sidebar-bg/60 border border-white/[0.06] rounded-2xl p-5 min-w-[240px] shadow-xl backdrop-blur-sm self-stretch md:self-auto flex flex-col justify-center">
            <div className="flex justify-between items-center mb-3">
              <span className={`text-[11px] font-black uppercase tracking-widest ${hasHitLimit ? "text-red-400" : "text-accent-blue"}`}>
                {hasHitLimit ? "Daily Limit Reached" : "Daily Quota"}
              </span>
              <span className="text-sm font-bold text-white">
                {usageCount} <span className="text-muted-text font-medium">/ {DAILY_LIMIT}</span>
              </span>
            </div>

            <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-white/[0.04]">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${hasHitLimit ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-accent-blue to-blue-400"}`}
                style={{ width: `${Math.min((usageCount / DAILY_LIMIT) * 100, 100)}%` }}
              />
            </div>

            {hasHitLimit && (
              <p className="text-[10px] text-red-400/80 mt-2 font-medium">
                Resets at midnight.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="relative grid grid-cols-1 gap-10 xl:grid-cols-12 max-w-[1700px] mx-auto">
        {/* LEFT PANEL — span 5 columns */}
        <div className="xl:col-span-5 h-fit xl:sticky xl:top-8">
          <ReferralForm
            values={formValues}
            onChange={updateField}
            onGenerate={handleGenerate}
            onUseResume={handleUseResume}
            onRefine={handleRefine}
            isAutofilled={isAutofilled}
            isGenerateDisabled={!formValues.jobRole.trim() || !formValues.company.trim() || generating || hasHitLimit}
            generating={generating}
            usingResume={usingResume}
            advancedOpen={advancedOpen}
            onToggleAdvanced={() => setAdvancedOpen((current) => !current)}
          />
        </div>

        {/* RIGHT PANEL — span 7 columns */}
        <div className="xl:col-span-7">
          <OutputPanel
            result={result}
            loading={generating}
            onRegenerate={handleRegenerate}
            canRegenerate={Boolean(result) && !generating}
            highlightTerms={highlightTerms}
          />
        </div>
      </div>

      {user?.id && (
        <ResumeSelectModal
          userId={user.id}
          isOpen={selectModalOpen}
          onClose={() => setSelectModalOpen(false)}
          onSelect={handleResumeSelect}
        />
      )}
    </div>
  );
}
