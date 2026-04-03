"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Briefcase, 
  Users, 
  Settings, 
  Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import Image from "next/image";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Resumes", icon: FileText, href: "/resumes" },
  { label: "Analyzer", icon: Search, href: "/analyzer" },
  { label: "Jobs", icon: Briefcase, href: "/jobs" },
  { label: "Referrals", icon: Users, href: "/referrals" },
  { label: "Settings", icon: Settings, href: "/settings" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50">
      {/* Top Section */}
      <div className="p-8 pb-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="JobPilot Logo" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">JobPilot</h1>
          </div>
          <span className="text-[10px] font-black tracking-[0.3em] text-accent-blue/80 uppercase">
            AI Career Suite
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-accent-blue/10 text-white"
                    : "text-muted-text hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-accent-blue" : "text-muted-text group-hover:text-white"
                  )}
                />
                <span className="text-[15px] font-medium leading-none">
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <>
                    <div className="absolute right-0 w-1 h-6 bg-accent-blue rounded-l-full shadow-[0_0_8px_#3B82F6]" />
                    <div className="absolute inset-0 bg-accent-blue/5 rounded-xl blur-[2px]" />
                  </>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-6">
        <div className="bg-slate-800/10 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
          {/* Subtle decoration */}
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-accent-purple/10 rounded-full blur-2xl group-hover:bg-accent-purple/20 transition-colors duration-500" />
          
          <p className="text-muted-text text-xs mb-3 font-medium">Ready for more?</p>
          <button className="w-full py-3 px-4 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40 transform hover:-translate-y-0.5 transition-all duration-300">
            <Zap size={16} fill="white" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}
