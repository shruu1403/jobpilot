import { supabase } from '@/lib/supabaseClient';
import { Resume, ResumeStatus } from '@/types/resume';

export const uploadResume = async (
  userId: string, 
  file: File, 
  status: ResumeStatus = 'ACTIVE',
  maxMB: number = 5
): Promise<Resume> => {
  // 1. Validate file type (PDF/DOCX)
  const allowedTypes = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF and DOCX are allowed.');
  }

  // 2. Validate file size
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`File size exceeds ${maxMB} MB limit.`);
  }

  // 3. Check for 10-resume limit
  const { count, error: countError } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('Error checking resume count:', countError);
    throw new Error('Verification failed. Try again later.');
  }

  if (count !== null && count >= 10) {
    throw new Error('Limit reached. Delete an existing resume to enable new uploads.');
  }

  // 4. Proceed with upload
  const filePath = `${userId}/${Date.now()}_${file.name}`;

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading to storage:', uploadError);
    throw uploadError;
  }

  // 5. Insert into Metadata Table
  const { data, error: insertError } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      status: status
    })
    .select()
    .single();

  if (insertError) {
    // Cleanup storage if metadata insert fails
    await supabase.storage.from('resumes').remove([filePath]);
    console.error('Error saving metadata:', insertError);
    throw insertError;
  }

  return data;
};
