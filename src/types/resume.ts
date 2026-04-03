export type ResumeStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  created_at: string;
  status: ResumeStatus;
}
