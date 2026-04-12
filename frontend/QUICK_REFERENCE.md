# 🚀 Frontend Quick Reference

## File Structure at a Glance

```
frontend/
├── app/                           # Pages & routes
│   ├── layout.tsx                # Root with providers
│   ├── page.tsx                  # Home
│   ├── login/page.tsx            # Login
│   ├── cart/page.tsx             # Cart
│   ├── checkout/page.tsx         # Checkout
│   ├── orders/
│   │   ├── page.tsx              # Order list
│   │   └── [id]/page.tsx         # Order detail
│   ├── products/
│   │   └── [id]/page.tsx         # Product detail
│   └── globals.css               # Global styles
│
├── features/                      # Redux + RTK Query
│   ├── auth/
│   │   ├── authSlice.ts          # State
│   │   └── authApi.ts            # Endpoints
│   ├── products/
│   │   └── productApi.ts
│   ├── cart/
│   │   └── cartApi.ts
│   └── orders/
│       └── orderApi.ts
│
├── lib/                           # Config
│   ├── store.ts                  # Redux configuration
│   └── baseQuery.ts              # RTK Query setup
│
├── providers/                     # React context
│   ├── ReduxProvider.tsx
│   └── SocketProvider.tsx
│
├── hooks/                         # Custom hooks
│   └── useAuth.ts
│
├── types/                         # TS interfaces
│   └── index.ts
│
├── utils/                         # Helpers
│   └── formatters.ts
│
├── .env.example                   # Environment template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── next.config.js                 # Next.js config
├── tailwind.config.ts             # Tailwind config
├── README.md                      # Full documentation
└── SETUP_GUIDE.md                 # Setup guide
```

## 🎯 Common Code Patterns

### 1. Use Redux State

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

const MyComponent = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  return <div>{isAuthenticated && <p>{user?.email}</p>}</div>;
};
```

### 2. Dispatch Redux Actions

```typescript
import { useDispatch } from 'react-redux';
import { updateProfile } from '@/features/auth/authSlice';

const MyComponent = () => {
  const dispatch = useDispatch();

  const handleUpdate = () => {
    dispatch(updateProfile({ fullName: 'New Name' }));
  };

  return <button onClick={handleUpdate}>Update</button>;
};
```

### 3. Query Data from API

```typescript
import { useGetProductsQuery } from '@/features/products/productApi';

const MyComponent = () => {
  const { data, isLoading, error } = useGetProductsQuery({ limit: 10 });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const products = data?.metadata?.data || [];
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
};
```

### 4. Mutate Data

```typescript
import { useUpdateProductMutation } from '@/features/products/productApi';

