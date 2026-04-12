'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useProtectedRoute } from '@/hooks/useAuth';
import { useGetCartQuery } from '@/features/cart/cartApi';
import { useCreatePaymentIntentMutation, useConfirmOrderMutation } from '@/features/orders/orderApi';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

function CheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const { data: cartData } = useGetCartQuery();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [confirmOrder] = useConfirmOrderMutation();

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'COD'>('STRIPE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const cart = cartData?.metadata;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    if (paymentMethod === 'STRIPE' && (!stripe || !elements)) {
      setError('Stripe is not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      const checkoutData = {
        items: cart?.items?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })) || [],
        shippingAddress,
        paymentMethod,
      };

      if (paymentMethod === 'STRIPE') {
        // Create payment intent
        const intentResponse = await createPaymentIntent(checkoutData).unwrap();
        const paymentIntent = intentResponse.metadata;

        // Confirm payment with Stripe
        if (stripe) {
          const cardElement = elements?.getElement(CardElement);
          if (!cardElement) throw new Error('Card element not found');

          const { error: stripeError, paymentIntent: confirmedIntent } =
            await stripe.confirmCardPayment(paymentIntent.clientSecret, {
              payment_method: {
                card: cardElement,
                billing_details: {
                  address: {
                    line1: shippingAddress,
                  },
                },
              },
            });

          if (stripeError) {
            setError(stripeError.message || 'Payment failed');
            setIsProcessing(false);
            return;
          }

          // Confirm order with backend
          await confirmOrder({
            paymentIntentId: confirmedIntent?.id || '',
            checkoutData,
          }).unwrap();
        }
      } else {
        // COD - just create order
        await confirmOrder({
          paymentIntentId: '',
          checkoutData,
        }).unwrap();
      }

      router.push('/orders');
    } catch (err: any) {
      setError(err?.data?.message || 'Checkout failed');
      setIsProcessing(false);
    }
  };

  if (!cart) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Shipping Address
          </label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            placeholder="Enter your full shipping address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="STRIPE"
                checked={paymentMethod === 'STRIPE'}
                onChange={(e) => setPaymentMethod(e.target.value as 'STRIPE' | 'COD')}
              />
              <span className="ml-2">Credit Card (Stripe)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value as 'STRIPE' | 'COD')}
              />
              <span className="ml-2">Cash on Delivery</span>
            </label>
          </div>
        </div>

        {paymentMethod === 'STRIPE' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Card Details
            </label>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="border-t pt-4">
          <div className="text-lg font-bold">
            Total: ${cart.totalPrice}
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  useProtectedRoute('USER');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </main>
  );
}
