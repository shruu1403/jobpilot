import { supabase } from '@/lib/supabaseClient';

export type ActivityType = 'resume' | 'analysis' | 'job' | 'referral';

export interface ActivityLog {
  id?: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export const logActivity = async (
  userId: string,
  type: ActivityType,
  title: string,
  description: string,
  metadata?: Record<string, unknown> | null
) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        type,
        title,
        description,
        metadata,
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Error in logActivity:', err);
  }
};