const MyComponent = () => {
  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const handleUpdate = async () => {
    try {
      const result = await updateProduct({
        id: '123',
        data: { name: 'New Name' }
      }).unwrap();

      console.log('Updated:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <button onClick={handleUpdate}>{isLoading ? 'Saving...' : 'Save'}</button>;
};
```

### 5. Protected Route

```typescript
'use client';

import { useProtectedRoute } from '@/hooks/useAuth';

export default function AdminPage() {
  useProtectedRoute('ADMIN'); // Only ADMIN users can access

  return <div>Admin Content</div>;
}
```

### 6. Real-Time Updates

```typescript
'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/SocketProvider';

export default function StockTracker() {
  const { onStockUpdate } = useSocket();

  useEffect(() => {
    onStockUpdate(({ productId, newStock }) => {
      console.log(`Product ${productId}: new stock = ${newStock}`);
      // Update UI or fetch fresh data
    });
  }, [onStockUpdate]);

  return <div>Stock Tracker</div>;
}
```

### 7. Authentication

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoginLoading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email: 'test@example.com', password: 'password123' });
      router.push('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-600">{error}</p>}
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button disabled={isLoginLoading}>
        {isLoginLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## 🛠️ CLI Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm start               # Run production build

# Code Quality
npm run lint            # Run ESLint
npm run type-check     # TypeScript check
npm run format          # Prettier format

# Testing
npm run test            # Run Jest
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
```

## 🔑 Environment Variables

```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3056/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3056

# Stripe Public Key (from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Set in production
NODE_ENV=production
```

## 📊 API Response Format

All API responses follow this format:

```typescript
{
  statusCode: 200,
  message: "success",
  metadata: {
    // Data here
  }
}
```

Access via:

```typescript
const { data } = useGetProductsQuery();
const products = data?.metadata?.data;
```

## 🔗 Redux Store Structure

```typescript
{
  auth: {
    token: string | null
    refreshToken: string | null
    user: AccountProfile | null
    isAuthenticated: boolean
    userType: 'USER' | 'SHOP' | 'ADMIN' | null
    isLoading: boolean
    error: string | null
  },
  authApi: { /* RTK Query cache */ },
  productApi: { /* RTK Query cache */ },
  cartApi: { /* RTK Query cache */ },
  orderApi: { /* RTK Query cache */ }
}
```

## ⚙️ Configuration Files

### `next.config.js`
```javascript
// Next.js configuration
// Images, experimental features, etc.
```

### `tailwind.config.ts`
```typescript
// Tailwind CSS theme
// Colors, spacing, fonts, etc.
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]  // Path aliases
    }
  }
}
```

## 🎨 Available Utilities

```typescript
import {
  formatCurrency,    // 100 -> "$100.00"
  formatDate,        // "2024-04-12" -> "April 12, 2024"
  formatTime,        // "14:30:00" -> "02:30 PM"
  getInitials,       // "John Doe" -> "JD"
  truncate,          // "Hello World", 5 -> "Hello..."
  isEmpty,           // {} -> true
  deepClone          // Deep copy object
} from '@/utils/formatters';
```

## 📱 Page Templates

### Query Page
```typescript
'use client';

import { useGetProductsQuery } from '@/features/products/productApi';

export default function Page() {
  const { data, isLoading, error } = useGetProductsQuery({ limit: 20 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return <div>{/* Render data */}</div>;
}
```

### Mutation Page
```typescript
'use client';

import { useUpdateProductMutation } from '@/features/products/productApi';

export default function Page() {
  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const handleSave = async () => {
    try {
      await updateProduct({ id: '1', data: { name: 'New' } }).unwrap();
      alert('Saved!');
    } catch (err) {
      alert('Error saving');
    }
  };

  return <button onClick={handleSave}>{isLoading ? 'Saving...' : 'Save'}</button>;
}
```

### Protected Page
```typescript
'use client';

import { useProtectedRoute } from '@/hooks/useAuth';

export default function Page() {
  useProtectedRoute('USER'); // Guard

  return <div>Protected content</div>;
}
```

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Module not found @/..." | Path alias broken | Check tsconfig.json baseUrl & paths |
| "401 Unauthorized" | Token expired/invalid | Check if token refresh is working |
| "CORS error" | Backend CORS not configured | Add credentials in baseQuery |
| "Socket.io not connecting" | Wrong URL or no auth | Check NEXT_PUBLIC_SOCKET_URL & token |
| "Stripe error" | Invalid public key | Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY |

## 📚 Key Technologies & Versions

```
Next.js: 14.2.0
React: 18.3.0
Redux Toolkit: 2.0.0
RTK Query: 2.0.0
Stripe: 20.x
Socket.io: 4.8.0
Tailwind CSS: 3.4.0
TypeScript: 5.4.0
```

## 💡 Best Practices

1. ✅ Always use `'use client'` for component hooks
2. ✅ Use `.unwrap()` on mutations for error handling
3. ✅ Memoize callbacks with `useCallback`
4. ✅ Don't put sensitive data in NEXT_PUBLIC_ variables
5. ✅ Use RTK Query, not useState for API data
6. ✅ Type everything with TypeScript
7. ✅ Use protected routes for sensitive pages
8. ✅ Clean up Socket listeners in useEffect

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Socket.io](https://socket.io/docs/client-api/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: April 12, 2026
