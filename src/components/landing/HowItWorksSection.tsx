import { motion } from "framer-motion";
import { UserPlus, Instagram, BarChart3, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastre-se gratuitamente em menos de 1 minuto.",
    color: "bg-sky",
  },
  {
    icon: Instagram,
    title: "Adicione contas",
    description: "Vincule as contas do Instagram que você gerencia.",
    color: "bg-sunshine",
  },
  {
    icon: BarChart3,
    title: "Adicione Reels",
    description: "Cole a URL dos Reels que deseja acompanhar.",
    color: "bg-tangerine",
  },
  {
    icon: Rocket,
    title: "Analise e escale",
    description: "Acompanhe métricas e tome decisões baseadas em dados.",
    color: "bg-coral",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-foreground text-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como funciona?
          </h2>
          <p className="text-background/70">
            Simples e direto ao ponto. Comece a analisar seus Reels em minutos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-background/20" />
              )}

              <div
                className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 relative z-10`}
              >
                <step.icon className="w-8 h-8 text-foreground" />
              </div>

              <div className="text-sm font-medium text-background/50 mb-2">
                Passo {index + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-background/70">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
