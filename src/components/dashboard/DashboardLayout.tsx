import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SelectedAccountProvider } from "@/contexts/SelectedAccountContext";

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <SelectedAccountProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <main className="flex-1 bg-background">
            <Outlet />
          </main>
        </div>
      </SelectedAccountProvider>
    </ProtectedRoute>
  );
}
