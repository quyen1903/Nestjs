'use client';

import Link from 'next/link';
import { useProtectedRoute } from '@/hooks/useAuth';
import { useGetOrdersQuery } from '@/features/orders/orderApi';

export default function OrdersPage() {
  useProtectedRoute('USER');

  const { data: ordersData, isLoading } = useGetOrdersQuery({});

  if (isLoading) return <div>Loading...</div>;

  const orders = ordersData?.metadata?.data || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div>
          <p>You have no orders yet</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block border p-4 rounded-lg hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                  <p className="text-lg font-bold mt-2">${order.totalPrice}</p>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
