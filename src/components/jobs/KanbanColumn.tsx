import { Droppable } from '@hello-pangea/dnd';
import { Job, JobStatus } from '@/types/job';
import { JobCard } from './JobCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: JobStatus;
  jobs: Job[];
  onAddClick?: (status: JobStatus) => void;
}

export function KanbanColumn({ title, jobs, onAddClick }: KanbanColumnProps) {
  // Map title to color classes
  const headerColors: Record<JobStatus, string> = {
    Applied: 'text-indigo-400',
    Interview: 'text-[#4ADE80]',
    Offer: 'text-yellow-400',
    Rejected: 'text-red-400'
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 w-full h-full"> {/* h-full important for dragging */}
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-xs font-bold tracking-widest uppercase ${headerColors[title]}`}>
            {title}
          </h3>
          <span className="bg-white/10 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center">
            {jobs.length}
          </span>
        </div>
        
        {onAddClick && (
          <button 
            onClick={() => onAddClick(title)}
            className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-2xl transition-colors duration-200 min-h-[150px] p-2 -mx-2 ${
              snapshot.isDraggingOver ? 'bg-white/5 border-dashed border-2 border-accent-blue/30' : 'border-2 border-transparent'
            }`}
          >
            {jobs.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p className="text-gray-500 text-[11px] font-medium">Drag jobs here</p>
              </div>
            )}
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
