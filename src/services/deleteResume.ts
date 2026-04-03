import { supabase } from '@/lib/supabaseClient';

export const deleteResume = async (resumeId: string, filePath: string) => {
  // 1. Delete from database
  const { error: deleteDataError } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId);

  if (deleteDataError) {
    console.error('Error deleting metadata:', deleteDataError);
    throw deleteDataError;
  }

  // 2. Delete from storage
  const { error: deleteFileError } = await supabase.storage
    .from('resumes')
    .remove([filePath]);

  if (deleteFileError) {
    console.error('Error deleting from storage:', deleteFileError);
    // Note: If metadata is deleted but file remains, user would see its gone but it takes space.
    // Usually, delete metadata first, then storage.
    throw deleteFileError;
  }

  return true;
};
