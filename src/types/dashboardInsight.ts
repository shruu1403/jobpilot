export interface DashboardInsight {
  id: string;
  user_id: string;
  readiness: number;
  summary: string;
  improvements: string[];
  source_analysis_id: string | null;
  source_resume_id: string | null;
  updated_at: string;
}
