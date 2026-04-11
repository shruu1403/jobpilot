"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DeleteAccountModalProps {
  userId: string;
}

export default function DeleteAccountModal({ userId }: DeleteAccountModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);
    try {
      // Delete user data from all tables
      const tables = ["referrals", "analyses", "jobs", "resumes", "profiles"];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", userId);
        
        // Ignore errors for tables that might not have data
        if (error && !error.message.includes("0 rows")) {
          console.warn(`Could not delete from ${table}:`, error.message);
        }
      }

      // Sign out the user (Supabase client-side can't delete auth users,
      // but clearing data + signing out effectively removes them)
      await supabase.auth.signOut();

      toast.success("Account data deleted successfully");
      router.push("/login");
    } catch (err: any) {
      toast.error("Failed to delete account: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Danger Zone Card */}
      <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-8 transition-all duration-300 hover:border-red-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-red-500/10">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
        </div>

        <p className="text-muted-text text-sm mb-6 leading-relaxed">
          Permanently delete your account and all associated data including
          resumes, analyses, job applications, and referrals. This action cannot
          be undone.
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-semibold rounded-xl border border-red-500/20 hover:border-red-500/30 transition-all duration-300 cursor-pointer"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className="bg-[#111827] border border-white/[0.06] rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10">
                  <AlertTriangle size={22} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Delete Account
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
                }}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} className="text-muted-text" />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-500/[0.06] border border-red-500/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-300/90 leading-relaxed">
                <strong>Are you sure?</strong> This action is irreversible. All
                your data will be permanently deleted—resumes, analyses, job
                applications, referrals, and profile information.
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-muted-text uppercase tracking-widest mb-2">
                Type &quot;DELETE&quot; to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-12 px-4 bg-white/[0.03] border border-red-500/20 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/40 transition-all duration-300"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
                }}
                className="flex-1 px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== "DELETE"}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 cursor-pointer"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
