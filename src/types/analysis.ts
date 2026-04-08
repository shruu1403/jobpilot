export interface Analysis {
  id: string;
  user_id: string;
  resume_id: string | null;
  resume_name: string;
  job_title: string;
  company: string | null;
  job_description: string;
  match_score: number;
  skill_gaps: string[];
  suggestions: string[];
  ats_issues: string[];
  reason: string;
  tags: string[];
  created_at: string;
}
