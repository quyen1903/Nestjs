# 📡 Backend API Reference Guide

## API Endpoint Quick Reference

### Base URL
```
http://localhost:3056/api
```

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "code": 201,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "accessToken": "eyJh...",
    "refreshToken": "eyJh...",
    "expiresIn": 900
  }
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "accessToken": "eyJh...",
    "refreshToken": "eyJh...",
    "expiresIn": 900
  }
}

Errors:
- 401: Invalid email or password
- 404: User not found
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

Request Body:
{
  "refreshToken": "eyJh..."
}

Response (200):
{
  "code": 200,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJh...",
    "expiresIn": 900
  }
}

Errors:
- 401: Invalid or expired refresh token
```

### Logout
```
POST /auth/logout
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Logged out successfully"
}
```

### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

Request Body:
{
  "email": "user@example.com"
}

Response (200):
{
  "code": 200,
  "message": "Password reset email sent"
}
```

### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

Request Body:
{
  "resetToken": "xyz123",
  "newPassword": "NewSecurePass123!"
}

Response (200):
{
  "code": 200,
  "message": "Password reset successfully"
}
```

---

## 🏪 Shop Authentication Endpoints

### Shop Register
```
POST /shop-auth/register
Content-Type: application/json

Request Body:
{
  "email": "shop@example.com",
  "password": "ShopPass123!",
  "shopName": "My Electronics Store",
  "description": "Selling electronics worldwide",
  "phone": "+1234567890"
}

Response (201):
{
  "code": 201,
  "message": "Shop registered successfully",
  "data": {
    "shopId": "uuid",
    "shopName": "My Electronics Store",
    "accessToken": "eyJh...",
    "refreshToken": "eyJh...",
    "expiresIn": 900
  }
}
```

### Shop Login
```
POST /shop-auth/login
Content-Type: application/json

Request Body:
{
  "email": "shop@example.com",
  "password": "ShopPass123!"
}

Response (200):
{
  "code": 200,
  "message": "Shop login successful",
  "data": {
    "shopId": "uuid",
    "shopName": "My Electronics Store",
    "role": "SHOP",
    "accessToken": "eyJh...",
    "expiresIn": 900
  }
}
```

---

## 👤 User Profile Endpoints

### Get User Profile
```
GET /users/profile
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Profile retrieved",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatar": "https://...",
    "createdAt": 1712000000000,
    "updatedAt": 1712000000000
  }
}
```

### Update User Profile
```
PUT /users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+0987654321",
  "avatar": "https://..."
}

Response (200):
{
  "code": 200,
  "message": "Profile updated successfully",
  "data": { /* updated profile */ }
}
```

### Get All User Addresses
```
GET /users/addresses
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Addresses retrieved",
  "data": [
    {
      "id": "uuid",
      "type": "SHIPPING",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "isDefault": true
    }
  ]
}
```

### Add Address
```
POST /users/addresses
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "type": "SHIPPING",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "isDefault": false
}

Response (201):
{
  "code": 201,
  "message": "Address added successfully",
  "data": { /* address object */ }
}
```

### Update Address
```
PUT /users/addresses/{addressId}
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "street": "456 Park Ave",
  "city": "Boston"
}

Response (200):
{
  "code": 200,
  "message": "Address updated successfully",
  "data": { /* updated address */ }
}
```

### Delete Address
```
DELETE /users/addresses/{addressId}
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Address deleted successfully"
}
```

---

## 📦 Product Endpoints

### Get All Products
```
GET /products?page=1&limit=20&sort=newest&category=electronics
Authorization: Bearer {accessToken} (optional)

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- sort: newest|popular|price_asc|price_desc|rating
- category: Filter by category
- minPrice: Minimum price
- maxPrice: Maximum price
- searchTerm: Search keyword
- shopId: Filter by shop

