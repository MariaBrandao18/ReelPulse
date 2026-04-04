import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Reel {
  id: string;
  video_url: string;
  instagram_external_id: string | null;
  instagram_account_id: string | null;
  thumbnail_url: string | null;
  thumbnail_cached_url: string | null;
  posted_at: string | null;
  created_at: string | null;
}

export interface ReelStats {
  id: string;
  reel_id: string;
  views_count: number | null;
  likes_count: number | null;
  comments_count: number | null;
  plays_count: number | null;
  captured_at: string | null;
}

export interface ReelWithStats extends Reel {
  stats: ReelStats[];
  latestStats: ReelStats | null;
}

interface UseReelsOptions {
  accountId?: string | null;
  page?: number;        // página base-1; undefined = sem paginação (busca tudo)
  pageSize?: number;    // número de itens por página; padrão 20
}

interface UseReelsResult {
  reels: ReelWithStats[];
  total: number;        // total de reels (ignorando paginação)
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useReels(accountIdOrOptions?: string | null | UseReelsOptions): UseReelsResult {
  const { user } = useAuth();

  // Suporta tanto a assinatura legada useReels(accountId) quanto a nova useReels({ accountId, page, pageSize })
  const options: UseReelsOptions =
    typeof accountIdOrOptions === "object" && accountIdOrOptions !== null && !Array.isArray(accountIdOrOptions)
      ? accountIdOrOptions
      : { accountId: accountIdOrOptions as string | null | undefined };

  const { accountId, page, pageSize = 20 } = options;
  const isPaginated = page !== undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reels', user?.id, accountId, page, pageSize],
    queryFn: async (): Promise<{ reels: ReelWithStats[]; total: number }> => {
      if (!user?.id) return { reels: [], total: 0 };

      // Conta total de reels para a paginação
      let countQuery = supabase
        .from('video_reel')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (accountId) countQuery = countQuery.eq('instagram_account_id', accountId);
      const { count } = await countQuery;
      const total = count ?? 0;

      // Busca reels com ou sem limite de página
      let query = supabase
        .from('video_reel')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accountId) query = query.eq('instagram_account_id', accountId);

      if (isPaginated) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data: reelsData, error: reelsError } = await query;

      if (reelsError) throw reelsError;
      if (!reelsData || reelsData.length === 0) return { reels: [], total };

      // Busca stats apenas para os reels carregados
      const reelIds = reelsData.map(r => r.id);
      const { data: statsData, error: statsError } = await supabase
        .from('reels_daily_stats')
        .select('*')
        .in('reel_id', reelIds)
        .order('captured_at', { ascending: false });

      if (statsError) throw statsError;

      const reelsWithStats: ReelWithStats[] = reelsData.map(reel => {
        const reelStats = (statsData || []).filter(s => s.reel_id === reel.id);
        return {
          ...reel,
          stats: reelStats,
          latestStats: reelStats.length > 0 ? reelStats[0] : null,
        };
      });

      return { reels: reelsWithStats, total };
    },
    enabled: !!user?.id,
  });

  return {
    reels: data?.reels || [],
    total: data?.total ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

export function useReelStats(reelId: string | null) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['reel-stats', reelId],
    queryFn: async (): Promise<ReelStats[]> => {
      if (!reelId) return [];

      const { data, error } = await supabase
        .from('reels_daily_stats')
        .select('*')
        .eq('reel_id', reelId)
        .order('captured_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!reelId,
  });

  return {
    stats: stats || [],
    isLoading,
    error,
  };
}
