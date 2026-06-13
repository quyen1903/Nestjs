"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { reviewCheckout, submitCheckout, type CheckoutInput } from "@/api/checkout.client";
import { queryKeys } from "@/api/query-keys";
import type { AuthSession } from "@/types/domain";

export function useCheckoutReview() {
  return useQuery({
    queryKey: queryKeys.checkoutReview,
    queryFn: reviewCheckout
  });
}

export function useSubmitCheckout(session: AuthSession | null) {
  return useMutation({
    mutationFn: (input: CheckoutInput) => submitCheckout(input, session)
  });
}
