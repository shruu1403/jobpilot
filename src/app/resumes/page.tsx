'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Resume } from '@/types/resume';
import { getResumes } from '@/services/getResumes';
import { uploadResume } from '@/services/uploadResume';
import { deleteResume } from '@/services/deleteResume';
import { ResumeCard } from '@/components/resumes/ResumeCard';
import { AddResumeCard } from '@/components/resumes/AddResumeCard';
import { Upload, Plus, FileText, Loader2 } from 'lucide-react';
import { ResumeStatus } from '@/types/resume';
import toast from 'react-hot-toast';

export default function ResumeLibrary() {
  const { user, loading: authLoading } = useUser();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const searchTerm = searchParams.get('search')?.toLowerCase() || '';
  const filteredResumes = resumes.filter(resume =>
    resume.file_name.toLowerCase().includes(searchTerm) ||
    (resume.status && resume.status.toLowerCase().includes(searchTerm))
  );

  const MAX_RESUMES = 10;

  useEffect(() => {
    if (user) {
      fetchResumes();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchResumes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getResumes(user.id);
      setResumes(data);
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const showLoginToast = () => {
    toast('Sign in to save resumes to your library', {
      icon: '🔒',
      duration: 6000,
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(59,130,246,0.3)',
      },
    });
  };

  const handleUpload = async (file: File) => {
    if (!user) {
      showLoginToast();
      return;
    }

    if (resumes.length >= MAX_RESUMES) {
      toast.error(`You have reached the limit of ${MAX_RESUMES} resumes.`);
      return;
    }

    try {
      setUploading(true);
      const newResume = await uploadResume(user.id, file);
      setResumes([newResume, ...resumes]);
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading resume');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = (id: string, newStatus: ResumeStatus) => {
    setResumes(resumes.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDelete = async (resumeId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    // Optimistic update
    const previousResumes = [...resumes];
    setResumes(resumes.filter(r => r.id !== resumeId));

    try {
      await deleteResume(resumeId, filePath);
      toast.success('Resume deleted');
    } catch (error) {
      setResumes(previousResumes);
      toast.error('Failed to delete resume');
    }
  };

  if (authLoading || (loading && resumes.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-muted-text animate-pulse font-medium">Scanning Resume Library...</p>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 -mt-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em]">
              Management Suite
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Resume Library</h1>
            <p className="text-muted-text max-w-[500px] leading-relaxed text-md">
              Manage your professional documents with JobPilot's AI-driven organization.
              Analyze, refine, and store multiple versions for targeted applications.
            </p>
          </div>
        </div>

        {/* Global Upload Button */}
        {isAuthenticated ? (
          <label className={`
            relative flex items-center gap-3 px-8 py-3.5 rounded-2xl cursor-pointer
            bg-gradient-to-br from-blue-600 to-indigo-600
            text-white font-bold transition-all duration-300
            hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]
            ${uploading || resumes.length >= MAX_RESUMES ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-[0.98]'}
          `}>
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span>{uploading ? 'Uploading...' : 'Upload Resume'}</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              disabled={uploading || resumes.length >= MAX_RESUMES}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </label>
        ) : (
          <button
            onClick={showLoginToast}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98]"
          >
            <Upload size={20} />
            <span>Upload Resume</span>
          </button>
        )}
      </div>

      {/* Stats / Limit Indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${resumes.length >= 8 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
              }`}
            style={{ width: `${(resumes.length / MAX_RESUMES) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-muted-text whitespace-nowrap">
          <span className="text-white">{resumes.length}</span> / {MAX_RESUMES} slots used
        </span>
      </div>

      {/* Grid Section */}
      {filteredResumes.length === 0 && !loading ? (
        <div className="bg-[#1E293B]/30 rounded-2xl border-2 border-dashed border-white/5 p-20 text-center flex flex-col items-center justify-center">
          {searchTerm ? (
            <>
              <div className="w-17 h-17 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
                <Plus size={25} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No matches found</h2>
              <p className="text-muted-text max-w-sm">
                {`We couldn't find any resumes matching "${searchTerm}". Try a different term or clear the search.`}
              </p>
            </>
          ) : isAuthenticated ? (
            <>
              <h2 className="text-xl font-bold text-white mb-2">No resumes found</h2>
              <p className="text-muted-text mb-8 max-w-sm">
                Ready to level up your career? Upload your first resume to get AI-driven analysis started.
              </p>
              <AddResumeCard onFileSelect={handleUpload} />
            </>
          ) : (
            <>
              <div className="w-17 h-17 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
                <FileText size={25} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Your library is empty</h2>
              <p className="text-muted-text mb-6 max-w-sm">
                Sign in to upload, organize, and manage your resumes with AI-powered insights.
              </p>
              <button
                onClick={() => window.location.href = '/signup'}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
              >
                Sign up to get started
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={handleDelete}
              onStatusChange={handleStatusUpdate}
            />
          ))}

          {resumes.length < MAX_RESUMES && (
            <AddResumeCard onFileSelect={handleUpload} />
          )}

          {resumes.length >= MAX_RESUMES && (
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center opacity-70">
              <div className="p-3 bg-red-500/10 rounded-xl mb-4 border border-red-500/20">
                <Plus size={24} className="text-red-400 rotate-45" />
              </div>
              <h3 className="text-white font-semibold mb-1">Limit Reached</h3>
              <p className="text-muted-text text-sm">Delete an old resume to add a new one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
