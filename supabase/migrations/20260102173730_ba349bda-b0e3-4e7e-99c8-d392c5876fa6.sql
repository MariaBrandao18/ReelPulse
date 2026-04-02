-- Add instagram_account_id column to video_reel table
ALTER TABLE public.video_reel 
ADD COLUMN instagram_account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_video_reel_instagram_account ON public.video_reel(instagram_account_id);