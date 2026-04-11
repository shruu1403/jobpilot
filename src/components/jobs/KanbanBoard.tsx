import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useJobStore } from '@/store/useJobStore';
import { JobStatus, Job } from '@/types/job';
import { KanbanColumn } from './KanbanColumn';
import { useState, useEffect } from 'react';

const COLUMNS: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

interface KanbanBoardProps {
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
}

export function KanbanBoard({ searchQuery = '', statusFilter = '', typeFilter = '' }: KanbanBoardProps) {
  const { jobs, moveJob } = useJobStore();
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues with react-beautiful-dnd / hello-pangea
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as JobStatus;
    moveJob(draggableId, newStatus);
  };

  // Filter columns physically if status filter is active
  const displayedColumns = statusFilter 
    ? COLUMNS.filter(status => status === statusFilter) 
    : COLUMNS;

  // Filter jobs by search query and type tags
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Convert Onsite to On-site for tags matching logic since the extractor pushes 'On-site'
    const matchTypeQuery = typeFilter === 'Onsite' ? 'On-site' : typeFilter;
    const matchesType = matchTypeQuery 
      ? job.tags.some(tag => tag.toLowerCase() === matchTypeQuery.toLowerCase())
      : true;

    return matchesSearch && matchesType;
  });

  if (!mounted) {
    return <div className="animate-pulse h-[600px] bg-gray-800/30 rounded-2xl" />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div 
        className={`h-full items-start w-full ${
          statusFilter 
            ? 'flex items-start max-w-[400px]' 
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6'
        }`}
      >
        {displayedColumns.map(status => {
          const columnJobs = filteredJobs.filter(job => job.status === status);
          return (
            <div 
              key={status} 
              className={`transition-all h-full ${statusFilter ? 'w-full' : 'w-full min-w-0'}`}
            >
              <KanbanColumn title={status} jobs={columnJobs} />
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
