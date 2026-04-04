import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, TrendingUp, BarChart3, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-sunshine/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-tangerine/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky/20 text-sm font-medium text-foreground mb-6">
              <Zap className="w-4 h-4 text-tangerine" />
              Análise inteligente de Reels
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Transforme dados em{" "}
              <span className="text-gradient">estratégias vencedoras</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              O ReelPulse é a ferramenta definitiva para social media managers
              que querem entender o que realmente funciona nos Reels. Acompanhe
              métricas, identifique padrões e escale seu conteúdo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="cta" size="xl" asChild>
                <Link to="/cadastro">Começar Gratuitamente</Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/login">
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <span>+500 creators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-sky" />
                </div>
                <span>10k+ reels analisados</span>
              </div>
            </div>
          </motion.div>

          {/* Right content - Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main dashboard card */}
              <div className="glass rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Visão Geral</h3>
                  <span className="text-xs text-muted-foreground">Última semana</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 rounded-xl bg-sky/10">
                    <div className="text-2xl font-bold text-foreground">45.2K</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-sunshine/20">
                    <div className="text-2xl font-bold text-foreground">2.8K</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-tangerine/20">
                    <div className="text-2xl font-bold text-foreground">892</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                </div>

                {/* Chart mockup */}
                <div className="h-32 flex items-end gap-2">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                      className="flex-1 rounded-t-lg gradient-hero opacity-80"
                    />
                  ))}
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -bottom-4 -left-4 glass rounded-xl p-4 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">+23.5%</div>
                    <div className="text-xs text-muted-foreground">Crescimento</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -top-4 -right-4 glass rounded-xl p-4 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tangerine/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-tangerine" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">12 Reels</div>
                    <div className="text-xs text-muted-foreground">Este mês</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
