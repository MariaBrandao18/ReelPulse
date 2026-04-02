import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface InstagramAccount {
  id: string;
  username: string;
  verified_at: string | null;
  created_at: string;
}

export function useInstagramAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(false);

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setHasAccounts(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("instagram_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching instagram accounts:", error);
      setAccounts([]);
      setHasAccounts(false);
    } else {
      setAccounts(data || []);
      setHasAccounts((data?.length || 0) > 0);
    }
    setLoading(false);
  };

  const addAccount = async (username: string) => {
    if (!user) return { error: new Error("User not authenticated") };

    const { data, error } = await supabase
      .from("instagram_accounts")
      .insert({
        user_id: user.id,
        username: username.replace("@", ""),
      })
      .select()
      .single();

    if (!error) {
      await fetchAccounts();
    }

    return { data, error };
  };

  const removeAccount = async (accountId: string) => {
    const { error } = await supabase
      .from("instagram_accounts")
      .delete()
      .eq("id", accountId);

    if (!error) {
      await fetchAccounts();
    }

    return { error };
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    loading,
    hasAccounts,
    addAccount,
    removeAccount,
    refetch: fetchAccounts,
  };
}
