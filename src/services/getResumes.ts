import { supabase } from '@/lib/supabaseClient';
import { Resume } from '@/types/resume';

export const getResumes = async (userId: string): Promise<Resume[]> => {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }

  return data || [];
};
