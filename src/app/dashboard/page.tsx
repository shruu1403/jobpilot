"use client";

import { useState } from "react";

import ReadinessHero from "@/components/dashboard/ReadinessHero";
import PriorityActions from "@/components/dashboard/PriorityActions";
import MatchedJobsSection from "@/components/dashboard/MatchedJobsSection";
import AiInsights from "@/components/dashboard/AiInsights";
import { motion } from "framer-motion";
import {
  Briefcase,
  Sparkles,
  Activity,
} from "lucide-react";

// Fade-in animation for staggered cards
const cardVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.6 + i * 0.1, ease: "easeOut" },
  }),
};

function PlaceholderCard({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  index,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#111827] to-[#0d1526] border border-white/[0.05] p-7 flex flex-col gap-4 hover:border-white/[0.1] transition-all duration-500 cursor-default"
    >
      {/* Ambient glow on hover */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `${accentColor}10` }}
      />

      {/* Icon + Title */}
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <Icon size={20} style={{ color: accentColor }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-[11px] text-muted-text font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Placeholder content lines */}
      <div className="space-y-2.5 relative z-10">
        <div className="h-3 w-full bg-white/[0.03] rounded-lg" />
        <div className="h-3 w-4/5 bg-white/[0.03] rounded-lg" />
        <div className="h-3 w-3/5 bg-white/[0.03] rounded-lg" />
      </div>

      {/* Coming soon badge */}
      <div className="mt-auto pt-2 relative z-10">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-[9px] font-black text-muted-text uppercase tracking-widest">
          Coming Soon
        </span>
      </div>
    </motion.div>
  );
}

import RecentActivity from "@/components/dashboard/RecentActivity";
import { useUser } from "@/hooks/useUser";

export default function Dashboard() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const { user, loading: authLoading } = useUser();

  const isGuest = !user && !authLoading;

  return (
    <div className="max-w-[1400px] mx-auto relative animate-in fade-in duration-700">
      
      {/* ==== DEMO BANNER ==== */}
      {isGuest && (
        <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full border border-blue-500/30">
              <Activity size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Viewing Sample Dashboard</h3>
              <p className="text-[12px] text-muted-text">This is mock data to give you an idea of the UI. Sign up to see your real insights.</p>
            </div>
          </div>
          {/* <button
            onClick={() => window.location.href = '/signup'}
            className="whitespace-nowrap px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Sign Up Now
          </button> */}
        </div>
      )}

      {/* ==== DASHBOARD CONTENT ==== */}
      <div className="space-y-8">
        {/* Hero Section */}
        <ReadinessHero 
          isDemo={isGuest}
          onInsightsLoaded={(data, isLoading) => {
            setInsights(data);
            setLoadingInsights(isLoading);
          }}
        />

        {/* Main Content Grid: Priority Actions (60%) + AI Insights Placeholder (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3">
            <PriorityActions isDemo={isGuest} />
          </div>
          <div className="lg:col-span-2">
            <AiInsights improvements={insights} loading={loadingInsights} />
          </div>
        </div>

        {/* Bottom Grid: Matched Jobs (60%) + Recent Activity (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3">
            <MatchedJobsSection isDemo={isGuest} />
          </div>
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-gray-400 font-bold tracking-widest uppercase mb-2">Recent Activity</h2>
            </div>
            <div className="flex-1">
              <RecentActivity isDemo={isGuest} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}