import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signIn } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      // Check if user has instagram accounts
      const checkAndRedirect = async () => {
        const { data } = await supabase
          .from("instagram_accounts")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (data && data.length > 0) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      };
      checkAndRedirect();
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "E-mail ou senha incorretos" 
          : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login realizado!",
      description: "Redirecionando...",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-foreground p-12 flex-col justify-between"
      >
        <Logo variant="light" />

        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bem-vindo de volta!
          </h1>
          <p className="text-white/70 text-lg">
            Continue acompanhando suas métricas e descobrindo insights valiosos
            sobre seus Reels.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky/20 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sunshine/20 flex items-center justify-center">
            <span className="text-2xl">🚀</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tangerine/20 flex items-center justify-center">
            <span className="text-2xl">💡</span>
          </div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Entrar na sua conta</h2>
            <p className="text-muted-foreground">
              Insira suas credenciais para acessar o dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-coral">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-coral">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            {import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={isLoading}
                onClick={() => {
                  setEmail(import.meta.env.VITE_DEMO_EMAIL);
                  setPassword(import.meta.env.VITE_DEMO_PASSWORD);
                }}
              >
                Entrar com demo
              </Button>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não possui uma conta?{" "}
              <Link
                to="/cadastro"
                className="font-semibold text-foreground hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
