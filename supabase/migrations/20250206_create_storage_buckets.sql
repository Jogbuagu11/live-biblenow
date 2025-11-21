-- Migration: Create storage buckets for profile photos and cover photos
-- This sets up Supabase Storage with proper RLS policies

--------------------------------------------------------------------------------
-- Storage Buckets
--------------------------------------------------------------------------------

-- Create profile-photos bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true, -- Public bucket so profile photos can be accessed
  5242880, -- 5MB file size limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Create cover-photos bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cover-photos',
  'cover-photos',
  true, -- Public bucket so cover photos can be accessed
  10485760, -- 10MB file size limit (cover photos can be larger)
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Storage Policies for profile-photos bucket
--------------------------------------------------------------------------------

-- Policy: Anyone can view profile photos (public bucket)
create policy "Profile photos are publicly accessible"
on storage.objects for select
using (bucket_id = 'profile-photos');

-- Policy: Users can upload their own profile photo
create policy "Users can upload their own profile photo"
on storage.objects for insert
with check (
  bucket_id = 'profile-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own profile photo
create policy "Users can update their own profile photo"
on storage.objects for update
using (
  bucket_id = 'profile-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own profile photo
create policy "Users can delete their own profile photo"
on storage.objects for delete
using (
  bucket_id = 'profile-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

--------------------------------------------------------------------------------
-- Storage Policies for cover-photos bucket
--------------------------------------------------------------------------------

-- Policy: Anyone can view cover photos (public bucket)
create policy "Cover photos are publicly accessible"
on storage.objects for select
using (bucket_id = 'cover-photos');

-- Policy: Users can upload their own cover photo
create policy "Users can upload their own cover photo"
on storage.objects for insert
with check (
  bucket_id = 'cover-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own cover photo
create policy "Users can update their own cover photo"
on storage.objects for update
using (
  bucket_id = 'cover-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own cover photo
create policy "Users can delete their own cover photo"
on storage.objects for delete
using (
  bucket_id = 'cover-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Function to get profile photo URL
create or replace function public.get_profile_photo_url(user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  photo_url text;
begin
  -- Get the most recent profile photo for the user
  select 
    case 
      when avatar_url is not null and avatar_url != '' then avatar_url
      else null
    end
  into photo_url
  from public.profiles
  where id = user_id;
  
  return photo_url;
end;
$$;

-- Function to update profile photo URL after upload
create or replace function public.update_profile_photo_url(
  user_id uuid,
  photo_path text
)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Construct the full URL
  -- Format: https://[project-ref].supabase.co/storage/v1/object/public/profile-photos/[user-id]/[filename]
  update public.profiles
  set avatar_url = photo_path,
      updated_at = now()
  where id = user_id;
  
  return true;
end;
$$;

-- Function to get cover photo URL
create or replace function public.get_cover_photo_url(user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  cover_url text;
begin
  -- Get cover photo URL from profiles (we'll add this column)
  select cover_photo_url
  into cover_url
  from public.profiles
  where id = user_id;
  
  return cover_url;
end;
$$;

-- Function to update cover photo URL after upload
create or replace function public.update_cover_photo_url(
  user_id uuid,
  photo_path text
)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.profiles
  set cover_photo_url = photo_path,
      updated_at = now()
  where id = user_id;
  
  return true;
end;
$$;

--------------------------------------------------------------------------------
-- Add cover_photo_url column to profiles table
--------------------------------------------------------------------------------

-- Add cover_photo_url column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'cover_photo_url'
  ) then
    alter table public.profiles 
    add column cover_photo_url text;
  end if;
end $$;

--------------------------------------------------------------------------------
-- Storage Upload Path Format
--------------------------------------------------------------------------------
-- Profile photos should be uploaded to: profile-photos/{user_id}/{filename}
-- Example: profile-photos/123e4567-e89b-12d3-a456-426614174000/avatar.jpg
--
-- Cover photos should be uploaded to: cover-photos/{user_id}/{filename}
-- Example: cover-photos/123e4567-e89b-12d3-a456-426614174000/cover.jpg
--
-- The policies above ensure users can only upload to their own folder
-- (folder name must match their user ID)

