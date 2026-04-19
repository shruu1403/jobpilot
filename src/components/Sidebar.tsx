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
  X 
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

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "w-[260px] h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Top Section */}
      <div className="p-8 pb-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="JobPilot Logo" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            <h1 className="text-xl font-black text-white uppercase flex-1">JobPilot</h1>
            <button 
              onClick={onClose}
              className="md:hidden text-muted-text hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
          <span className="text-[12px] font-black tracking-[0.1em] text-accent-blue/80">
            Your Job Search Engine
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


    </aside>
    </>
  );
}
