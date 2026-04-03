import { Plus } from "lucide-react";
import { useRef } from "react";

interface AddResumeCardProps {
  onFileSelect: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function AddResumeCard({ onFileSelect, disabled }: AddResumeCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onFileSelect(file);
      // Reset input so the same file can be selected again if deleted
      e.target.value = '';
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        group relative h-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed 
        transition-all duration-300
        ${disabled 
          ? 'border-white/5 opacity-50 cursor-not-allowed' 
          : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-500/[0.02] cursor-pointer hover:scale-[1.02]'
        }
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx" 
        className="hidden" 
      />
      
      <div className={`
        p-4 rounded-full mb-4 transition-all duration-300
        ${disabled 
          ? 'bg-white/5 text-white/20' 
          : 'bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20'
        }
      `}>
        <Plus size={32} />
      </div>

      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
        Add New Resume
      </h3>
      <p className="text-muted-text text-sm text-center">
        PDF or DOCX up to 10MB
      </p>

      {!disabled && (
        <div className="absolute inset-0 rounded-2xl bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors" />
      )}
    </div>
  );
}
