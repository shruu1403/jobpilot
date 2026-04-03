"use client";

import { Search as SearchIcon, Bell, User, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function Navbar() {
  const { userName, loading, avatarUrl } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed!");
    } else {
      toast.success("Successfully logged out");
      router.push("/login");
    }
  };

  return (
    <header className="h-[60px] sticky top-0 right-0 glass border-b border-sidebar-border z-40 px-8 flex items-center justify-between">
      {/* Search Section */}
      <div className="flex-1 max-w-[400px]">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-white transition-colors duration-200">
            <SearchIcon size={18} />
          </div>
          <input
            type="text"
            placeholder="Search resumes..."
            className="w-full h-10 pl-11 pr-4 bg-input-bg border border-transparent rounded-full text-sm text-white placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-300 shadow-inner"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 text-muted-text hover:text-white transition-colors duration-200">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-blue rounded-full ring-2 ring-background ring-offset-background animate-pulse" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-sidebar-border" />

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex flex-col items-end mr-1">
              <span className="text-[13px] font-semibold text-white leading-tight group-hover:text-accent-blue transition-colors">
                {loading ? "..." : userName}
              </span>
            </div>
            
            <button className="p-1 rounded-full border-2 border-accent-blue/40 group-hover:border-accent-blue transition-colors duration-300 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-accent-blue/20 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-accent-blue" />
                )}
              </div>
            </button>
          </div>

          {/* Logout Dropdown */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-[#111827] border border-white/5 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-white/5 mb-1">
                <p className="text-[10px] font-black text-muted-text uppercase tracking-widest leading-none mb-1">Account Info</p>
                <p className="text-xs font-bold text-white line-clamp-1">{userName}</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all group/logout"
              >
                <LogOut size={16} className="group-hover/logout:-translate-x-1 transition-transform" />
                <span className="text-[11px] font-black tracking-widest uppercase">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
