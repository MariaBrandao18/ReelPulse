-- Add thumbnail_cached_url column to video_reel table
ALTER TABLE public.video_reel
ADD COLUMN thumbnail_cached_url text;