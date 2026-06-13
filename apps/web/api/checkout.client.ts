import { apiConfig } from "@/api/config";
import { apiRequest } from "@/api/http";
import { mockCart } from "@/api/mock-data";
import type { AuthSession, CheckoutReview, Order } from "@/types/domain";

export type CheckoutInput = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  shippingMethod: "standard" | "express";
  paymentMethod: "placeholder";
};

export async function reviewCheckout(): Promise<CheckoutReview> {
  if (apiConfig.mode === "live") {
    // TODO: map the backend CheckoutDTO once checkout no longer requires client-supplied userId.
  }

  return simulate({
    cartId: mockCart.id,
    items: mockCart.items,
    totals: mockCart.totals,
    warnings: ["Final price, discount, tax, shipping, inventory, and order placement require backend confirmation."],
    paymentPlaceholder: true
  });
}

export async function submitCheckout(input: CheckoutInput, session: AuthSession | null): Promise<Order> {
  if (apiConfig.mode === "live" && session?.accessToken) {
    try {
      await apiRequest("/checkout/create_order", {
        method: "POST",
        token: session.accessToken,
        body: {
          cartId: mockCart.id,
          userId: session.actorId,
          shopOrderIds: buildShopOrderIds()
        }
      });
    } catch {
      // TODO: block mock order creation when live payment/order APIs are contract-stable.
    }
  }

  return simulate({
    id: `ORD-${Math.floor(1100 + Math.random() * 200)}`,
    shopId: mockCart.items[0]?.shopId ?? "shop-northstar",
    customerName: input.fullName,
    customerEmail: input.email,
    status: "PENDING_PAYMENT",
    itemCount: mockCart.items.reduce((sum, item) => sum + item.quantity, 0),
    total: mockCart.totals.totalEstimate,
    currency: mockCart.totals.currency,
    createdAt: new Date().toISOString(),
    fulfillment: "Unfulfilled"
  });
}

function buildShopOrderIds() {
  const groups = new Map<string, { shopId: string; shopDiscounts: never[]; itemProducts: unknown[] }>();
  mockCart.items.forEach((item) => {
    if (!groups.has(item.shopId)) {
      groups.set(item.shopId, { shopId: item.shopId, shopDiscounts: [], itemProducts: [] });
    }
    groups.get(item.shopId)?.itemProducts.push({
      price: item.unitPrice,
      quantity: item.quantity,
      productId: item.productId
    });
  });
  return Array.from(groups.values());
}

function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 220);
  });
}
