"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw, Trash2, Library } from "lucide-react";
import { Resume } from "@/types/resume";
import { uploadResume } from "@/services/uploadResume";
import { ResumeSelectModal } from "./ResumeSelectModal";
import toast from "react-hot-toast";

interface ResumeUploaderProps {
  userId: string;
  onSelect: (resume: Resume | null) => void;
  selectedResume: Resume | null;
}

export function ResumeUploader({ userId, onSelect, selectedResume }: ResumeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const newResume = await uploadResume(userId, file, 'ACTIVE', 5);
      onSelect(newResume);
      toast.success("Resume uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {!selectedResume ? (
        <div className="relative group">
          {/* Main Drop Card */}
          <div 
            className={`
              relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#111827] border-2 border-dashed rounded-[32px] 
              flex flex-col items-center justify-center p-8 transition-all duration-500
              ${uploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 group-hover:border-blue-500/30 group-hover:bg-white/[0.02]'}
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 size={48} className="text-blue-500 animate-spin relative" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Uploading Resume...</p>
                  <p className="text-muted-text text-sm mt-1">Securing file on cloud servers</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                <div className="mb-6 p-5 bg-white/[0.03] rounded-3xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:border-blue-500/20 transition-all duration-500">
                  <UploadCloud size={36} className="text-blue-500" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Drop your resume here</h3>
                <p className="max-w-xs text-muted-text text-[13px] font-medium leading-relaxed mb-8">
                  Supported formats: <span className="text-white">PDF, DOCX (Max 5MB)</span>. <br/>
                  AI will extract text automatically.
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
                  >
                    Select Files
                  </button>
                  
                  <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 text-[11px] font-black text-muted-text uppercase tracking-widest hover:text-white transition-colors"
                  >
                    <Library size={14} />
                    Or choose from your library
                  </button>
                </div>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx"
            />
          </div>

          {/* Decorative Corner Icon */}
          <div className="absolute -top-3 -right-3 p-3 bg-[#1e293b] border border-white/10 rounded-2xl shadow-xl z-10 text-blue-400 group-hover:scale-110 transition-transform duration-500">
            <FileText size={20} />
          </div>
        </div>
      ) : (
        /* Selected State Card */
        <div className="w-full bg-[#111827] border border-white/5 rounded-[32px] p-8 animate-in zoom-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Preview-like Icon */}
            <div className="relative group/icon">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
              <div className="relative p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                <FileText size={48} className="text-blue-400" />
                <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full border-4 border-[#111827]">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Document Selected</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-1 line-clamp-1">{selectedResume.file_name}</h4>
              <p className="text-muted-text text-sm font-medium">
                Uploaded {new Date(selectedResume.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowModal(true)}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-muted-text hover:text-white transition-all group/change"
                title="Change Resume"
              >
                <RefreshCw size={20} className="group-hover/change:rotate-180 transition-transform duration-500" />
              </button>
              <button
                onClick={handleRemove}
                className="p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl text-red-500/70 hover:text-red-500 transition-all group/remove"
                title="Remove Resume"
              >
                <Trash2 size={20} className="group-hover/remove:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Modal */}
      <ResumeSelectModal
        userId={userId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedId={selectedResume?.id}
        onSelect={(resume) => {
          onSelect(resume);
          setShowModal(false);
          toast.success("Resume selected successfully");
        }}
      />
    </div>
  );
}
