import { mockOrders } from "@/api/mock-data";
import type { AuthSession, Order } from "@/types/domain";

export async function getAccountOrders(session: AuthSession | null): Promise<Order[]> {
  if (!session) return simulate([]);
  return simulate(mockOrders.slice(0, 3));
}

function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 160);
  });
}
