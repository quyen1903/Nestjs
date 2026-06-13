import { apiConfig } from "@/api/config";
import { apiRequest } from "@/api/http";
import { mockCart, mockProducts, setMockCart } from "@/api/mock-data";
import type { AuthSession, Cart, CartItem } from "@/types/domain";

export async function getCart(): Promise<Cart> {
  return simulate(repriceCart(mockCart));
}

export async function addCartItem(input: {
  productId: string;
  variantId?: string;
  quantity: number;
  session?: AuthSession | null;
}): Promise<Cart> {
  const product = mockProducts.find((item) => item.id === input.productId);
  if (!product) return simulate(repriceCart(mockCart));

  const variant = product.variants.find((item) => item.id === input.variantId) ?? product.variants[0];
  const nextItem: CartItem = {
    id: `${product.id}:${variant.id}`,
    productId: product.id,
    variantId: variant.id,
    shopId: product.shopId,
    name: product.name,
    variantName: variant.name,
    image: variant.image ?? product.images[0],
    unitPrice: variant.price,
    quantity: input.quantity,
    currency: product.currency
  };

  if (apiConfig.mode === "live" && input.session?.accessToken && input.session.role === "USER") {
    try {
      await apiRequest("/cart", {
        method: "POST",
        token: input.session.accessToken,
        body: {
          userId: input.session.actorId,
          product: {
            productId: product.id,
            shopId: product.shopId,
            quantity: input.quantity,
            name: product.name,
            price: variant.price
          }
        }
      });
    } catch {
      // TODO: surface backend cart errors once the route no longer needs userId in payload.
    }
  }

  const existing = mockCart.items.find((item) => item.id === nextItem.id);
  const items = existing
    ? mockCart.items.map((item) =>
        item.id === nextItem.id ? { ...item, quantity: item.quantity + input.quantity } : item
      )
    : [...mockCart.items, nextItem];

  setMockCart(repriceCart({ ...mockCart, items }));
  return simulate(mockCart);
}

export async function updateCartItemQuantity(id: string, quantity: number): Promise<Cart> {
  const items =
    quantity <= 0
      ? mockCart.items.filter((item) => item.id !== id)
      : mockCart.items.map((item) => (item.id === id ? { ...item, quantity } : item));
  setMockCart(repriceCart({ ...mockCart, items }));
  return simulate(mockCart);
}

export async function clearCart(): Promise<Cart> {
  setMockCart(repriceCart({ ...mockCart, items: [] }));
  return simulate(mockCart);
}

function repriceCart(cart: Cart): Cart {
  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = subtotal > 400 ? subtotal * 0.08 : 0;
  const shippingEstimate = subtotal > 150 || subtotal === 0 ? 0 : 12;
  const taxEstimate = subtotal * 0.0825;
  return {
    ...cart,
    totals: {
      subtotal,
      discount,
      taxEstimate,
      shippingEstimate,
      totalEstimate: subtotal - discount + taxEstimate + shippingEstimate,
      currency: "USD",
      estimateOnly: true
    }
  };
}

function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 140);
  });
}
