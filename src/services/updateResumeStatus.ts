import { supabase } from '@/lib/supabaseClient';
import { ResumeStatus } from '@/types/resume';

export const updateResumeStatus = async (resumeId: string, status: ResumeStatus) => {
  const { data, error } = await supabase
    .from('resumes')
    .update({ status })
    .eq('id', resumeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating status:', error);
    throw error;
  }

  return data;
};
