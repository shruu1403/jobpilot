"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/jobs/KanbanBoard";
import { Search } from "lucide-react";
import { InsightsPanel } from "@/components/jobs/InsightsPanel";
import { AddJobModal } from "@/components/jobs/AddJobModal";
import { useJobStore } from "@/store/useJobStore";

export default function JobTrackerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fetchJobs = useJobStore(state => state.fetchJobs);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (

    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Job Tracker

          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage and track your job applications efficiently.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 bg-[#1E2538] border border-gray-700/50 rounded-lg pl-3 pr-8 text-xs text-gray-300 focus:outline-none focus:border-accent-blue/50 appearance-none cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <option value="">Status: All</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>

            <div className="relative hidden sm:block">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 bg-[#1E2538] border border-gray-700/50 rounded-lg pl-3 pr-8 text-xs text-gray-300 focus:outline-none focus:border-accent-blue/50 appearance-none cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <option value="">Type: All</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">On-site</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-accent-blue transition-colors" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#111827] border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Top Panel - Insights */}
      <div className="mb-8">
        <InsightsPanel />
      </div>

      {/* Board Section */}
      <div className="flex-1">
        <KanbanBoard
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
        />
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-accent-blue hover:bg-[#8B7FF9] text-white shadow-[0_0_20px_rgba(108,99,255,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-50 border-2 border-white/10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>

  );
}
