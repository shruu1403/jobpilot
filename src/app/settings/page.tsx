"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ProfileCard from "@/components/settings/ProfileCard";
import UsageCard from "@/components/settings/UsageCard";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";

export default function SettingsPage() {
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setAvatarUrl(
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      );

      // Fetch from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setRole(profile.role || "");
      } else {
        // Fallback to auth metadata
        setFullName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            ""
        );
        setRole(user.user_metadata?.role || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-white/[0.06]">
            <SettingsIcon size={22} className="text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-muted-text mt-0.5">
              Manage your profile, track usage, and control your account
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN — Profile & Account */}
        <div className="space-y-6">
          <ProfileCard
            userId={userId}
            fullName={fullName}
            role={role}
            avatarUrl={avatarUrl}
            loading={loading}
            onProfileUpdated={fetchProfile}
          />
          <DeleteAccountModal userId={userId} />
        </div>

        {/* RIGHT COLUMN — Usage Dashboard */}
        <div>
          <UsageCard userId={userId} />
        </div>
      </div>
    </div>
  );
}
