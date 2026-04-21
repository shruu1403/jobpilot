import { Job } from '@/types/job';
import { Draggable } from '@hello-pangea/dnd';
import { Briefcase, MapPin, Calendar, Clock, DollarSign, Edit3, Trash2, GripVertical } from 'lucide-react';
import { useJobStore } from '@/store/useJobStore';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  index: number;
}

export function JobCard({ job, index }: JobCardProps) {
  const { deleteJob } = useJobStore();

  return (
    <>
      <Draggable draggableId={job.id} index={index}>
        {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#1E2538] rounded-xl p-4 mb-3 border border-gray-700/50 hover:border-accent-blue/50 transition-all group cursor-grab active:cursor-grabbing ${
            snapshot.isDragging ? 'shadow-lg shadow-accent-blue/10 scale-105 rotate-[2deg]' : ''
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          {/* Drag handle hint */}
          <div className="flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity -mt-1 mb-1">
            <GripVertical size={14} className="text-gray-500" />
          </div>

          {/* Header: Logo and Title/Company */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
              <span className="text-white font-bold text-sm">{job.company.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-[15px] truncate leading-tight group-hover:text-accent-blue transition-colors">{job.title}</h4>
              <p className="text-gray-400 text-xs truncate mt-0.5">{job.company}</p>
            </div>
            {/* Actions (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  
              <button 
                onClick={() => deleteJob(job.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700/50 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Optional Info: Interview Status / Offer */}
          {(job.interviewStatus || (job.status === 'Offer' && job.offerProgress !== undefined && job.offerProgress > 0)) && (
            <div className="mb-3">
              {job.interviewStatus && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                  <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-bold tracking-wider mb-1">
                    <Calendar size={12} />
                    {job.interviewStatus.toUpperCase()}
                  </div>
                  {job.interviewTime && (
                    <p className="text-gray-400 text-xs">{job.interviewTime}</p>
                  )}
                </div>
              )}

              {job.status === 'Offer' && job.offerProgress !== undefined && job.offerProgress > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-gray-400 text-xs">Offer Progress</span>
                    <span className="text-[#4ADE80] text-xs font-semibold">{job.offerProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#4ADE80] h-1.5 rounded-full" 
                      style={{ width: `${job.offerProgress}%` }}
                    />
                  </div>
                  {job.salary && (
                    <div className="mt-2 text-right">
                      <span className="text-[#4ADE80] text-xs font-bold">{job.salary}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer: Date and Tags */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
            <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">
              {job.status === 'Applied' ? `APPLIED ${job.appliedDate}` : job.appliedDate && `LAST UPDATE: ${job.appliedDate}`}
            </span>
            <div className="flex gap-1">
              {job.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Draggable>
    </>
  );
}
