import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RevenuePoint } from "@/types/domain";

export function RevenueChartPlaceholder({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-72 items-end gap-3">
          {data.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-56 w-full items-end rounded-md bg-secondary">
                <div
                  className="w-full rounded-md bg-primary"
                  style={{ height: `${Math.max(8, (point.revenue / max) * 100)}%` }}
                  aria-label={`${point.label} ${formatCurrency(point.revenue)}`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium">{point.label}</p>
                <p className="text-xs text-muted-foreground">{point.orders}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
