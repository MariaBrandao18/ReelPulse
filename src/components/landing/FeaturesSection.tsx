import { motion } from "framer-motion";
import { BarChart3, Users, Zap, TrendingUp, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Análise Detalhada",
    description:
      "Visualize métricas como views, likes e comentários em gráficos intuitivos.",
    color: "bg-sky/20 text-sky",
  },
  {
    icon: Users,
    title: "Multi-contas",
    description:
      "Gerencie várias contas do Instagram em um só lugar, ideal para agências.",
    color: "bg-sunshine/30 text-tangerine",
  },
  {
    icon: TrendingUp,
    title: "Histórico de Crescimento",
    description:
      "Acompanhe a evolução diária do engajamento de cada Reel postado.",
    color: "bg-tangerine/20 text-tangerine",
  },
  {
    icon: Zap,
    title: "Coleta Automática",
    description:
      "Nosso sistema coleta dados automaticamente, você só precisa adicionar a URL.",
    color: "bg-coral/20 text-coral",
  },
  {
    icon: Clock,
    title: "Atualizações Diárias",
    description:
      "Dados atualizados diariamente para você ter sempre a informação mais recente.",
    color: "bg-success/20 text-success",
  },
  {
    icon: Shield,
    title: "Seguro e Confiável",
    description:
      "Seus dados estão protegidos e nunca compartilhamos informações.",
    color: "bg-sky/20 text-sky",
  },
];

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-24 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">escalar seu conteúdo</span>
          </h2>
          <p className="text-muted-foreground">
            Ferramentas poderosas para social media managers que querem
            resultados reais.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-sky/30 hover:shadow-lg transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
