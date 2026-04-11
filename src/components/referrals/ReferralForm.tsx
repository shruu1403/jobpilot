"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  FileText,
  Lightbulb,
  Library,
  Loader2,
  Sparkles,
  WandSparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CallToAction,
  ConnectionContext,
  MessageLength,
  ReferralFormValues,
  ReferralTone,
} from "@/types/referral";
import { useState, useEffect } from "react";

interface ReferralFormProps {
  values: ReferralFormValues;
  onChange: <K extends keyof ReferralFormValues>(field: K, value: ReferralFormValues[K]) => void;
  onGenerate: () => void;
  onUseResume: () => void;
  onRefine: () => void;
  isAutofilled: boolean;
  isGenerateDisabled: boolean;
  generating: boolean;
  usingResume: boolean;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
}

const toneOptions: ReferralTone[] = ["Professional", "Casual"];
const connectionOptions: ConnectionContext[] = [
  "Cold outreach",
  "Same college",
  "Mutual connection",
  "Recruiter",
  "Employee",
];
const lengthOptions: MessageLength[] = ["Short", "Detailed"];
const ctaOptions: CallToAction[] = [
  "Ask for referral",
  "Ask for quick chat",
  "Ask for guidance",
];

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function SegmentedOptions<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-sm font-bold transition-all",
              active
                ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.16)]"
                : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function BaseInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/5 bg-slate-950/40 px-5 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-slate-950/60 focus:ring-4 focus:ring-cyan-400/5",
        props.className
      )}
    />
  );
}

function BaseTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-white/5 bg-slate-950/40 px-5 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-slate-950/60 focus:ring-4 focus:ring-cyan-400/5",
        props.className
      )}
    />
  );
}

function BaseSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "w-full appearance-none rounded-2xl border border-white/5 bg-slate-950/40 px-5 py-3.5 text-sm text-white outline-none transition-all focus:border-cyan-400/40 focus:bg-slate-950/60 focus:ring-4 focus:ring-cyan-400/5",
          props.className
        )}
      />
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
        <ChevronDown size={18} />
      </div>
    </div>
  );
}

