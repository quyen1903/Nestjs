'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useAuth';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useApplyDiscountMutation,
} from '@/features/cart/cartApi';

export default function CartPage() {
  const router = useRouter();
  useProtectedRoute('USER');

  const { data: cartData, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveFromCartMutation();
  const [applyDiscount] = useApplyDiscountMutation();
  const [discountCode, setDiscountCode] = useState('');

  if (isLoading) return <div>Loading...</div>;

  const cart = cartData?.metadata;
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        <p>Your cart is empty</p>
        <Link href="/" className="text-indigo-600 hover:underline">
          Continue Shopping
        </Link>
      </main>
    );
  }

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await updateItem({ cartItemId, quantity }).unwrap();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeItem(cartItemId).unwrap();
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      await applyDiscount({ discountCode }).unwrap();
      setDiscountCode('');
    } catch (err: any) {
      console.error('Discount failed:', err?.data?.message || err);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="border p-4 rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product?.name || 'Product'}</h3>
                  <p className="text-gray-600">${item.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.id, item.quantity - 1)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(
                        item.id,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-12 text-center border rounded"
                  />
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.id, item.quantity + 1)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                </div>

                <div className="w-24 text-right">
                  <p className="font-semibold">${item.price * item.quantity}</p>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="ml-4 text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1">
          <div className="border p-4 rounded-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Discount Code
              </label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter code"
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <button
                onClick={handleApplyDiscount}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Apply
              </button>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cart.totalPrice}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${cart.totalPrice}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
