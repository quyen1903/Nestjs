import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { CartTotals } from "@/types/domain";

export function CheckoutSummary({ totals }: { totals: CartTotals }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimated Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Line label="Subtotal" value={totals.subtotal} currency={totals.currency} />
        <Line label="Discount" value={-totals.discount} currency={totals.currency} />
        <Line label="Shipping estimate" value={totals.shippingEstimate} currency={totals.currency} />
        <Line label="Tax estimate" value={totals.taxEstimate} currency={totals.currency} />
        <Separator />
        <Line label="Estimated total" value={totals.totalEstimate} currency={totals.currency} strong />
        <div className="flex gap-2 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          Final price, discount, tax, shipping, inventory, and order placement are confirmed by the backend.
        </div>
      </CardContent>
    </Card>
  );
}

function Line({
  label,
  value,
  currency,
  strong = false
}: {
  label: string;
  value: number;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "text-lg font-semibold" : "font-medium"}>{formatCurrency(value, currency)}</span>
    </div>
  );
}
