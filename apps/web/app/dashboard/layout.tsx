import { DashboardAuthGuard } from "@/components/layout/dashboard-auth-guard";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-screen bg-secondary/30 lg:flex">
        <DashboardSidebar />
        <div className="min-w-0 flex-1">
          <DashboardTopbar />
          <main className="px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