Response (200):
{
  "code": 200,
  "message": "Products retrieved",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "iPhone 15 Pro",
        "description": "Latest Apple flagship",
        "price": 999,
        "compareAtPrice": 1099,
        "rating": 4.8,
        "reviews": 1250,
        "images": ["https://...", "https://..."],
        "category": "Electronics",
        "brand": "Apple",
        "inStock": true,
        "stock": 150,
        "discount": 10
      }
    ],
    "total": 250,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

### Search Products
```
GET /products/search?q=iphone&category=electronics&sortBy=price
Authorization: Bearer {accessToken} (optional)

Query Parameters:
- q: Search query (required)
- category: Category filter
- sortBy: Field to sort by
- order: asc|desc

Response (200):
{
  "code": 200,
  "message": "Search completed",
  "data": {
    "query": "iphone",
    "results": [...products...],
    "total": 45,
    "executedIn": 125  // ms
  }
}
```

### Get Trending Products
```
GET /products/trending?limit=10
Authorization: Bearer {accessToken} (optional)

Response (200):
{
  "code": 200,
  "message": "Trending products",
  "data": [
    { /* product... */ }
  ]
}
```

### Get Product Details
```
GET /products/{productId}
Authorization: Bearer {accessToken} (optional)

Response (200):
{
  "code": 200,
  "message": "Product details",
  "data": {
    "id": "uuid",
    "name": "iPhone 15 Pro",
    "description": "...",
    "price": 999,
    "images": [...],
    "variants": [
      {
        "id": "uuid",
        "color": "Titanium Black",
        "size": "128GB",
        "price": 999,
        "inStock": true
      }
    ],
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Excellent phone!",
        "content": "...",
        "author": "John Doe",
        "verifiedPurchase": true,
        "helpfulCount": 45,
        "createdAt": 1712000000000
      }
    ],
    "averageRating": 4.8,
    "totalReviews": 1250,
    "shop": {
      "id": "uuid",
      "name": "Apple Store",
      "rating": 4.9
    }
  }
}
```

### Create Product (Shop Owner)
```
POST /products
Authorization: Bearer {shopAccessToken}
Content-Type: application/json

Request Body:
{
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones...",
  "category": "Electronics",
  "brand": "Sony",
  "images": ["https://...", "https://..."],
  "variants": [
    {
      "color": "Black",
      "size": "Standard",
      "price": 199.99,
      "compareAtPrice": 249.99,
      "weight": 250,
      "stock": 100
    }
  ]
}

Response (201):
{
  "code": 201,
  "message": "Product created successfully",
  "data": { /* product object */ }
}

Errors:
- 400: Invalid product data
- 401: Not authenticated as shop owner
- 409: Duplicate product name
```

### Update Product (Shop Owner)
```
PUT /products/{productId}
Authorization: Bearer {shopAccessToken}
Content-Type: application/json

Request Body:
{
  "name": "Updated Product Name",
  "price": 189.99,
  "stock": 150
}

Response (200):
{
  "code": 200,
  "message": "Product updated successfully",
  "data": { /* updated product */ }
}

Errors:
- 403: Not the product owner
- 404: Product not found
```

### Delete Product (Shop Owner)
```
DELETE /products/{productId}
Authorization: Bearer {shopAccessToken}

Response (200):
{
  "code": 200,
  "message": "Product deleted successfully"
}
```

---

## 🛒 Shopping Cart Endpoints

### Get Shopping Cart
```
GET /cart
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Cart retrieved",
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "iPhone 15 Pro",
        "price": 999,
        "quantity": 2,
        "image": "https://...",
        "subtotal": 1998
      }
    ],
    "subtotal": 1998,
    "discount": 0,
    "tax": 159.84,
    "total": 2157.84,
    "appliedDiscount": null,
    "itemCount": 2
  }
}
```

### Add Item to Cart
```
POST /cart/items
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "productId": "uuid",
  "quantity": 2,
  "variantId": "uuid" (optional)
}

Response (201):
{
  "code": 201,
  "message": "Item added to cart",
  "data": {
    "cartId": "uuid",
    "itemCount": 3,
    "total": 2157.84
  }
}

Errors:
- 400: Invalid quantity (must be 1-999)
- 404: Product not found
- 409: Out of stock
```

