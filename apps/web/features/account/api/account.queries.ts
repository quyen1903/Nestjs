"use client";

import { useQuery } from "@tanstack/react-query";

import { getAccountOrders } from "@/api/account.client";
import { queryKeys } from "@/api/query-keys";
import type { AuthSession } from "@/types/domain";

export function useAccountOrders(session: AuthSession | null) {
  return useQuery({
    queryKey: queryKeys.accountOrders(session?.actorId),
    queryFn: () => getAccountOrders(session),
    enabled: Boolean(session)
  });
}
