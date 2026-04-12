# E-Commerce Frontend

A modern e-commerce frontend built with **Next.js 14**, **React 18**, **Redux Toolkit**, **RTK Query**, and **Stripe** integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```
NEXT_PUBLIC_API_URL=http://localhost:3056/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3056
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with Redux/Socket providers
│   ├── page.tsx             # Home page
│   ├── login/               # Login page
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout with Stripe
│   ├── orders/              # Order history
│   └── products/            # Product pages
├── features/                 # Redux slices & RTK Query
│   ├── auth/                # Authentication
│   ├── products/            # Product management
│   ├── cart/                # Shopping cart
│   └── orders/              # Orders
├── providers/               # React context providers
│   ├── ReduxProvider        # Redux store provider
│   └── SocketProvider       # WebSocket provider
├── hooks/                   # Custom React hooks
│   └── useAuth.ts          # Authentication hook
├── lib/                     # Utilities & configuration
│   ├── store.ts            # Redux store setup
│   └── baseQuery.ts        # RTK Query base configuration
├── types/                   # TypeScript interfaces
│   └── index.ts            # All type definitions
└── utils/                   # Helper functions
    └── formatters.ts       # Format utilities
```

## 🔑 Key Features

### Authentication

- JWT token management
- Automatic token refresh (401 handling)
- Protected routes
- User profile management

**Usage:**

```typescript
import { useAuth } from '@/hooks/useAuth';

export default function Component() {
  const { login, logout, isAuthenticated, user } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <button onClick={logout}>Logout {user?.email}</button>
      ) : (
        <button onClick={() => login({ email, password })}>Login</button>
      )}
    </>
  );
}
```

### Data Fetching with RTK Query

Automatic caching, synchronization, and error handling.

**Usage:**

```typescript
import { useGetProductsQuery, useAddToCartMutation } from '@/features';

export default function ProductCard() {
  // Queries - auto cache & refetch
  const { data: products, isLoading } = useGetProductsQuery({ limit: 20 });

  // Mutations - auto invalidate cache
  const [addCart, { isLoading: isAdding }] = useAddToCartMutation();

  const handleAddCart = async (productId: string) => {
    await addCart({ productId, quantity: 1 }).unwrap();
  };

  return <div>{/* ... */}</div>;
}
```

### Real-Time Updates with Socket.io

```typescript
import { useSocket } from '@/providers/SocketProvider';

export default function Component() {
  const { onStockUpdate, onOrderUpdate } = useSocket();

  useEffect(() => {
    onStockUpdate((data) => {
      console.log('Stock updated:', data); // { productId, newStock, timestamp }
    });

    onOrderUpdate((data) => {
      console.log('Order updated:', data); // { orderId, status, timestamp }
    });
  }, [onStockUpdate, onOrderUpdate]);

  return <div>{/* ... */}</div>;
}
```

### Payment Integration with Stripe

```typescript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_KEY');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async () => {
    const cardElement = elements?.getElement(CardElement);
    const { paymentIntent } = await stripe?.confirmCardPayment('client_secret', {
      payment_method: { card: cardElement },
    }) || {};
  };

  return <form>{/* ... */}</form>;
}

export default function Page() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

## 📋 Available Hooks

### `useAuth()`

Authentication hook with login/logout/profile management.

```typescript
const {
  isAuthenticated,
  user,
  userType, // 'USER' | 'SHOP' | 'ADMIN'
  token,
  login,
  logout,
  isLoginLoading,
} = useAuth();
```

### `useProtectedRoute(userType?)`

Guard for protected routes.

```typescript
export default function AdminPage() {
  useProtectedRoute('ADMIN'); // Redirects if not authenticated or wrong type
  return <div>Admin content</div>;
}
```

### `useSocket()`

Real-time WebSocket connection.

```typescript
const { socket, isConnected, onStockUpdate, onOrderUpdate } = useSocket();
```

## 🎯 API Endpoints

All endpoints are typed and auto-cached via RTK Query:

### Auth
- `POST /auth/login` - Login user
- `POST /auth/register` - Register new account
- `GET /auth/profile` - Get user profile
- `PATCH /auth/profile` - Update profile
- `POST /auth/logout` - Logout

### Products
- `GET /products?search=...&category=...&page=...` - Get products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (shops)
- `PATCH /products/:id` - Update product
- `POST /products/:id/publish` - Publish product

### Cart
- `GET /cart` - Get cart
- `POST /cart/add` - Add to cart
- `PATCH /cart/item/:id` - Update quantity
- `DELETE /cart/item/:id` - Remove item
- `POST /cart/discount` - Apply discount code

### Orders
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get single order
- `POST /checkout/payment-intent` - Create Stripe intent
- `POST /checkout/confirm` - Confirm order
- `POST /orders/:id/cancel` - Cancel order

## 🧪 Testing

```bash
npm run test              # Run tests
npm run test:watch       # Watch mode
npm run test:cov        # Coverage report
```

## 📝 TypeScript Types

All types are defined in `types/index.ts`:

```typescript
import type {
  Product,
  Cart,
  Order,
  AuthResponse,
  CheckoutRequest,
  ApiResponse,
  StockUpdateEvent,
  OrderStatusUpdateEvent,
} from '@/types';
```

## 🔐 Security Best Practices

1. **Store tokens in memory** - Access token in state (not localStorage)
2. **Refresh tokens in HttpOnly cookies** - Backend must set `Set-Cookie` header
3. **Automatic refresh handling** - RTK Query middleware handles 401
4. **HTTPS in production** - Always use HTTPS
5. **CORS configuration** - Whitelist frontend origin on backend

## 📱 Performance Optimizations

- ✅ Code splitting via dynamic imports
- ✅ Image optimization (Next.js Image component)
- ✅ RTK Query caching & deduplication
- ✅ Request batching
- ✅ Lazy loading components
- ✅ Production builds with SWC

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables (Production)

```
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.example.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
```

## 🔍 Debugging

Enable detailed logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('debug', 'rtk-query:*,socket.io-client:*');
}
```

## 📞 Support

For issues or questions:
1. Check [Next.js docs](https://nextjs.org/docs)
2. Check [RTK Query docs](https://redux-toolkit.js.org/rtk-query/overview)
3. Check [Stripe docs](https://stripe.com/docs)

## 📄 License

MIT