### Update Cart Item Quantity
```
PUT /cart/items/{itemId}
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "quantity": 5
}

Response (200):
{
  "code": 200,
  "message": "Item quantity updated",
  "data": { /* updated cart */ }
}

Errors:
- 404: Item not found in cart
- 409: Not enough inventory
```

### Remove Item from Cart
```
DELETE /cart/items/{itemId}
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Item removed from cart",
  "data": { /* updated cart */ }
}
```

### Clear Cart
```
DELETE /cart
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Cart cleared successfully"
}
```

### Apply Discount Code
```
POST /cart/apply-discount
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "couponCode": "SAVE20"
}

Response (200):
{
  "code": 200,
  "message": "Discount applied",
  "data": {
    "discount": {
      "id": "uuid",
      "code": "SAVE20",
      "type": "PERCENTAGE",
      "value": 20,
      "discountAmount": 399.60
    },
    "total": 1758.24
  }
}

Errors:
- 404: Coupon not found
- 409: Coupon expired or not valid
- 400: Minimum purchase not met
```

### Remove Discount
```
DELETE /cart/remove-discount
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Discount removed",
  "data": { /* updated cart */ }
}
```

---

## 💳 Checkout & Order Endpoints

### Create Order
```
POST /checkout
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "shippingMethod": "STANDARD",  // STANDARD|EXPRESS|OVERNIGHT
  "paymentMethod": "STRIPE",      // STRIPE|COD
  "notes": "Please deliver after 5pm"
}

Response (201):
{
  "code": 201,
  "message": "Order created successfully",
  "data": {
    "orderId": "uuid",
    "status": "PENDING_PAYMENT",
    "totalAmount": 2157.84,
    "itemCount": 2,
    "shippingAddress": { /* address... */ },
    "estimatedDelivery": "2026-04-19",
    "clientSecret": "pi_1234567890" // For Stripe payment
  }
}

Errors:
- 400: Missing required fields
- 409: Cart is empty
- 409: Insufficient inventory
- 401: Address not found or not owned by user
```

### Get User Orders
```
GET /checkout/orders?page=1&limit=10&status=ALL
Authorization: Bearer {accessToken}

Query Parameters:
- page: Page number
- limit: Items per page
- status: ALL|PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED

Response (200):
{
  "code": 200,
  "message": "Orders retrieved",
  "data": {
    "items": [
      {
        "id": "uuid",
        "status": "DELIVERED",
        "totalAmount": 2157.84,
        "itemCount": 2,
        "createdAt": 1712000000000,
        "estimatedDelivery": "2026-04-19",
        "trackingNumber": "1Z123456789"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### Get Order Details
```
GET /checkout/orders/{orderId}
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Order details",
  "data": {
    "id": "uuid",
    "status": "DELIVERED",
    "items": [
      {
        "productId": "uuid",
        "productName": "iPhone 15 Pro",
        "price": 999,
        "quantity": 2,
        "image": "https://..."
      }
    ],
    "subtotal": 1998,
    "discount": 399.60,
    "shippingCost": 15,
    "tax": 159.84,
    "totalAmount": 2157.84,
    "shippingAddress": { /* ... */ },
    "payment": {
      "method": "STRIPE",
      "status": "COMPLETED",
      "transactionId": "pi_123456"
    },
    "timeline": [
      {
        "status": "CONFIRMED",
        "timestamp": 1712000000000,
        "message": "Order confirmed"
      },
      {
        "status": "SHIPPED",
        "timestamp": 1712086400000,
        "message": "Package shipped",
        "trackingNumber": "1Z123456789"
      }
    ],
    "createdAt": 1712000000000,
    "updatedAt": 1712086400000
  }
}
```

---

## 💰 Payment Endpoints

### Create Stripe Payment Intent
```
POST /payments/intent
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "orderId": "uuid",
  "amount": 2157.84,
  "currency": "USD"
}

