import { useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, Heart, MessageCircle, Play, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReels } from "@/hooks/useReels";
import { useSelectedAccount } from "@/contexts/SelectedAccountContext";
import { ReelThumbnail } from "@/components/ReelThumbnail";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function Dashboard() {
  const { selectedAccount, loading: accountLoading } = useSelectedAccount();
  const { reels, isLoading } = useReels(selectedAccount?.id);

  // Aggregate stats from all reels
  const aggregatedStats = useMemo(() => {
    if (!reels || reels.length === 0) {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalReels: 0,
      };
    }

    return reels.reduce(
      (acc, reel) => {
        const stats = reel.latestStats;
        return {
          totalViews: acc.totalViews + (stats?.plays_count || 0),
          totalLikes: acc.totalLikes + (stats?.likes_count || 0),
          totalComments: acc.totalComments + (stats?.comments_count || 0),
          totalReels: acc.totalReels + 1,
        };
      },
      { totalViews: 0, totalLikes: 0, totalComments: 0, totalReels: 0 }
    );
  }, [reels]);

  // Chart data - top 5 reels by views
  const topReelsData = useMemo(() => {
    if (!reels || reels.length === 0) return [];

    // First, map reels with their original index (based on creation order)
    const reelsWithIndex = reels
      .map((reel, originalIndex) => ({ reel, originalIndex }))
      .filter(({ reel }) => reel.latestStats);

    // Sort by plays_count (visualizações) descending and take top 5
    return reelsWithIndex
      .sort((a, b) => (b.reel.latestStats?.plays_count || 0) - (a.reel.latestStats?.plays_count || 0))
      .slice(0, 5)
      .map(({ reel, originalIndex }) => ({
        name: `Reel ${originalIndex + 1}`,
        views: reel.latestStats?.plays_count || 0,
        likes: reel.latestStats?.likes_count || 0,
        comments: reel.latestStats?.comments_count || 0,
      }));
  }, [reels]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const stats = [
    {
      title: "Visualizações",
      value: isLoading ? "-" : formatNumber(aggregatedStats.totalViews),
      icon: Eye,
      color: "bg-sky/20 text-sky",
    },
    {
      title: "Curtidas",
      value: isLoading ? "-" : formatNumber(aggregatedStats.totalLikes),
      icon: Heart,
      color: "bg-sunshine/30 text-tangerine",
    },
    {
      title: "Comentários",
      value: isLoading ? "-" : formatNumber(aggregatedStats.totalComments),
      icon: MessageCircle,
      color: "bg-tangerine/20 text-tangerine",
    },
    {
      title: "Reels",
      value: isLoading ? "-" : aggregatedStats.totalReels.toString(),
      icon: Play,
      color: "bg-coral/20 text-coral",
    },
  ];

  const barColors = ["#8CE4FF", "#A5E8FF", "#BEF0FF", "#D6F5FF", "#E8FAFF"];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Visão Geral</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho de todos os seus Reels
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Reels Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky" />
                Top Reels por Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : topReelsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topReelsData} barCategoryGap="20%">
                      <XAxis 
                        dataKey="name" 
                        axisLine={{ stroke: '#1f2937', strokeWidth: 2 }}
                        tickLine={false}
                        tick={{ fill: '#374151', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={{ stroke: '#1f2937', strokeWidth: 2 }}
                        tickLine={false}
                        tick={{ fill: '#374151', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatNumber(value), 'Visualizações']}
                      />
                      <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                        {topReelsData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={barColors[index % barColors.length]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Adicione reels para visualizar o desempenho
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reels List */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Play className="w-5 h-5 text-coral" />
                Reels Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : reels.length > 0 ? (
                  reels.slice(0, 5).map((reel, index) => (
                    <motion.div
                      key={reel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {/* Thumbnail */}
                      <ReelThumbnail 
                        thumbnailUrl={reel.thumbnail_cached_url || reel.thumbnail_url}
                        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Reel {index + 1}
                        </p>
                        {reel.posted_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(reel.posted_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      {reel.latestStats && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-sky" />
                            <span>{formatNumber(reel.latestStats.plays_count)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-destructive" />
                            <span>{formatNumber(reel.latestStats.likes_count)}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum reel adicionado ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
