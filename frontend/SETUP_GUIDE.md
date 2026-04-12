# Frontend Setup Guide

## 📋 What's Included

This Next.js frontend scaffold includes everything you need to build a modern e-commerce application:

### ✅ Core Setup
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management
- **RTK Query** for server state & caching
- **Socket.io** for real-time features
- **Stripe** integration for payments

### ✅ Features Implemented

#### Authentication
- JWT token management
- Auto token refresh (401 handling)
- Protected routes
- Login/Register pages
- Profile management

#### Product Management
- Product browsing with filters
- Search functionality
- Product detail page
- Add to cart
- Trending products

#### Shopping Cart
- View cart items
- Update quantities
- Remove items
- Apply discount codes
- Cart persistence

#### Checkout
- Address entry
- Payment method selection
- Stripe integration (credit card)
- COD (Cash on Delivery)
- Order confirmation

#### Order Management
- View order history
- Order status tracking
- Real-time updates via Socket.io
- Order details

### ✅ Architecture

```
frontend/
├── app/                    # Next.js pages
├── features/               # Redux slices & RTK Query
├── providers/              # React providers (Redux, Socket)
├── hooks/                  # Custom hooks (useAuth)
├── lib/                    # Configuration (store, baseQuery)
├── types/                  # TypeScript definitions
└── utils/                  # Helper functions
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3056/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3056

# Stripe Test Key (from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## 📝 Project Structure Details

### Pages (`app/`)

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Product listing |
| Login | `/login` | User login |
| Register | `/register` | User registration |
| Product Detail | `/products/[id]` | Single product page |
| Shopping Cart | `/cart` | View & manage cart |
| Checkout | `/checkout` | Order placement with payment |
| Orders | `/orders` | Order history |
| Order Detail | `/orders/[id]` | Single order details |

### Features (Redux + RTK Query)

#### `features/auth/`
- **authSlice.ts** - Auth state management
- **authApi.ts** - Authentication endpoints

#### `features/products/`
- **productApi.ts** - Product endpoints
- Search, filter, trending products

#### `features/cart/`
- **cartApi.ts** - Cart operations
- Add/remove items, apply discounts

#### `features/orders/`
- **orderApi.ts** - Order endpoints
- Checkout, payment, order tracking

### Hooks (`hooks/`)

```typescript
// Authentication
import { useAuth } from '@/hooks/useAuth';
const { login, logout, user, isAuthenticated } = useAuth();

// Protected routes
import { useProtectedRoute } from '@/hooks/useAuth';
export default function AdminPage() {
  useProtectedRoute('ADMIN'); // Guard route
}

// Real-time updates
import { useSocket } from '@/providers/SocketProvider';
const { onStockUpdate, onOrderUpdate } = useSocket();
```

### Types (`types/index.ts`)

All TypeScript interfaces for:
- API responses
- Authentication
- Products
- Cart & Orders
- Payments
- Real-time events

## 🔌 API Integration

### RTK Query Setup

All API calls are configured with:

✅ **Automatic Caching** - Results cached automatically  
✅ **Smart Invalidation** - Cache invalidated on mutations  
✅ **Token Refresh** - 401 error handled automatically  
✅ **Error Handling** - Consistent error format  

### Example: Fetching Products

```typescript
import { useGetProductsQuery } from '@/features/products/productApi';

export default function Home() {
  const { data, isLoading, error } = useGetProductsQuery({ 
    limit: 20,
    sort: 'NEWEST'
  });

  const products = data?.metadata?.data || [];

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading products</p>}
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

### Example: Adding to Cart

```typescript
import { useAddToCartMutation } from '@/features/cart/cartApi';

export default function ProductCard({ product }) {
  const [addCart, { isLoading }] = useAddToCartMutation();

  const handleAdd = async () => {
    await addCart({
      productId: product.id,
      quantity: 1
    }).unwrap(); // ← unwrap() to handle errors

    // Cache automatically updated
    alert('Added to cart!');
  };

  return <button onClick={handleAdd}>{isLoading ? 'Adding...' : 'Add'}</button>;
}
```

