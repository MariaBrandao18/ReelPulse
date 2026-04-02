import { NavLink as RouterNavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, BarChart3, LogOut, Instagram, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AddAccountDialog } from "./AddAccountDialog";
import { useSelectedAccount } from "@/contexts/SelectedAccountContext";
import { useInstagramAccounts } from "@/hooks/useInstagramAccounts";
const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Análise",
    icon: BarChart3,
    path: "/dashboard/analise",
  },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { accounts, loading, selectedAccount, setSelectedAccount } = useSelectedAccount();
  const { removeAccount } = useInstagramAccounts();
  const { toast } = useToast();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteAccountUsername, setDeleteAccountUsername] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deleteAccountId) return;
    
    setIsDeleting(true);
    const { error } = await removeAccount(deleteAccountId);
    setIsDeleting(false);
    
    if (error) {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conta excluída",
        description: `A conta @${deleteAccountUsername} foi removida com sucesso.`,
      });
      // Se a conta excluída era a selecionada, selecionar outra
      if (selectedAccount?.id === deleteAccountId) {
        const remaining = accounts.filter(a => a.id !== deleteAccountId);
        if (remaining.length > 0) {
          setSelectedAccount(remaining[0]);
        }
      }
    }
    setDeleteAccountId(null);
    setDeleteAccountUsername("");
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    navigate("/");
  };

  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link to="/">
          <Logo variant="light" />
        </Link>
      </div>

      {/* Account Selector */}
      <div className="px-4 mb-6">
        {loading ? (
          <div className="flex items-center justify-center p-3">
            <Loader2 className="w-5 h-5 animate-spin text-sidebar-foreground/60" />
          </div>
        ) : accounts.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors cursor-pointer text-left">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm font-medium truncate">@{selectedAccount?.username}</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>@{selectedAccount?.username}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="text-xs text-sidebar-foreground/60">
                    Conta Instagram
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm font-medium truncate">@{account.username}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>@{account.username}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="text-xs text-muted-foreground">
                        Conta Instagram
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteAccountId(account.id);
                        setDeleteAccountUsername(account.username);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAddAccountOpen(true)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Adicionar conta</div>
                    <div className="text-xs text-muted-foreground">
                      Vincular nova conta
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="p-3 rounded-xl bg-sidebar-accent/50 text-center">
            <p className="text-xs text-sidebar-foreground/60">Nenhuma conta vinculada</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <RouterNavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </RouterNavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-sky flex items-center justify-center">
            <span className="text-foreground font-semibold">{userInitial}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{userName}</div>
            <div className="text-xs text-sidebar-foreground/60">Sair da conta</div>
          </div>
          <LogOut className="w-4 h-4 text-sidebar-foreground/60" />
        </div>
      </div>

      <AddAccountDialog open={addAccountOpen} onOpenChange={setAddAccountOpen} />

      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta do Instagram?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a conta <strong>@{deleteAccountUsername}</strong>? 
              Todos os reels e estatísticas associados a esta conta serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
