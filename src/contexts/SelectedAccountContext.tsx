import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useInstagramAccounts, InstagramAccount } from "@/hooks/useInstagramAccounts";

interface SelectedAccountContextType {
  selectedAccount: InstagramAccount | null;
  setSelectedAccount: (account: InstagramAccount | null) => void;
  accounts: InstagramAccount[];
  loading: boolean;
}

const SelectedAccountContext = createContext<SelectedAccountContextType | undefined>(undefined);

export function SelectedAccountProvider({ children }: { children: ReactNode }) {
  const { accounts, loading } = useInstagramAccounts();
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  return (
    <SelectedAccountContext.Provider value={{ selectedAccount, setSelectedAccount, accounts, loading }}>
      {children}
    </SelectedAccountContext.Provider>
  );
}

export function useSelectedAccount() {
  const context = useContext(SelectedAccountContext);
  if (context === undefined) {
    throw new Error("useSelectedAccount must be used within a SelectedAccountProvider");
  }
  return context;
}