## 🎯 Common Tasks

### Add a New API Endpoint

1. Create slice in `features/module/api.ts`:

```typescript
export const exampleApi = createApi({
  reducerPath: 'exampleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Examples'],
  endpoints: (builder) => ({
    getExamples: builder.query({
      query: () => '/examples',
      providesTags: ['Examples'],
    }),
    createExample: builder.mutation({
      query: (data) => ({
        url: '/examples',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Examples'],
    }),
  }),
});

export const { useGetExamplesQuery, useCreateExampleMutation } = exampleApi;
```

2. Add to store (`lib/store.ts`):

```typescript
import { exampleApi } from '@/features/example/api';

export const store = configureStore({
  reducer: {
    [exampleApi.reducerPath]: exampleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(exampleApi.middleware),
});
```

3. Use in component:

```typescript
import { useGetExamplesQuery } from '@/features/example/api';

export default function Component() {
  const { data } = useGetExamplesQuery();
  return <div>{data?.metadata?.map(e => <p key={e.id}>{e.name}</p>)}</div>;
}
```

### Create a Protected Page

```typescript
'use client';

import { useProtectedRoute } from '@/hooks/useAuth';

export default function AdminPage() {
  useProtectedRoute('ADMIN'); // Only admins can access

  return <div>Admin Content</div>;
}
```

### Listen for Real-Time Updates

```typescript
'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useDispatch } from 'react-redux';

export default function ProductPage() {
  const { onStockUpdate } = useSocket();
  const dispatch = useDispatch();

  useEffect(() => {
    onStockUpdate((data) => {
      console.log(`Product ${data.productId} stock updated to ${data.newStock}`);
      // Update UI or cache
    });
  }, [onStockUpdate, dispatch]);

  return <div>Products with real-time updates</div>;
}
```

## 🛠️ Development Tips

### Debug Redux State

```typescript
// In browser console
store.getState() // View entire Redux state
```

### Disable RTK Query Cache

```typescript
const { data } = useGetProductsQuery(filters, {
  skip: false,
  refetchOnMountOrArgChange: true, // Always fetch fresh
});
```

### Log API Requests

```typescript
// Install Redux DevTools Extension
// https://github.com/reduxjs/redux-devtools-extension
import { composeWithDevTools } from 'redux-devtools-extension';
```

### Test Authentication Locally

```bash
# Terminal 1 - Backend
cd ../..
npm run start:dev

# Terminal 2 - Frontend  
npm run dev

# Login at http://localhost:3000/login
```

## 📦 Build for Production

```bash
npm run build  # Build Next.js app
npm start      # Start production server

# Or deploy to Vercel
npm i -g vercel
vercel
```

## 🔒 Security Checklist

- ✅ Use HTTPS in production
- ✅ Set cookie flags (HttpOnly, Secure, SameSite)
- ✅ Validate all inputs on backend
- ✅ Use environment variables for secrets
- ✅ Implement CSRF token in forms
- ✅ Rate limiting on sensitive endpoints
- ✅ XSS protection via React escaping

## 📚 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [Stripe Documentation](https://stripe.com/docs)
- [Socket.io Client](https://socket.io/docs/client-api/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ❓ Troubleshooting

### "Module not found" Error

```bash
# Restart dev server
npm run dev
```

### Token not persisting

Check that refresh token is being set in HttpOnly cookies by backend.

Backend must set response header:
```
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

### CORS errors

Ensure backend has CORS configured:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Socket.io not connecting

1. Check `NEXT_PUBLIC_SOCKET_URL` is correct
2. Ensure authentication token is valid
3. Check backend is running Socket.io server

## 🚀 Next Steps

1. ✅ Install dependencies
2. ✅ Setup environment variables
3. ✅ Start dev server
4. ✅ Test login flow
5. ✅ Test cart & checkout
6. ✅ Integrate Stripe test keys
7. ✅ Customize styling
8. ✅ Add more pages as needed
9. ✅ Deploy to production

Happy coding! 🎉
