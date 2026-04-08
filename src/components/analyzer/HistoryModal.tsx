"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Analysis } from "@/types/analysis";
import { HistoryItemCard } from "./HistoryItemCard";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  Search,
  History,
  Loader2,
  Filter,
  ChevronDown,
  Inbox,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onView: (analysis: Analysis) => void;
  onReanalyze: (analysis: Analysis) => void;
}

type ScoreFilter = "all" | "high" | "medium" | "low";

const PAGE_SIZE = 15;

export function HistoryModal({
  isOpen,
  onClose,
  userId,
  onView,
  onReanalyze,
}: HistoryModalProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchAnalyses = useCallback(
    async (offset = 0, append = false) => {
      try {
        if (offset === 0) setLoading(true);
        else setLoadingMore(true);

        // Get fresh user ID directly from Supabase auth
        let activeUserId = userId;
        if (!activeUserId) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          activeUserId = authUser?.id || "";
        }

        if (!activeUserId) {
          console.warn("[History] No userId from props or auth — cannot fetch");
          setLoading(false);
          return;
        }

        console.log("[History] Fetching analyses for user:", activeUserId, "offset:", offset);

        const { data, error } = await supabase
          .from("analyses")
          .select("*")
          .eq("user_id", activeUserId)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          console.error("[History] Supabase fetch error:", error);
          toast.error("Failed to load history: " + error.message);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const fetched = (data || []) as Analysis[];
        console.log("[History] Fetched", fetched.length, "analyses");

        if (append) {
          setAnalyses((prev) => [...prev, ...fetched]);
        } else {
          setAnalyses(fetched);
        }

        setHasMore(fetched.length === PAGE_SIZE);
      } catch (err: any) {
        console.error("[History] Unexpected fetch error:", err);
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setScoreFilter("all");
      setSelectedId(null);
      fetchAnalyses(0);
    }
  }, [isOpen, fetchAnalyses]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchAnalyses(analyses.length, true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("analyses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    } catch (err: any) {
      toast.error("Failed to delete");
    }
  };

  const handleView = (analysis: Analysis) => {
    setSelectedId(analysis.id);
    onView(analysis);
    onClose();
  };

  const handleReanalyze = (analysis: Analysis) => {
    onReanalyze(analysis);
    onClose();
  };

  // Filter + Search logic
  const filtered = analyses.filter((a) => {
    // Score filter
    if (scoreFilter === "high" && a.match_score < 70) return false;
    if (scoreFilter === "medium" && (a.match_score < 50 || a.match_score >= 70))
      return false;
    if (scoreFilter === "low" && a.match_score >= 50) return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.job_title?.toLowerCase().includes(q);
      const matchCompany = a.company?.toLowerCase().includes(q);
      const matchResume = a.resume_name?.toLowerCase().includes(q);
      return matchTitle || matchCompany || matchResume;
    }

    return true;
  });

  const filterLabels: Record<ScoreFilter, string> = {
    all: "All Scores",
    high: "High (≥70%)",
    medium: "Medium (50–69%)",
    low: "Low (<50%)",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-3xl bg-[#0F172A] border border-white/[0.06] rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-8 pb-6 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <History size={22} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Analysis History
                  </h2>
                  <p className="text-muted-text text-xs font-medium mt-0.5">
                    {analyses.length} past{" "}
                    {analyses.length === 1 ? "analysis" : "analyses"} found
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/5 rounded-xl text-muted-text hover:text-white transition-all hover:rotate-90 duration-300"
              >
                <X size={22} />
              </button>
            </div>

            {/* Search + Filter Row */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search by job title, company, or resume..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                />
              </div>

              {/* Score Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-muted-text hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium whitespace-nowrap"
                >
                  <Filter size={14} />
                  {filterLabels[scoreFilter]}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      showFilterDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {(
                      Object.entries(filterLabels) as [ScoreFilter, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setScoreFilter(key);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          scoreFilter === key
                            ? "bg-blue-500/10 text-blue-400"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-muted-text font-medium text-sm">
                  Loading your history...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <Inbox size={32} className="text-muted-text" />
                </div>
                <p className="text-muted-text font-bold text-sm">
                  {searchQuery || scoreFilter !== "all"
                    ? "No matches found"
                    : "No analyses yet"}
                </p>
                <p className="text-white/20 text-xs font-medium text-center max-w-[240px]">
                  {searchQuery || scoreFilter !== "all"
                    ? "Try adjusting your search or filter."
                    : "Run your first resume analysis and it will appear here."}
                </p>
              </div>
            ) : (
              <>
                {filtered.map((analysis, i) => (
                  <HistoryItemCard
                    key={analysis.id}
                    analysis={analysis}
                    index={i}
                    isSelected={selectedId === analysis.id}
                    onView={handleView}
                    onReanalyze={handleReanalyze}
                    onDelete={handleDelete}
                  />
                ))}

                {/* Load More */}
                {hasMore && !searchQuery && scoreFilter === "all" && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-xl text-muted-text hover:text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowDown size={14} />
                      )}
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
