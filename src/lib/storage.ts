import { supabase } from './supabase';

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  COVER_PHOTOS: 'cover-photos',
} as const;

/**
 * Upload a profile photo
 * @param userId - User ID
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Replace existing file
    });

  if (uploadError) {
    throw new Error(`Failed to upload profile photo: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
    .getPublicUrl(filePath);

  // Update profile with new photo URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  return data.publicUrl;
};

/**
 * Upload a cover photo
 * @param userId - User ID
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export const uploadCoverPhoto = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `cover.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.COVER_PHOTOS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Replace existing file
    });

  if (uploadError) {
    throw new Error(`Failed to upload cover photo: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.COVER_PHOTOS)
    .getPublicUrl(filePath);

  // Update profile with new cover photo URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ cover_photo_url: data.publicUrl })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  return data.publicUrl;
};

/**
 * Delete a profile photo
 * @param userId - User ID
 */
export const deleteProfilePhoto = async (userId: string): Promise<void> => {
  // List files in user's folder
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
    .list(userId);

  if (listError) {
    throw new Error(`Failed to list files: ${listError.message}`);
  }

  // Delete all files in the folder
  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${userId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete profile photo: ${deleteError.message}`);
    }
  }

  // Clear avatar_url in profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }
};

/**
 * Delete a cover photo
 * @param userId - User ID
 */
export const deleteCoverPhoto = async (userId: string): Promise<void> => {
  // List files in user's folder
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKETS.COVER_PHOTOS)
    .list(userId);

  if (listError) {
    throw new Error(`Failed to list files: ${listError.message}`);
  }

  // Delete all files in the folder
  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${userId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKETS.COVER_PHOTOS)
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete cover photo: ${deleteError.message}`);
    }
  }

  // Clear cover_photo_url in profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ cover_photo_url: null })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }
};

/**
 * Get public URL for a profile photo
 * @param userId - User ID
 * @param fileName - Optional filename (defaults to avatar.jpg)
 * @returns Public URL or null
 */
export const getProfilePhotoUrl = (userId: string, fileName: string = 'avatar.jpg'): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
    .getPublicUrl(`${userId}/${fileName}`);
  
  return data.publicUrl;
};

/**
 * Get public URL for a cover photo
 * @param userId - User ID
 * @param fileName - Optional filename (defaults to cover.jpg)
 * @returns Public URL or null
 */
export const getCoverPhotoUrl = (userId: string, fileName: string = 'cover.jpg'): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.COVER_PHOTOS)
    .getPublicUrl(`${userId}/${fileName}`);
  
  return data.publicUrl;
};

