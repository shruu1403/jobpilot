"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Search,
  Users,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UsageStats {
  resumeCount: number;
  resumeLimit: number;
  analysesToday: number;
  analysisLimit: number;
  referralsToday: number;
  referralLimit: number;
  jobsByStatus: {
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
  };
}

interface UsageCardProps {
  userId: string;
}

function ProgressBar({
  value,
  max,
  colorFrom,
  colorTo,
}: {
  value: number;
  max: number;
  colorFrom: string;
  colorTo: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const isNearLimit = pct >= 80;

  return (
    <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: isNearLimit
            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
            : `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
        }}
      />
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  max,
  colorFrom,
  colorTo,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  max: number;
  colorFrom: string;
  colorTo: string;
}) {
  return (
    <div className="p-5 bg-white/[0.02] rounded-xl border border-white/[0.04] transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-lg"
            style={{ background: `${colorFrom}15` }}
          >
            <Icon size={16} style={{ color: colorFrom }} />
          </div>
          <span className="text-sm text-muted-text font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold text-white">
          {value}
          <span className="text-muted-text font-normal"> / {max}</span>
        </span>
      </div>
      <ProgressBar
        value={value}
        max={max}
        colorFrom={colorFrom}
        colorTo={colorTo}
      />
    </div>
  );
}

export default function UsageCard({ userId }: UsageCardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!userId) {
        setLoading(true);
        return;
      }

      setLoading(true);
      try {
        // Get today's date range
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Parallel fetches
        const [resumeRes, analysisRes, referralRes, jobRes] = await Promise.all(
          [
            // Resume count (total)
            supabase
              .from("resumes")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId),

            // Analyses today
            supabase
              .from("analyses")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .gte("created_at", todayStart.toISOString())
              .lte("created_at", todayEnd.toISOString()),

            // Referrals today
            supabase
              .from("referrals")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .gte("created_at", todayStart.toISOString())
              .lte("created_at", todayEnd.toISOString()),

            // All jobs for status grouping
            supabase
              .from("jobs")
              .select("status")
              .eq("user_id", userId),
          ]
        );

        // Count jobs by status
        const jobsByStatus = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
        if (jobRes.data) {
          jobRes.data.forEach((job: { status: string }) => {
            const s = job.status as keyof typeof jobsByStatus;
            if (s in jobsByStatus) {
              jobsByStatus[s]++;
            }
          });
        }

        setStats({
          resumeCount: resumeRes.count || 0,
          resumeLimit: 10,
          analysesToday: analysisRes.count || 0,
          analysisLimit: 5,
          referralsToday: referralRes.count || 0,
          referralLimit: 15,
          jobsByStatus,
        });
      } catch (err) {
        console.error("Failed to fetch usage stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-sidebar-bg/60 border border-white/[0.06] rounded-2xl p-8 animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-white/5" />
          <div className="h-5 w-36 bg-white/5 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white/[0.02] rounded-xl border border-white/[0.04]"
            />
          ))}
          <div className="h-32 bg-white/[0.02] rounded-xl border border-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalJobs = Object.values(stats.jobsByStatus).reduce(
    (acc, v) => acc + v,
    0
  );

  const jobStatusColors: Record<string, string> = {
    Applied: "#3B82F6",
    Interview: "#8B5CF6",
    Offer: "#10B981",
    Rejected: "#EF4444",
  };

  return (
    <div className="bg-sidebar-bg/60 border border-white/[0.06] rounded-2xl p-8 transition-all duration-300 hover:border-white/[0.1]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-xl bg-accent-purple/10">
          <BarChart3 size={18} className="text-accent-purple" />
        </div>
        <h2 className="text-lg font-bold text-white">Usage & Limits</h2>
      </div>

      {/* Usage Stats */}
      <div className="space-y-3 mb-6">
        <StatItem
          icon={FileText}
          label="Resume Storage"
          value={stats.resumeCount}
          max={stats.resumeLimit}
          colorFrom="#3B82F6"
          colorTo="#60A5FA"
        />
        <StatItem
          icon={Search}
          label="Analyses Today"
          value={stats.analysesToday}
          max={stats.analysisLimit}
          colorFrom="#8B5CF6"
          colorTo="#A78BFA"
        />
        <StatItem
          icon={Users}
          label="Referrals Today"
          value={stats.referralsToday}
          max={stats.referralLimit}
          colorFrom="#10B981"
          colorTo="#34D399"
        />
      </div>

      {/* Job Tracking Status */}
      <div className="p-5 bg-white/[0.02] rounded-xl border border-white/[0.04]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Briefcase size={16} className="text-amber-400" />
          </div>
          <span className="text-sm text-muted-text font-medium">
            Job Tracking
          </span>
          <span className="ml-auto text-xs text-white/40 font-medium">
            {totalJobs} total
          </span>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {Object.entries(stats.jobsByStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: jobStatusColors[status] }}
              />
              <span className="text-xs text-muted-text">{status}</span>
              <span className="ml-auto text-sm font-bold text-white">
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* Combined Progress Bar */}
        {totalJobs > 0 && (
          <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden flex">
            {Object.entries(stats.jobsByStatus).map(([status, count]) => {
              const pct = (count / totalJobs) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={status}
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: jobStatusColors[status],
                  }}
                  title={`${status}: ${count}`}
                />
              );
            })}
          </div>
        )}

        {totalJobs === 0 && (
          <div className="flex items-center gap-2 justify-center py-2">
            <TrendingUp size={14} className="text-white/20" />
            <p className="text-xs text-white/20">
              No jobs tracked yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
