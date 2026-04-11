export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Job {
  id: string;
  title: string;
  company: string;
  status: JobStatus;
  tags: string[];
  salary?: string;
  appliedDate: string;
  notes?: string;
  source: 'manual' | 'jd' | 'analyzer';
  interviewStatus?: string; // e.g. "Round 2: Technical"
  interviewTime?: string; // e.g. "Tomorrow at 2:00 PM"
  offerProgress?: number; // 0-100
  offerDeadline?: string;
}
