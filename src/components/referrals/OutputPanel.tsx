"use client";

import { Mail, MessageSquareText, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import { MessageCard } from "@/components/referrals/MessageCard";
import type { ReferralResponse } from "@/types/referral";

interface OutputPanelProps {
  result: ReferralResponse | null;
  loading: boolean;
  onRegenerate: () => void;
  canRegenerate: boolean;
  highlightTerms: string[];
}

function getWordCount(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

async function copyToClipboard(content: string, successMessage: string) {
  if (!content) return;

  await navigator.clipboard.writeText(content);
  toast.success(successMessage);
}

export function OutputPanel({
  result,
  loading,
  onRegenerate,
  canRegenerate,
  highlightTerms,
}: OutputPanelProps) {
  const linkedinMessage = result?.linkedinMessage ?? "";
  const emailSubject = result?.email.subject ?? "";
  const emailBody = result?.email.body ?? "";

  if (!result && !loading) {
    return (
      <div className="flex min-h-[600px] w-full flex-col items-center justify-center rounded-[40px] border border-white/5 bg-[#111827]/50 p-12 text-center shadow-2xl backdrop-blur-xl">
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/10" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <Sparkles size={40} />
          </div>
        </div>
        <h3 className="mb-3 text-2xl font-black text-white">Ready to generate</h3>
        <p className="max-w-xs text-sm leading-relaxed text-slate-500">
          Fill in the details on the left and we will draft the perfect referral messages for both LinkedIn and Email.
        </p>
        <div className="mt-10 flex gap-4 opacity-20 transition-opacity hover:opacity-100">
           <div className="h-2 w-12 rounded-full bg-white/20" />
           <div className="h-2 w-8 rounded-full bg-white/20" />
           <div className="h-2 w-16 rounded-full bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 h-full">
      <MessageCard
        title="LinkedIn Message"
        icon={<MessageSquareText size={24} />}
        content={linkedinMessage}
        wordCount={getWordCount(linkedinMessage)}
        onCopy={() => copyToClipboard(linkedinMessage, "LinkedIn message copied")}
        onRegenerate={canRegenerate ? onRegenerate : undefined}
        loading={loading}
        highlightTerms={highlightTerms}
        className="flex-1"
      />

      <MessageCard
        title="Email Draft"
        icon={<Mail size={24} />}
        content={emailBody}
        subject={emailSubject}
        wordCount={getWordCount(emailBody)}
        onCopy={() =>
          copyToClipboard(
            emailSubject ? `Subject: ${emailSubject}\n\n${emailBody}` : emailBody,
            "Email draft copied"
          )
        }
        copyLabel="Copy Email"
        loading={loading}
        highlightTerms={highlightTerms}
        className="flex-1"
      />
    </section>
  );
}
