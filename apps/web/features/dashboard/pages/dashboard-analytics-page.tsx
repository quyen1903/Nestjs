"use client";

import { RevenueChartPlaceholder } from "@/components/dashboard/revenue-chart-placeholder";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { useDashboardSummary, useRevenueSeries } from "@/features/dashboard/api/dashboard.queries";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardAnalyticsPage() {
  const { tenant } = useOrganization();
  const summary = useDashboardSummary(tenant);
  const revenue = useRevenueSeries(tenant);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Insights</p>
        <h1 className="text-3xl font-semibold tracking-normal">Analytics</h1>
      </div>
      {summary.isLoading ? <LoadingState label="Loading analytics" /> : null}
      {summary.isError ? <ErrorState onRetry={() => void summary.refetch()} /> : null}
      {summary.data ? <StatCards summary={summary.data} /> : null}
      {revenue.isLoading ? <LoadingState label="Loading revenue" /> : null}
      {revenue.isError ? <ErrorState onRetry={() => void revenue.refetch()} /> : null}
      {revenue.data ? <RevenueChartPlaceholder data={revenue.data} /> : null}
    </div>
  );
}
