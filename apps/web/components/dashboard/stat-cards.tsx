import { ArrowUpRight, BarChart3, Receipt, ShoppingBag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary } from "@/types/domain";

export function StatCards({ summary }: { summary: DashboardSummary }) {
  const stats = [
    {
      label: "Revenue",
      value: formatCurrency(summary.revenue, summary.currency),
      icon: BarChart3
    },
    {
      label: "Orders",
      value: String(summary.orders),
      icon: ShoppingBag
    },
    {
      label: "Conversion",
      value: `${summary.conversionRate.toFixed(1)}%`,
      icon: ArrowUpRight
    },
    {
      label: "Average order",
      value: formatCurrency(summary.averageOrderValue, summary.currency),
      icon: Receipt
    }
  ];

  return (
    <div className="dashboard-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal">{stat.value}</p>
              </div>
              <div className="grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
