-- Create video_reel table
CREATE TABLE public.video_reel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  instagram_external_id TEXT UNIQUE,
  thumbnail_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reels_daily_stats table
CREATE TABLE public.reels_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES public.video_reel(id) ON DELETE CASCADE NOT NULL,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  plays_count INTEGER DEFAULT 0,
  captured_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(reel_id, captured_at)
);

-- Enable RLS on both tables
ALTER TABLE public.video_reel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_reel
CREATE POLICY "Users can view their own reels"
ON public.video_reel FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reels"
ON public.video_reel FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels"
ON public.video_reel FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels"
ON public.video_reel FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for reels_daily_stats (based on reel ownership)
CREATE POLICY "Users can view stats of their own reels"
ON public.reels_daily_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.video_reel
    WHERE video_reel.id = reels_daily_stats.reel_id
    AND video_reel.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert stats for their own reels"
ON public.reels_daily_stats FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.video_reel
    WHERE video_reel.id = reels_daily_stats.reel_id
    AND video_reel.user_id = auth.uid()
  )
);

-- Create index for better performance on daily stats queries
CREATE INDEX idx_reels_daily_stats_reel_id ON public.reels_daily_stats(reel_id);
CREATE INDEX idx_reels_daily_stats_captured_at ON public.reels_daily_stats(captured_at);
CREATE INDEX idx_video_reel_user_id ON public.video_reel(user_id);