export function ReferralForm({
  values,
  onChange,
  onGenerate,
  onUseResume,
  onRefine,
  isAutofilled,
  isGenerateDisabled,
  generating,
  usingResume,
  advancedOpen,
  onToggleAdvanced,
}: ReferralFormProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Auto-generate "Why this company" when core info is present
  useEffect(() => {
    const shouldSuggest = values.jobRole && values.company && !values.whyCompany && !isSuggesting;
    
    if (shouldSuggest) {
      const suggest = async () => {
        try {
          setIsSuggesting(true);
          const res = await fetch("/api/referrals/suggest-why", {
            method: "POST",
            body: JSON.stringify({ jobRole: values.jobRole, company: values.company }),
          });
          const data = await res.json();
          if (data.suggestion) {
            onChange("whyCompany", data.suggestion);
          }
        } catch (e) {
          console.error("Suggest failed", e);
        } finally {
          setIsSuggesting(false);
        }
      };
      
      const timer = setTimeout(suggest, 1000); // 1s debounce
      return () => clearTimeout(timer);
    }
  }, [values.jobRole, values.company, values.whyCompany]);

  return (
    <div className="space-y-6">
      {/* 1. BASIC INFO CARD */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#111827] p-8 shadow-2xl shadow-black/40">
        <div className="relative space-y-7">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Basic Info</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Core Context</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FieldShell label="Job Role">
              <BaseInput
                value={values.jobRole}
                onChange={(event) => onChange("jobRole", event.target.value)}
                placeholder="Senior Product Designer"
              />
            </FieldShell>

            <FieldShell label="Company">
              <BaseInput
                value={values.company}
                onChange={(event) => onChange("company", event.target.value)}
                placeholder="Stripe"
              />
            </FieldShell>
          </div>

          <FieldShell label="Preferred Tone">
            <SegmentedOptions
              options={toneOptions}
              value={values.tone}
              onChange={(next) => onChange("tone", next)}
            />
          </FieldShell>
        </div>
      </div>

      {/* 2. PERSONALIZATION CARD */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#111827] p-8 shadow-2xl shadow-black/40">
        <div className="relative space-y-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                <FileText size={18} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-white tracking-tight">Personalization</h2>
                  {isAutofilled && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                      <Sparkles size={10} />
                      Autofilled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAutofilled && (
                <button
                  type="button"
                  onClick={onRefine}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw size={12} />
                  Refine
                </button>
              )}
              <button
                type="button"
                onClick={onUseResume}
                disabled={usingResume}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400 transition-all hover:bg-emerald-500/15 disabled:opacity-50"
              >
                {usingResume ? <Loader2 size={12} className="animate-spin" /> : <Library size={12} />}
                Pull From Library
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <FieldShell label="Brief Background">
              <BaseTextarea
                value={values.background}
                onChange={(event) => onChange("background", event.target.value)}
                placeholder="Briefly describe your experience relevant to this role..."
                className="min-h-[100px]"
              />
            </FieldShell>

            <FieldShell label="Top Skills">
              <BaseInput
                value={values.keySkills}
                onChange={(event) => onChange("keySkills", event.target.value)}
                placeholder="Figma, React, Product Strategy, etc."
              />
            </FieldShell>

            <FieldShell label="Why this company?">
              <div className="relative">
                <BaseTextarea
                  value={values.whyCompany}
                  onChange={(event) => onChange("whyCompany", event.target.value)}
                  placeholder="What genuinely excites you about their mission or products?"
                  className={cn("min-h-[100px]", isSuggesting && "animate-pulse")}
                />
                {isSuggesting && (
                  <div className="absolute top-4 right-4 text-emerald-400 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                    <Loader2 size={10} className="animate-spin" />
                    AI Thinking...
                  </div>
                )}
              </div>
            </FieldShell>
          </div>
        </div>
      </div>

      {/* 3. ADVANCED SETTINGS CARD */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#111827] p-2 shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onToggleAdvanced}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-[24px] px-6 py-4 text-left transition-all hover:bg-white/5",
            advancedOpen && "bg-white/5"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400">
              <ChevronDown size={18} className={cn("transition-transform", advancedOpen && "rotate-180")} />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight">Advanced Settings</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fine Tune</p>
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-6 px-6 pb-6 pt-8 border-t border-white/5 mt-2">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FieldShell label="Recipient Name">
                    <BaseInput
                      value={values.recipientName}
                      onChange={(event) => onChange("recipientName", event.target.value)}
                      placeholder="James Smith"
                    />
                  </FieldShell>

                  <FieldShell label="Relationship Status">
                    <BaseSelect
                      value={values.connectionContext}
                      onChange={(event) => onChange("connectionContext", event.target.value as ConnectionContext)}
                    >
                      {connectionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </BaseSelect>
                  </FieldShell>

                  <FieldShell label="Portfolio / Link">
                    <BaseInput
                      value={values.portfolioLink}
                      onChange={(event) => onChange("portfolioLink", event.target.value)}
                      placeholder="https://portfolio.dev"
                    />
                  </FieldShell>

                  <FieldShell label="Call To Action">
                    <BaseSelect
                      value={values.callToAction}
                      onChange={(event) => onChange("callToAction", event.target.value as CallToAction)}
                    >
                      {ctaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </BaseSelect>
                  </FieldShell>
                </div>

                <FieldShell label="Message Length">
                  <SegmentedOptions
                    options={lengthOptions}
                    value={values.messageLength}
                    onChange={(next) => onChange("messageLength", next)}
                  />
                </FieldShell>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="group relative flex w-full items-center justify-center gap-3 rounded-[28px] bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 px-6 py-5 text-sm font-black uppercase tracking-[0.25em] text-white shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:grayscale disabled:opacity-50"
        >
          {generating ? <Loader2 size={20} className="animate-spin" /> : <WandSparkles size={20} />}
          <span>{generating ? "Generating..." : "Generate Referral Drafts"}</span>
        </button>
      </div>
    </div>
  );
}
