import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const [checkingAccounts, setCheckingAccounts] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAccounts = async () => {
      if (!user) {
        setCheckingAccounts(false);
        return;
      }

      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (error) {
        console.error("Error checking accounts:", error);
        setHasAccounts(false);
      } else {
        setHasAccounts((data?.length || 0) > 0);
      }
      setCheckingAccounts(false);
    };

    if (user) {
      checkAccounts();
    } else if (!authLoading) {
      setCheckingAccounts(false);
    }
  }, [user, authLoading]);

  if (authLoading || checkingAccounts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has no accounts and is trying to access dashboard, redirect to onboarding
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  if (isDashboardRoute && hasAccounts === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
