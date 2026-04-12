'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetProductByIdQuery } from '@/features/products/productApi';
import { useAddToCartMutation } from '@/features/cart/cartApi';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatters';

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: productData, isLoading } = useGetProductByIdQuery(params.id);
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();

  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  if (isLoading) return <div>Loading...</div>;

  const product = productData?.metadata;

  if (!product) return <div>Product not found</div>;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        quantity,
      }).unwrap();

      setQuantity(1);
      setError('');
      // Show success message
      alert('Added to cart successfully!');
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <main className="container mx-auto p-4">
      <Link href="/" className="text-indigo-600 hover:underline mb-4 block">
        ← Back to Products
      </Link>

      <div className="grid grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {product.images.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`View ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-gray-200 hover:border-indigo-600"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-4">
            <span className="text-sm text-gray-600">{product.category}</span>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold text-yellow-500">
                ⭐ {product.rating || 0}
              </span>
              <span className="text-gray-600">({product.reviews || 0} reviews)</span>
            </div>
          </div>

          <div className="border-t border-b py-4 mb-4">
            <div className="text-4xl font-bold mb-2">
              {formatCurrency(product.price)}
            </div>
            <div className="text-lg">
              {product.stock > 0 ? (
                <span className="text-green-600 font-semibold">
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>
          </div>

          <p className="text-gray-700 mb-6">{product.description}</p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border rounded py-2"
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-semibold"
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>

          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p>✓ Free shipping on orders over $100</p>
            <p>✓ 30-day return guarantee</p>
            <p>✓ Secure checkout with Stripe</p>
          </div>
        </div>
      </div>
    </main>
  );
}
