"use client";

import { useState, useEffect, useRef } from "react";
import { User, Save, Loader2, Camera } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/lib/toast";

interface ProfileCardProps {
  userId: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  loading: boolean;
  onProfileUpdated: () => void;
}

const ROLE_SUGGESTIONS = [
  "Student",
  "MERN Developer",
  "Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "Data Scientist",
  "ML Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Mobile Developer",
  "Cloud Architect",
];

export default function ProfileCard({
  userId,
  fullName,
  role,
  avatarUrl,
  hasCustomAvatar,
  loading: initialLoading,
  onProfileUpdated,
}: ProfileCardProps) {
  const [name, setName] = useState(fullName);
  const [userRole, setUserRole] = useState(role);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep local state in sync when data is loaded from parent
  useEffect(() => {
    if (fullName) setName(fullName);
    if (role) setUserRole(role);
  }, [fullName, role]);

  useEffect(() => {
    setAvatarPreview(avatarUrl);
  }, [avatarUrl]);

  const handleAvatarChange = async (file: File) => {
    if (!userId) {
      toast.error("User not found. Please refresh and try again.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    const maxSizeMB = 2;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error("Image size should be 2 MB or less.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            avatar_url: publicUrl,
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      setAvatarPreview(publicUrl);
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profile picture updated!");
      onProfileUpdated();
    } catch (err: any) {
      toast.error(
        "Failed to upload profile picture: " +
          (err?.message || "Check avatars storage bucket and policies.")
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId) {
      toast.error("User not found. Please refresh and try again.");
      return;
    }

    setRemovingAvatar(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            avatar_url: null,
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      setAvatarPreview(null);
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profile picture removed.");
      onProfileUpdated();
    } catch (err: any) {
      toast.error("Failed to remove profile picture: " + err.message);
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // Upsert into profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: name.trim(),
            role: userRole.trim(),
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      // Dispatch event to make Navbar instantly reload and re-fetch from profiles table
      window.dispatchEvent(new Event('profile-updated'));

      toast.success("Profile updated successfully!");
      onProfileUpdated();
    } catch (err: any) {
      toast.error("Failed to update: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredSuggestions = ROLE_SUGGESTIONS.filter((r) =>
    r.toLowerCase().includes(userRole.toLowerCase())
  );

  if (initialLoading) {
    return (
      <div className="bg-sidebar-bg/60 border border-white/[0.06] rounded-2xl p-8 animate-pulse">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/5" />
          <div className="flex-1">
            <div className="h-5 w-40 bg-white/5 rounded-lg mb-2" />
            <div className="h-3 w-28 bg-white/5 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-11 w-36 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sidebar-bg/60 border border-white/[0.06] rounded-2xl p-8 transition-all duration-300 hover:border-white/[0.1]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 rounded-xl bg-accent-blue/10">
          <User size={18} className="text-accent-blue" />
        </div>
        <h2 className="text-lg font-bold text-white">Profile Identity</h2>
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                handleAvatarChange(selectedFile);
              }
              e.currentTarget.value = "";
            }}
          />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border-2 border-white/[0.06] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-accent-blue/30">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-accent-blue/60" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            aria-label="Change profile picture"
          >
            {uploadingAvatar ? (
              <Loader2 size={20} className="text-white/80 animate-spin" />
            ) : (
              <Camera size={20} className="text-white/80" />
            )}
          </button>
        </div>
        <div>
          <h3 className="text-white font-semibold text-base">
            {name || "Your Name"}
          </h3>
          <p className="text-muted-text text-xs mt-0.5">
            {userRole || "Set your role"}
          </p>
          {/* <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar || removingAvatar}
            className="text-[11px] text-accent-blue hover:text-accent-blue/80 mt-2 transition-colors disabled:opacity-60"
          >
            {uploadingAvatar ? "Uploading..." : "Change photo"}
          </button> */}
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={uploadingAvatar || removingAvatar || !hasCustomAvatar}
            className="text-[11px] text-red-300 hover:text-red-200 mt-1 transition-colors disabled:opacity-50"
          >
            {removingAvatar ? "Removing..." : "Remove photo"}
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold text-muted-text uppercase tracking-widest mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full h-12 px-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/40 transition-all duration-300"
          />
        </div>

        {/* Role */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-muted-text uppercase tracking-widest mb-2">
            Role
          </label>
          <input
            type="text"
            value={userRole}
            onChange={(e) => {
              setUserRole(e.target.value);
              setShowRoleSuggestions(true);
            }}
            onFocus={() => setShowRoleSuggestions(true)}
            onBlur={() =>
              setTimeout(() => setShowRoleSuggestions(false), 200)
            }
            placeholder="e.g. MERN Developer, Student"
            className="w-full h-12 px-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/40 transition-all duration-300"
          />

          {/* Role Suggestions Dropdown */}
          {showRoleSuggestions && userRole && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111827] border border-white/[0.06] rounded-xl shadow-2xl z-50 max-h-44 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setUserRole(suggestion);
                    setShowRoleSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-muted-text hover:text-white hover:bg-white/[0.04] transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || uploadingAvatar || removingAvatar}
          className="flex items-center gap-2 px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/30 cursor-pointer"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