Response (200):
{
  "code": 200,
  "message": "Payment intent created",
  "data": {
    "clientSecret": "pi_1234567890_secret_1234567890",
    "publishableKey": "pk_test_1234567890",
    "amount": 2157.84,
    "currency": "USD"
  }
}
```

### Confirm Payment
```
POST /payments/confirm
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "orderId": "uuid",
  "paymentIntentId": "pi_1234567890"
}

Response (200):
{
  "code": 200,
  "message": "Payment confirmed successfully",
  "data": {
    "orderId": "uuid",
    "status": "CONFIRMED",
    "paymentStatus": "COMPLETED"
  }
}
```

### Webhook (Stripe)
```
POST /payments/webhook
Content-Type: application/json

(Automatically called by Stripe)
Handles: payment_intent.succeeded, charge.refunded, etc.

Response (200):
{
  "received": true
}
```

### Get Payment History
```
GET /payments/history?limit=20
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Payment history retrieved",
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "amount": 2157.84,
      "method": "STRIPE",
      "status": "COMPLETED",
      "transactionId": "pi_1234567890",
      "createdAt": 1712000000000
    }
  ]
}
```

---

## 🏷️ Discount/Coupon Endpoints

### Get Available Discounts
```
GET /discounts?limit=20
Authorization: Bearer {accessToken} (optional)

Response (200):
{
  "code": 200,
  "message": "Discounts retrieved",
  "data": [
    {
      "id": "uuid",
      "code": "SAVE20",
      "description": "Save 20% on all items",
      "type": "PERCENTAGE",
      "value": 20,
      "maxDiscount": 100,
      "minPurchase": 50,
      "validFrom": 1712000000000,
      "validTo": 1714678400000,
      "usageLimit": 1000,
      "usageCount": 250
    }
  ]
}
```

### Create Discount (Admin/Shop)
```
POST /discounts
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

Request Body:
{
  "code": "NEWYEAR2026",
  "description": "New Year Sale - 30% off",
  "type": "PERCENTAGE",  // PERCENTAGE|FIXED|FREE_SHIPPING
  "value": 30,
  "maxDiscount": 500,
  "minPurchase": 100,
  "validFrom": 1712000000000,
  "validTo": 1714678400000,
  "usageLimit": 5000,
  "applicableCategories": ["Electronics", "Fashion"]
}

Response (201):
{
  "code": 201,
  "message": "Discount created successfully",
  "data": { /* discount object */ }
}

Errors:
- 400: Invalid discount data
- 409: Coupon code already exists
```

### Update Discount (Admin/Shop)
```
PUT /discounts/{discountId}
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

Request Body:
{
  "value": 35,
  "usageLimit": 6000
}

Response (200):
{
  "code": 200,
  "message": "Discount updated successfully",
  "data": { /* updated discount */ }
}
```

### Validate Coupon
```
POST /discounts/{couponCode}/validate
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "cartTotal": 200.00
}

Response (200):
{
  "code": 200,
  "message": "Coupon is valid",
  "data": {
    "isValid": true,
    "discountAmount": 60,
    "finalTotal": 140,
    "message": null
  }
}

Response (400):
{
  "code": 400,
  "message": "Invalid coupon",
  "data": {
    "isValid": false,
    "reason": "COUPON_EXPIRED",
    "message": "This coupon expired on 2026-04-10"
  }
}
```

---

## 💬 Comments & Reviews Endpoints

### Get Product Reviews
```
GET /comments/product/{productId}?page=1&limit=10&sort=helpful
Authorization: Bearer {accessToken} (optional)

Query Parameters:
- page: Page number
- limit: Items per page
- sort: recent|helpful|rating_high|rating_low

