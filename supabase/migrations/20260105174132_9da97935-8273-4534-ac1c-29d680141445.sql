-- Adicionar ON DELETE CASCADE na foreign key de video_reel para instagram_accounts
ALTER TABLE public.video_reel 
DROP CONSTRAINT IF EXISTS video_reel_instagram_account_id_fkey;

ALTER TABLE public.video_reel
ADD CONSTRAINT video_reel_instagram_account_id_fkey 
FOREIGN KEY (instagram_account_id) 
REFERENCES public.instagram_accounts(id) 
ON DELETE CASCADE;

-- Adicionar ON DELETE CASCADE na foreign key de reels_daily_stats para video_reel (se ainda não existir)
ALTER TABLE public.reels_daily_stats
DROP CONSTRAINT IF EXISTS reels_daily_stats_reel_id_fkey;

ALTER TABLE public.reels_daily_stats
ADD CONSTRAINT reels_daily_stats_reel_id_fkey
FOREIGN KEY (reel_id)
REFERENCES public.video_reel(id)
ON DELETE CASCADE;