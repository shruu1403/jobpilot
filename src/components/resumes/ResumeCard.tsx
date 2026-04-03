import { FileText, Eye, Sparkles, Trash2, ChevronDown } from "lucide-react";
import { Resume, ResumeStatus } from "@/types/resume";
import { useRouter } from "next/navigation";
import { getSignedUrl } from "@/services/viewResume";
import { updateResumeStatus } from "@/services/updateResumeStatus";
import { useState } from "react";
import toast from "react-hot-toast";

interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string, path: string) => Promise<void>;
  onStatusChange: (id: string, newStatus: ResumeStatus) => void;
}

export function ResumeCard({ resume, onDelete, onStatusChange }: ResumeCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleView = async () => {
    try {
      const url = await getSignedUrl(resume.file_path);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Error opening resume");
    }
  };

  const handleAnalyze = () => {
    router.push("/analyzer");
  };

  const handleStatusChange = async (newStatus: ResumeStatus) => {
    if (newStatus === resume.status) return;
    try {
      setIsUpdating(true);
      await updateResumeStatus(resume.id, newStatus);
      onStatusChange(resume.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
      setShowStatusMenu(false);
    }
  };

  const getStatusColor = (status: ResumeStatus) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "DRAFT": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ARCHIVED": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="group relative bg-[#1E293B] rounded-2xl p-6 border border-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:border-blue-500/20">
      {/* Top: Icon + Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
          <FileText size={22} className="text-blue-400" />
        </div>
        
        <div className="relative">
          <button 
            disabled={isUpdating}
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider transition-all hover:bg-white/5 ${getStatusColor(resume.status)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUpdating ? 'Updating...' : resume.status}
            <ChevronDown size={12} className={showStatusMenu ? 'rotate-180' : ''} />
          </button>

          {showStatusMenu && (
            <div className="absolute top-full right-0 mt-2 w-32 bg-[#1E293B] border border-white/5 rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in duration-200">
              {(['ACTIVE', 'DRAFT', 'ARCHIVED'] as ResumeStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                    resume.status === status 
                    ? 'bg-blue-500/10 text-blue-400' 
                    : 'text-muted-text hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Info */}
      <div className="mb-8">
        <h3 className="text-white font-semibold text-lg line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors">
          {resume.file_name}
        </h3>
        <p className="text-muted-text text-sm">
          Uploaded {formatDate(resume.created_at)}
        </p>
      </div>

      {/* Bottom: Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={handleView}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 group/btn"
        >
          <Eye size={18} className="text-muted-text group-hover/btn:text-white transition-colors" />
          <span className="text-[10px] font-bold text-muted-text group-hover/btn:text-white uppercase tracking-wider">View</span>
        </button>
        <button 
           onClick={handleAnalyze}
           className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 group/btn"
        >
          <Sparkles size={18} className="text-muted-text group-hover/btn:text-white transition-colors" />
          <span className="text-[10px] font-bold text-muted-text group-hover/btn:text-white uppercase tracking-wider">Analyze</span>
        </button>
        <button 
          onClick={() => onDelete(resume.id, resume.file_path)}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 group/btn"
        >
          <Trash2 size={18} className="text-muted-text group-hover/btn:text-red-400 transition-colors" />
          <span className="text-[10px] font-bold text-muted-text group-hover/btn:text-red-400 uppercase tracking-wider">Delete</span>
        </button>
      </div>
    </div>
  );
}
