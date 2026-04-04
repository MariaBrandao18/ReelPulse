import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { Instagram, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInstagramAccounts } from "@/hooks/useInstagramAccounts";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "idle" | "loading" | "success" | "error";

export default function Onboarding() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { hasAccounts, loading: accountsLoading, addAccount } = useInstagramAccounts();

  // Redirect if user already has accounts
  useEffect(() => {
    if (!authLoading && !accountsLoading && hasAccounts) {
      navigate("/dashboard");
    }
  }, [hasAccounts, authLoading, accountsLoading, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleVerify = async () => {
    const cleanUsername = username.trim().replace(/^@/, "");

    if (!cleanUsername) {
      toast({
        title: "Username obrigatório",
        description: "Por favor, insira o @ do Instagram.",
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");

    // Verifica se a conta existe no Instagram via Edge Function
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
      "verify-instagram-account",
      { body: { username: cleanUsername } },
    );

    if (verifyError) {
      console.error("Verification function error:", verifyError);
      // Falha na chamada à função — permite continuar com aviso
    } else if (verifyData && verifyData.exists === false) {
      setStatus("error");
      toast({
        title: "Conta não encontrada",
        description: `O perfil @${cleanUsername} não foi encontrado no Instagram. Verifique o username e tente novamente.`,
        variant: "destructive",
      });
      return;
    }

    // Salva a conta no banco de dados
    const { error } = await addAccount(cleanUsername);

    if (error) {
      setStatus("error");
      toast({
        title: "Erro ao adicionar conta",
        description: error.message.includes("duplicate")
          ? "Esta conta já está vinculada"
          : error.message,
        variant: "destructive",
      });
      return;
    }

    setStatus("success");

    // Exibe aviso se a verificação automática estava indisponível
    if (verifyData?.note) {
      toast({
        title: "Conta adicionada",
        description: verifyData.note,
      });
    } else {
      toast({
        title: "Conta verificada!",
        description: `@${cleanUsername} foi adicionada com sucesso.`,
      });
    }

    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  if (authLoading || accountsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-sky/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-sunshine/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tangerine/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Vamos registrar o seu primeiro cliente!
          </h1>
          <p className="text-muted-foreground">
            Adicione a conta do Instagram que você gerencia
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-semibold">Conta do Instagram</div>
              <div className="text-sm text-muted-foreground">
                Insira o @ do perfil
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                @
              </span>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace("@", ""))}
                className="pl-9 h-14 text-lg"
                disabled={status === "loading" || status === "success"}
              />
            </div>

            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Conta verificada com sucesso!
                </span>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-coral/10 text-coral"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Erro ao adicionar conta. Tente novamente.
                </span>
              </motion.div>
            )}

            <Button
              onClick={handleVerify}
              variant="cta"
              size="lg"
              className="w-full"
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verificando...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Verificado!
                </>
              ) : (
                "Verificar e Adicionar"
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Você poderá adicionar mais contas depois no painel de configurações.
        </p>
      </motion.div>
    </div>
  );
}
