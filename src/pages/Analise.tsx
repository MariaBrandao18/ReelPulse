import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lightbulb, Loader2, Eye, Heart, MessageCircle, Play, Trash2, ImageOff, X, ExternalLink, ChevronLeft, ChevronRight, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useReels, useReelStats, ReelWithStats, ReelStats } from "@/hooks/useReels";
import { useSelectedAccount } from "@/contexts/SelectedAccountContext";
import { supabase } from "@/integrations/supabase/client";
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

type ChartPeriod = "days" | "hours";
type ChartMetric = "views" | "likes" | "comments";

const chartMetrics: { key: ChartMetric; label: string; color: string; icon: typeof Eye }[] = [
  { key: "views", label: "Visualizações", color: "#8CE4FF", icon: Eye },
  { key: "likes", label: "Curtidas", color: "#FF5656", icon: Heart },
  { key: "comments", label: "Comentários", color: "#FFA239", icon: MessageCircle },
];

// Calcula crescimento percentual real comparando o último dia com o penúltimo.
// Retorna null quando não há dados suficientes (menos de 2 pontos).
const calculateGrowth = (
  stats: ReelStats[],
): { views: number | null; likes: number | null; comments: number | null; plays: number | null } => {
  if (stats.length < 2) {
    return { views: null, likes: null, comments: null, plays: null };
  }

  const safeTime = (d: string | null) => {
    if (!d) return 0;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const sorted = [...stats].sort((a, b) => safeTime(a.captured_at) - safeTime(b.captured_at));
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const calcPercent = (current: number | null, prev: number | null): number | null => {
    const c = current ?? 0;
    const p = prev ?? 0;
    if (p <= 0) return null;
    return Math.round(((c - p) / p) * 1000) / 10; // 1 casa decimal
  };

  return {
    views: calcPercent(latest.views_count, previous.views_count),
    likes: calcPercent(latest.likes_count, previous.likes_count),
    comments: calcPercent(latest.comments_count, previous.comments_count),
    plays: calcPercent(latest.plays_count, previous.plays_count),
  };
};

// Exibe crescimento positivo (verde), negativo (vermelho) ou sem dados (cinza)
const GrowthIndicator = ({ percentage }: { percentage: number | null }) => {
  if (percentage === null) {
    return (
      <div className="flex items-center gap-0.5 text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span className="text-xs">sem dados</span>
      </div>
    );
  }

  if (percentage > 0) {
    return (
      <div className="flex items-center gap-0.5 text-success">
        <TrendingUp className="w-3 h-3" />
        <span className="text-xs font-medium">+{percentage.toFixed(1)}%</span>
      </div>
    );
  }

  if (percentage < 0) {
    return (
      <div className="flex items-center gap-0.5 text-coral">
        <TrendingUp className="w-3 h-3 rotate-180" />
        <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 text-muted-foreground">
      <Minus className="w-3 h-3" />
      <span className="text-xs">0%</span>
    </div>
  );
};

const PAGE_SIZE = 20;

export default function Analise() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedReel, setSelectedReel] = useState<ReelWithStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reelToDelete, setReelToDelete] = useState<ReelWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("days");
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAccount, accounts } = useSelectedAccount();
  const { reels, total: totalReels, isLoading: isLoadingReels, refetch } = useReels({
    accountId: selectedAccount?.id,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalReels / PAGE_SIZE));
  const { stats: selectedReelStats } = useReelStats(selectedReel?.id || null);

  const handleDeleteReel = async () => {
    if (!reelToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('video_reel')
        .delete()
        .eq('id', reelToDelete.id);

      if (error) throw error;

      toast({
        title: "Reel excluído",
        description: "O reel foi removido com sucesso.",
      });

      if (selectedReel?.id === reelToDelete.id) {
        setSelectedReel(null);
      }
      
      refetch();
    } catch (error) {
      console.error("Error deleting reel:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o reel.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setReelToDelete(null);
    }
  };

  const handleAddReel = async () => {
    if (!url.includes("instagram.com")) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida do Instagram Reels.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      const { data, error } = await supabase.functions.invoke('add-reel-webhook', {
        body: {
          url,
          userId: user?.id,
          instagramAccountId: selectedAccount?.id,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Reel adicionado!",
        description: "A análise foi concluída com sucesso.",
      });
      
      setIsModalOpen(false);
      setUrl("");
      refetch();
    } catch (error) {
      console.error("Error adding reel:", error);
      toast({
        title: "Erro ao adicionar reel",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const chartData = selectedReelStats.map((stat, index) => ({
    name: (index + 1).toString(),
    views: stat.plays_count || 0,
    likes: stat.likes_count || 0,
    comments: stat.comments_count || 0,
  }));

  const scrollToChart = (index: number) => {
    setActiveChartIndex(index);
    if (chartsContainerRef.current) {
      const chartWidth = chartsContainerRef.current.offsetWidth;
      chartsContainerRef.current.scrollTo({
        left: chartWidth * index,
        behavior: 'smooth'
      });
    }
  };

  const handleChartScroll = () => {
    if (chartsContainerRef.current) {
      const scrollLeft = chartsContainerRef.current.scrollLeft;
      const chartWidth = chartsContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / chartWidth);
      if (newIndex !== activeChartIndex) {
        setActiveChartIndex(newIndex);
      }
    }
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Análise</h1>
          <p className="text-muted-foreground">
            Adicione e acompanhe o desempenho dos seus Reels
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Reel Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className="border-2 border-dashed border-border hover:border-sky cursor-pointer transition-all h-full min-h-[280px] flex items-center justify-center group"
              onClick={() => setIsModalOpen(true)}
            >
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-muted group-hover:bg-sky/20 flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-sky transition-colors" />
                </div>
                <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Adicionar Reel
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Loading State */}
          {isLoadingReels && (
            <Card className="min-h-[280px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </Card>
          )}

          {/* Reel Cards */}
          {reels.map((reel, index) => (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setSelectedReel(reel)}
              >
                {/* Thumbnail */}
                <ReelThumbnail 
                  thumbnailUrl={reel.thumbnail_cached_url || reel.thumbnail_url} 
                  className="aspect-[9/16] max-h-[180px] overflow-hidden rounded-t-lg"
                />

                <CardContent className="p-4">
                  {/* Stats Grid */}
                  {reel.latestStats ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-sky" />
                        <span className="text-sm font-medium">
                          {formatNumber(reel.latestStats.plays_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium">
                          {formatNumber(reel.latestStats.likes_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          {formatNumber(reel.latestStats.comments_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-accent-foreground" />
                        <span className="text-sm font-medium">
                          {formatNumber(reel.latestStats.views_count)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      Aguardando análise...
                    </p>
                  )}

                  {/* Posted date */}
                  {reel.posted_at && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Postado em {new Date(reel.posted_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReelToDelete(reel);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoadingReels}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
              <span className="ml-2 text-xs">({totalReels} reels no total)</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoadingReels}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Reel Detail Modal with Chart */}
        <AnimatePresence>
          {selectedReel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedReel(null)}
            >
              {/* Blurred background */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
              
              {/* Content */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 bg-card rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col lg:flex-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with dots and close button */}
                  <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
                    {/* Dots indicator */}
                    <div className="flex gap-2">
                      {chartMetrics.map((metric, index) => (
                        <button
                          key={metric.key}
                          onClick={() => scrollToChart(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            activeChartIndex === index 
                              ? "bg-foreground" 
                              : "bg-muted-foreground/30"
                          }`}
                          aria-label={`Ver ${metric.label}`}
                        />
                      ))}
                    </div>
                    {/* Close button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-card/80 backdrop-blur-sm hover:bg-card"
                      onClick={() => setSelectedReel(null)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                {/* Left side - Reel Preview */}
                <div className="lg:w-[400px] p-6 border-b lg:border-b-0 lg:border-r border-border">
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                    {/* Instagram-like header */}
                    <div className="flex items-center gap-3 p-3 border-b">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(accounts.find(a => a.id === selectedReel.instagram_account_id)?.username || selectedAccount?.username)?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {accounts.find(a => a.id === selectedReel.instagram_account_id)?.username || selectedAccount?.username || 'username'}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs bg-sky hover:bg-sky/90 text-white"
                        onClick={() => window.open(selectedReel.video_url, '_blank')}
                      >
                        Ver perfil
                      </Button>
                    </div>

                    {/* Thumbnail */}
                    <ReelThumbnail 
                      thumbnailUrl={selectedReel.thumbnail_cached_url || selectedReel.thumbnail_url}
                      className="aspect-[9/16] max-h-[400px]"
                    />

                    {/* Link to Instagram */}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        window.open(selectedReel.video_url, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center gap-2 p-3 text-sm text-sky hover:underline w-full text-left"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver mais no Instagram
                    </button>

                    {/* Engagement icons */}
                    <div className="flex items-center gap-4 px-3 py-2 border-t">
                      <Heart className="w-6 h-6 text-gray-700" />
                      <MessageCircle className="w-6 h-6 text-gray-700" />
                      <ExternalLink className="w-6 h-6 text-gray-700" />
                    </div>

                    {/* Stats */}
                    {selectedReel.latestStats && (
                      <div className="px-3 pb-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatNumber(selectedReel.latestStats.views_count)} visualizações
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Chart */}
                <div className="flex-1 p-6 pt-14 lg:pt-6 overflow-y-auto">
                  {/* Chart Navigation */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scrollToChart(Math.max(0, activeChartIndex - 1))}
                        disabled={activeChartIndex === 0}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <h2 className="text-2xl font-bold">
                        {chartMetrics[activeChartIndex]?.label || "Visualizações"}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scrollToChart(Math.min(chartMetrics.length - 1, activeChartIndex + 1))}
                        disabled={activeChartIndex === chartMetrics.length - 1}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Scrollable Charts Container */}
                  <div 
                    ref={chartsContainerRef}
                    onScroll={handleChartScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {chartMetrics.map((metric) => (
                      <div 
                        key={metric.key} 
                        className="min-w-full snap-center h-[350px]"
                      >
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barCategoryGap="20%">
                              <XAxis 
                                dataKey="name" 
                                axisLine={{ stroke: '#1f2937', strokeWidth: 2 }}
                                tickLine={false}
                                tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
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
                                labelFormatter={(label) => `Hora: ${label}`}
                                formatter={(value: number) => [formatNumber(value), metric.label]}
                              />
                              <Bar dataKey={metric.key} radius={[4, 4, 0, 0]} fill={metric.color}>
                                {chartData.map((_, index) => {
                                  const opacity = 0.4 + (index / Math.max(chartData.length - 1, 1)) * 0.6;
                                  return (
                                    <Cell 
                                      key={`cell-${metric.key}-${index}`} 
                                      fill={metric.color}
                                      fillOpacity={opacity}
                                    />
                                  );
                                })}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            Nenhum dado disponível ainda
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stats Summary with Growth Indicators */}
                  {selectedReel.latestStats && (
                    (() => {
                      const growth = calculateGrowth(selectedReelStats);

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
                          {/* Visualizações */}
                          <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Eye className="w-5 h-5 text-sky" />
                              <span className="text-2xl font-bold">
                                {formatNumber(selectedReel.latestStats.plays_count)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">Visualizações</p>
                            <div className="flex items-center justify-center">
                              <GrowthIndicator percentage={growth.views} />
                            </div>
                          </div>
                          
                          {/* Curtidas */}
                          <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Heart className="w-5 h-5 text-destructive" />
                              <span className="text-2xl font-bold">
                                {formatNumber(selectedReel.latestStats.likes_count)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">Curtidas</p>
                            <div className="flex items-center justify-center">
                              <GrowthIndicator percentage={growth.likes} />
                            </div>
                          </div>
                          
                          {/* Comentários */}
                          <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <MessageCircle className="w-5 h-5 text-primary" />
                              <span className="text-2xl font-bold">
                                {formatNumber(selectedReel.latestStats.comments_count)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">Comentários</p>
                            <div className="flex items-center justify-center">
                              <GrowthIndicator percentage={growth.comments} />
                            </div>
                          </div>
                          
                          {/* Reproduções */}
                          <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Play className="w-5 h-5 text-accent-foreground" />
                              <span className="text-2xl font-bold">
                                {formatNumber(selectedReel.latestStats.views_count)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">Reproduções</p>
                            <div className="flex items-center justify-center">
                              <GrowthIndicator percentage={growth.plays} />
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Reel Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="w-16 h-16 rounded-2xl bg-sky/20 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-sky" />
              </div>
              <DialogTitle className="text-center">Adicionar Novo Reel</DialogTitle>
              <DialogDescription className="text-center">
                Por ser um MVP, no momento estamos coletando o vídeo por URL. É
                recomendado que, ao postar o conteúdo, já insira a URL aqui.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <Input
                type="url"
                placeholder="https://instagram.com/reel/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12"
              />
              <Button
                onClick={handleAddReel}
                variant="cta"
                className="w-full"
                disabled={isAdding || !url}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analisando...
                  </>
                ) : (
                  "Adicionar Reel"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!reelToDelete} onOpenChange={(open) => !open && setReelToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Reel?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O reel e todas as estatísticas associadas serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReel}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
