"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define routes that should NOT have the Sidebar and Navbar
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/reset-password";

  if (isAuthPage) {
    return (
      <div className="min-h-screen">
        {children}
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Fixed width */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-[260px] relative min-h-screen">
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
