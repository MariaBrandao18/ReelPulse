import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Instagram, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useInstagramAccounts } from "@/hooks/useInstagramAccounts";

type VerificationStatus = "idle" | "loading" | "success" | "error";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const { toast } = useToast();
  const { addAccount, refetch } = useInstagramAccounts();

  const handleVerify = async () => {
    if (!username.trim()) {
      toast({
        title: "Username obrigatório",
        description: "Por favor, insira o @ do Instagram.",
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");

    setTimeout(async () => {
      const { error } = await addAccount(username);

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
      toast({
        title: "Conta verificada!",
        description: `@${username.replace("@", "")} foi adicionada com sucesso.`,
      });
      
      await refetch();
      
      setTimeout(() => {
        onOpenChange(false);
        setUsername("");
        setStatus("idle");
      }, 1500);
    }, 1500);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && status !== "loading") {
      setUsername("");
      setStatus("idle");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <span>Adicione a conta do Instagram</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              @
            </span>
            <Input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace("@", ""))}
              className="pl-9 h-12"
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
      </DialogContent>
    </Dialog>
  );
}
