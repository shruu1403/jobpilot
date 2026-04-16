"use client";

import { Search as SearchIcon, User, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export function Navbar() {
  const { user, userName, userRole, loading, avatarUrl } = useUser();
  const isAuthenticated = !!user;
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isResumePage = pathname === "/resumes";
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");


  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

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
      router.replace("/");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Update URL query param
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    // Use replace to avoid filling up history
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-[60px] sticky top-0 right-0 glass border-b border-sidebar-border z-40 px-8 flex items-center justify-between">
      {/* Search Section */}
      <div className={`flex-1 max-w-[400px] transition-all duration-500 ${isResumePage ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-white transition-colors duration-200">
            <SearchIcon size={18} />
          </div>
          <input
            type="text"
            placeholder="Search resumes..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full h-10 pl-11 pr-4 bg-input-bg border border-transparent rounded-full text-sm text-white placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-300 shadow-inner"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">

        {/* Sign Up button — only for unauthenticated users */}
        {!loading && !isAuthenticated && (
          <Link
            href="/signup"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 shadow-[0_0_16px_rgba(37,99,235,0.3)] transition-all"
          >
            <UserPlus size={15} />
            Sign Up
          </Link>
        )}

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
              {userRole && (
                <span className="text-[10px] font-medium text-muted-text leading-tight mt-0.5">
                  {userRole}
                </span>
              )}
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
              {/* <div className="px-4 py-3 border-b border-white/5 mb-1">
                <p className="text-[10px] font-black text-muted-text uppercase tracking-widest leading-none mb-1">Account Info</p>
                <p className="text-xs font-bold text-white line-clamp-1">{userName}</p>
              </div> */}
              
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