Response (200):
{
  "code": 200,
  "message": "Reviews retrieved",
  "data": {
    "items": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Excellent product!",
        "content": "Very satisfied with this purchase...",
        "author": "John Doe",
        "verifiedPurchase": true,
        "helpfulCount": 123,
        "unhelpfulCount": 5,
        "images": ["https://..."],
        "createdAt": 1712000000000
      }
    ],
    "averageRating": 4.7,
    "totalReviews": 250,
    "ratingBreakdown": {
      "5": 180,
      "4": 45,
      "3": 15,
      "2": 8,
      "1": 2
    }
  }
}
```

### Post Product Review
```
POST /comments
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "productId": "uuid",
  "orderId": "uuid",  // Must have purchased product
  "rating": 5,
  "title": "Amazing product!",
  "content": "This product exceeded my expectations...",
  "images": ["https://...", "https://..."]
}

Response (201):
{
  "code": 201,
  "message": "Review posted successfully",
  "data": {
    "id": "uuid",
    "status": "PENDING_MODERATION",
    "message": "Your review is pending moderation"
  }
}

Errors:
- 403: Cannot review product you didn't purchase
- 409: You already reviewed this product
- 400: Rating must be 1-5
```

### Update Review
```
PUT /comments/{reviewId}
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "rating": 4,
  "title": "Good product",
  "content": "Updated review text..."
}

Response (200):
{
  "code": 200,
  "message": "Review updated successfully",
  "data": { /* updated review */ }
}

Errors:
- 403: Can only edit your own reviews
- 404: Review not found
```

### Delete Review
```
DELETE /comments/{reviewId}
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Review deleted successfully"
}
```

### Mark Review as Helpful
```
POST /comments/{reviewId}/helpful
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Thanks for your feedback",
  "data": {
    "helpfulCount": 124
  }
}
```

---

## 🔔 Notifications Endpoints

### Get User Notifications
```
GET /notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Notifications retrieved",
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "ORDER_CONFIRMED",
        "title": "Order Confirmed",
        "message": "Your order #12345 has been confirmed",
        "data": {
          "orderId": "uuid"
        },
        "read": false,
        "createdAt": 1712000000000
      }
    ],
    "unreadCount": 3,
    "total": 45
  }
}
```

### Mark Notification as Read
```
PUT /notifications/{notificationId}/read
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Notification marked as read"
}
```

### Mark All as Read
```
PUT /notifications/read-all
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "All notifications marked as read"
}
```

---

## 🏪 Shop Endpoints

### Get Shop Profile
```
GET /shops/{shopId}
Authorization: Bearer {accessToken} (optional)

Response (200):
{
  "code": 200,
  "message": "Shop profile retrieved",
  "data": {
    "id": "uuid",
    "name": "Apple Store",
    "description": "Official Apple products",
    "logo": "https://...",
    "banner": "https://...",
    "rating": 4.9,
    "reviews": 5200,
    "followers": 125000,
    "products": 850,
    "phone": "+1234567890",
    "email": "support@applestore.com",
    "website": "https://applestore.com",
    "founded": "2020-01-15",
    "isVerified": true
  }
}
```

### Get Shop Products
```
GET /shops/{shopId}/products?page=1&limit=20&sort=newest
Authorization: Bearer {accessToken} (optional)

Response (200):
{
  "code": 200,
  "message": "Shop products retrieved",
  "data": {
    "items": [...products...],
    "total": 850,
    "page": 1
  }
}
```

### Follow Shop
```
POST /shops/{shopId}/follow
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Following shop"
}
```

### Unfollow Shop
```
DELETE /shops/{shopId}/follow
Authorization: Bearer {accessToken}

Response (200):
{
  "code": 200,
  "message": "Unfollowed shop"
}
```

---

## Error Codes Reference

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| 400 | Bad Request | 400 | Invalid input data |
| 401 | Unauthorized | 401 | Missing or invalid token |
| 403 | Forbidden | 403 | Insufficient permissions |
| 404 | Not Found | 404 | Resource not found |
| 409 | Conflict | 409 | Resource conflict (e.g., duplicate) |
| 500 | Internal Server Error | 500 | Server error |

---

## Rate Limiting

```
Rate Limit Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1712000000

Limits:
- Login attempts: 5 per minute
- General endpoints: 100 per hour
- Search: 20 per minute
```

---

**Last Updated:** April 2026
