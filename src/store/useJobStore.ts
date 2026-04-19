import { create } from 'zustand';
import { Job, JobStatus } from '../types/job';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "@/lib/toast";
import { logActivity } from '@/services/activityLogs';

interface JobStore {
  jobs: Job[];
  loading: boolean;
  fetchJobs: () => Promise<void>;
  addJob: (job: Job) => Promise<void>;
  updateJob: (id: string, updatedFields: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  moveJob: (jobId: string, newStatus: JobStatus) => Promise<void>;
}

// Helper to map DB row to frontend Job type
const mapDbToJob = (row: any): Job => ({
  id: row.id,
  title: row.title,
  company: row.company,
  status: row.status as JobStatus,
  tags: row.tags || [],
  salary: row.salary,
  appliedDate: row.applied_date,
  notes: row.notes,
  source: row.source,
  interviewStatus: row.interview_status,
  interviewTime: row.interview_time,
  offerProgress: row.offer_progress,
  offerDeadline: row.offer_deadline,
});

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  loading: false,

  fetchJobs: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        set({ jobs: data.map(mapDbToJob) });
      }
    } catch (err: any) {
      toast.error('Failed to load jobs: ' + err.message);
    } finally {
      set({ loading: false });
    }
  },

  addJob: async (job) => {
    // Optimistic insert
    set((state) => ({ jobs: [...state.jobs, job] }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const payload = {
        id: job.id, // Using the frontend generated ID temporarily, or let DB generate
        user_id: user.id,
        title: job.title,
        company: job.company,
        status: job.status,
        tags: job.tags,
        salary: job.salary,
        applied_date: job.appliedDate,
        notes: job.notes,
        source: job.source,
        interview_status: job.interviewStatus,
        interview_time: job.interviewTime,
        offer_progress: job.offerProgress,
        offer_deadline: job.offerDeadline,
      };

      const { error } = await supabase.from('jobs').insert(payload);
      if (error) {
        // Rollback
        set((state) => ({ jobs: state.jobs.filter(j => j.id !== job.id) }));
        throw error;
      }

      // Log activity
      await logActivity(
        user.id,
        'job',
        `Applied: ${job.title}`,
        `At ${job.company}`
      );
    } catch (err: any) {
      toast.error('Failed to save job: ' + err.message);
    }
  },

  updateJob: async (id, updatedFields) => {
    // Optimistic update
    set((state) => ({
      jobs: state.jobs.map(job => job.id === id ? { ...job, ...updatedFields } : job)
    }));

    try {
      // Map camelCase to snake_case for DB
      const payload: any = {};
      if (updatedFields.title !== undefined) payload.title = updatedFields.title;
      if (updatedFields.status !== undefined) payload.status = updatedFields.status;
      if (updatedFields.appliedDate !== undefined) payload.applied_date = updatedFields.appliedDate;
      if (updatedFields.offerProgress !== undefined) payload.offer_progress = updatedFields.offerProgress;
      // add more manual mapping if needed...

      const { error } = await supabase.from('jobs').update(payload).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
      get().fetchJobs(); // Rollback to DB state
    }
  },

  deleteJob: async (id) => {
    // Note the job to rollback if error
    const deletedJob = get().jobs.find(j => j.id === id);
    if (!deletedJob) return;

    // Optimistic delete
    set((state) => ({
      jobs: state.jobs.filter(job => job.id !== id)
    }));

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) {
        set((state) => ({ jobs: [...state.jobs, deletedJob] }));
        throw error;
      }
      toast.success('Job deleted');
    } catch (err: any) {
      toast.error('Failed to delete job: ' + err.message);
    }
  },

  moveJob: async (jobId, newStatus) => {
    const job = get().jobs.find(j => j.id === jobId);
    if (!job) return;
    const oldStatus = job.status;

    // Optimistic move
    set((state) => ({
      jobs: state.jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j)
    }));

    try {
      const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
      if (error) {
        // Rollback
        set((state) => ({
          jobs: state.jobs.map(j => j.id === jobId ? { ...j, status: oldStatus } : j)
        }));
        throw error;
      }
    } catch (err: any) {
      toast.error('Move failed: ' + err.message);
    }
  },
}));
