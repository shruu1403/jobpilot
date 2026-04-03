"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Calendar, CheckCircle2, Loader2, UploadCloud, Plus } from "lucide-react";
import { Resume } from "@/types/resume";
import { getResumes } from "@/services/getResumes";
import { uploadResume } from "@/services/uploadResume";
import toast from "react-hot-toast";

interface ResumeSelectModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resume: Resume) => void;
  selectedId?: string;
}

export function ResumeSelectModal({
  userId,
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: ResumeSelectModalProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingNew, setUploadingNew] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchResumes();
    }
  }, [isOpen, userId]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await getResumes(userId);
      setResumes(data);
    } catch (error) {
      console.error("Failed to load resumes for modal");
    } finally {
      setLoading(false);
    }
  };

  const handleModalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingNew(true);
      const newResume = await uploadResume(userId, file, 'ACTIVE', 5);
      onSelect(newResume);
      toast.success("Resume uploaded and selected!");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploadingNew(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#111827] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Select Resume</h3>
            <p className="text-muted-text text-sm mt-1">Pick a document from your library or upload a new one</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-muted-text hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-muted-text font-medium">Scanning Library...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upload New Card */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingNew}
                className="group relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] hover:border-blue-500/30 hover:bg-white/[0.03] transition-all duration-300 min-h-[160px]"
              >
                {uploadingNew ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                ) : (
                  <>
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-3 group-hover:scale-110 transition-transform">
                      <Plus size={20} className="text-blue-400" />
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight text-center">Upload New File</span>
                    <span className="text-muted-text text-[10px] uppercase font-black tracking-widest mt-1">Limit: 5MB</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleModalUpload} 
                  className="hidden" 
                  accept=".pdf,.docx" 
                />
              </button>

              {resumes.map((resume) => {
                const isSelected = selectedId === resume.id;
                return (
                  <button
                    key={resume.id}
                    onClick={() => onSelect(resume)}
                    className={`
                      group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 text-left min-h-[160px]
                      ${isSelected 
                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] pointer-events-none' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 active:scale-[0.98]'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <FileText size={20} className="text-blue-400" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={20} className="text-blue-400" />
                      )}
                    </div>
                    
                    <h4 className="text-white font-bold text-[15px] group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {resume.file_name}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-muted-text text-xs font-medium">
                      <Calendar size={12} />
                      {new Date(resume.created_at).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
