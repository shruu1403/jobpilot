"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { Suspense, useState, useEffect } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  // Define routes that should NOT have the Sidebar and Navbar
  const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/reset-password";

  if (isAuthPage) {
    return (
      <div className="min-h-screen">
        {children}
        <Toaster
          position="top-right"
          containerStyle={{ top: 16, right: 16 }}
          toastOptions={{
            duration: 3000,
            style: {
              maxWidth: 340,
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              fontSize: '13px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { duration: 2500 },
            error: { duration: 4000 },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[260px] relative min-h-screen flex flex-col w-full md:w-auto">
        {/* Top Navbar */}
        <Suspense fallback={<div className="h-[60px] border-b border-sidebar-border glass" />}>
          <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </Suspense>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">Loading...</div>}>
            {children}
          </Suspense>
        </div>
      </main>
      <Toaster
          position="top-right"
          containerStyle={{ top: 16, right: 16 }}
          toastOptions={{
            duration: 3000,
            style: {
              maxWidth: 340,
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              fontSize: '13px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { duration: 2500 },
            error: { duration: 4000 },
          }}
        />
    </div>
  );
}
