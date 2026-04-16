"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ActivityLog } from "@/services/activityLogs";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { useUser } from "@/hooks/useUser";

function formatActivityTime(dateString: string) {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Today, ${format(date, "hh:mm a")}`;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, "hh:mm a")}`;
  }
  const diff = differenceInDays(new Date(), date);
  return `${diff} days ago`;
}

const TYPE_COLORS: Record<string, string> = {
  resume: "#a855f7", // purple
  analysis: "#3b82f6", // blue
  job: "#10b981", // green
  referral: "#06b6d4" // cyan
};

export default function RecentActivity() {
  const { user } = useUser();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setActivities((data as ActivityLog[]) || []);
      } catch (err) {
        console.error("Error fetching activity logs:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchActivities();
    } else {
      setLoading(false);
    }
    
    if (!user) return;

    // Optional: Subscribe to changes for live updates
    const channel = supabase
      .channel('activity_logs_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setActivities(prev => {
          const newActivities = [payload.new as ActivityLog, ...prev].slice(0, 5);
          return newActivities;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-white/10 mt-2" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
        <p className="text-sm text-muted-text font-medium text-center">No recent activity yet. Explore the dashboard to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2">
      <div className="relative space-y-7">
        {/* Continuous vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/[0.05]" />

        {activities.map((activity, index) => {
          const color = TYPE_COLORS[activity.type] || "#ffffff";
          return (
            <div key={activity.id || index} className="relative group flex items-start gap-5 transition-all">
              {/* Timeline Node Container */}
              <div className="w-6 shrink-0 flex justify-center mt-1.5 relative z-10">
                <div 
                  className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125 duration-300 ring-[4px] ring-[#0d1526]"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: `0 0 12px ${color}80`
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="flex flex-col group-hover:-translate-y-0.5 transition-transform duration-300">
                <h4 className="text-[15px] font-bold text-white tracking-tight leading-tight mb-1">
                  {activity.title}
                </h4>
                <div className="text-[11px] text-gray-500 font-medium mb-1.5 whitespace-nowrap">
                  {formatActivityTime(activity.created_at || new Date().toISOString())}
                </div>
                <p className="text-[13px] text-muted-text leading-relaxed line-clamp-2">
                  {activity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
