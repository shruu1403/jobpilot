import { supabase } from '@/lib/supabaseClient';

export const getSignedUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(filePath, 3600); // 1 hour access

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }

  return data.signedUrl;
};
