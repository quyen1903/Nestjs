# 🚀 Backend Quick Start Guide

## 5-Minute Setup

### Prerequisites Check
```bash
# Check Node.js version
node --version  # Should be v18+ (ideally v20)

# Check npm version
npm --version   # Should be v9+

# Check PostgreSQL is installed
psql --version
```

### Step 1: Clone & Install (2 minutes)
```bash
git clone <repo-url>
cd ecommerce-backend
npm install
```

### Step 2: Database Setup (2 minutes)
```bash
# Create .env file
cp .env.example .env

# Edit .env - add your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db

# Run migrations
npx prisma migrate dev --name init

# Optional: Seed sample data
npx prisma db seed
```

### Step 3: Start Development Server (1 minute)
```bash
npm run start:dev
```

**Expected Output:**
```
[Nest] XX:XX:XX     LOG [NestFactory] Initializing NestApplication ...
...
[Nest] XX:XX:XX     LOG Nest application successfully started
[Nest] XX:XX:XX     LOG Server is running on: http://localhost:3056/api
```

✅ **Done!** API is running on `http://localhost:3056/api`

---

## Test the API

### Health Check
```bash
curl http://localhost:3056/api/health
# Response: { "status": "ok" }
```

### Register a New User
```bash
curl -X POST http://localhost:3056/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response:
# {
#   "code": 201,
#   "message": "User registered successfully",
#   "data": {
#     "userId": "uuid-here",
#     "accessToken": "jwt-token-here",
#     ...
#   }
# }
```

### Login
```bash
curl -X POST http://localhost:3056/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test@1234"
  }'
```

### View API Documentation
Open in browser:
```
http://localhost:3056/api/docs
```

---

## Common Commands

```bash
# Development
npm run start:dev              # Start dev server with auto-reload

# Database
npx prisma studio             # GUI database browser
npx prisma migrate status      # Check migration status
npx prisma db seed             # Seed with sample data
npx prisma migrate reset       # ⚠️ Wipes database

# Testing
npm test                       # Run unit tests
npm run test:e2e              # Run integration tests
npm run test:cov              # Generate coverage report

# Building
npm run build                  # Build for development
npm run build:prod            # Optimized production build

# Code Quality
npm run lint                   # ESLint check & fix
npm run format                 # Prettier format
npm run typecheck              # TypeScript type check

# Debugging
npm run start:debug            # Start with Node debugger
npm run test:debug             # Run tests with debugger
```

---

## Project Structure

```
src/
├── app.module.ts           # Root module
├── app.controller.ts        # Root routes
├── main.ts                  # Entry point
├── modules/                 # Feature modules
│   ├── auth/               # User authentication
│   ├── shop/               # Shop management
│   ├── product/            # Products
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Order creation
│   ├── payment/            # Payment processing
│   ├── inventory/          # Stock management
│   ├── discount/           # Coupons
│   ├── comment/            # Reviews
│   ├── notification/       # Notifications
│   ├── user/               # User profiles
│   ├── keytoken/           # Token management
│   └── order-cronjob/      # Scheduled tasks
├── services/               # Shared services
│   ├── prisma/             # Database ORM
│   ├── kafka/              # Event streaming
│   ├── email/              # Email sender
│   └── discord/            # Discord notifications
├── shared/                 # Shared utilities
│   ├── exceptions/         # Custom exceptions
│   ├── interceptors/       # Response formatting
│   ├── pipes/              # Validation
│   └── middleware/         # Request processing
└── prisma/                 # Database schema
    └── schema.prisma
```

---

## Key Features

### 1. Authentication
- JWT tokens (access + refresh)
- Multiple auth strategies (email/password, Google OAuth)
- Role-based access control (USER, SHOP, ADMIN)

### 2. Products
- Full-text search on PostgreSQL
- Advanced filtering (price, category, rating)
- Variants (SKU) management

### 3. Orders & Checkout
- Shopping cart management
- Inventory validation
- Stripe payment integration
- Order status tracking

### 4. Real-time Updates
- Socket.io for live notifications
- Order status updates
- Inventory changes
- Browser notifications

### 5. Notifications
- Email (via SMTP)
- Discord (via webhooks)
- In-app notifications
- WebSocket updates

---

## Environment Variables Explained

```bash
# Server Settings
NODE_ENV=development          # development|production
PORT=3056                     # Server port
API_URL=http://localhost:3056 # API base URL

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE

# JWT
JWT_SECRET=your-secret-key    # Must be strong & unique
JWT_REFRESH_SECRET=refresh-key
JWT_EXPIRY=900                # 15 minutes in seconds
JWT_REFRESH_EXPIRY=604800     # 7 days in seconds

# OAuth - Google
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Payments - Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email - SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=app-password    # NOT your Gmail password!
MAIL_FROM=noreply@yourdomain.com

# Discord Notifications
DISCORD_BOT_TOKEN=token
DISCORD_WEBHOOK_URL=webhook-url

# Kafka (Optional)
KAFKA_BROKER=localhost:9092

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

---

## Database Setup (Detailed)

### Option A: Docker (Recommended for Beginners)
```bash
# Install Docker Desktop from docker.com

# Start PostgreSQL container
docker run --name ecommerce-db \
  -e POSTGRES_USER=ecommerce \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running
docker ps | grep ecommerce-db

# Connect to database
psql -h localhost -U ecommerce -d ecommerce_db
```

### Option B: Local PostgreSQL Installation

**On Windows:**
1. Download from https://www.postgresql.org/download/
2. Run installer, remember password
3. Accept default settings
4. PostgreSQL runs on localhost:5432

**On macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**On Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database
```bash
createdb -U postgres ecommerce_db
# Enter password when prompted
```

### Verify Connection
```bash
psql -U ecommerce -d ecommerce_db -c "SELECT 1"
# Should output: 1
```

---

## Troubleshooting

### Problem: "Cannot find module '@nestjs/common'"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Database connection refused"
**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -d postgres -c "SELECT 1"

# If failed, start PostgreSQL:
# Windows: Services > PostgreSQL
# Mac: brew services start postgresql@15
# Linux: sudo systemctl start postgresql
```

### Problem: "relation 'accounts' does not exist"
**Solution:**
```bash
# Run migrations
npx prisma migrate dev

# Or reset (⚠️ loses all data)
npx prisma migrate reset
```

### Problem: "Port 3056 already in use"
**Solution:**
```bash
# On Windows
netstat -ano | findstr :3056
taskkill /PID <PID> /F

# On Mac/Linux
lsof -i :3056
kill -9 <PID>

# Or use different port
PORT=3057 npm run start:dev
```

### Problem: Prisma studio won't open
**Solution:**
```bash
npx prisma studio --browser=none
# Then open http://localhost:5555 manually
```

---

## Git Workflow

### Before Starting Work
```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### Making Changes
```bash
# Work on your feature
# ...

# Stage changes
git add src/

# Commit with descriptive message
git commit -m "feat: add new feature description"
```

### Push & Create PR
```bash
git push origin feat/your-feature-name

# On GitHub: Create Pull Request with description
```

### Common Commits
```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "refactor: restructure code"
git commit -m "docs: update documentation"
git commit -m "test: add unit tests"
```

---

## Performance Tips

### 1. Use Select to Avoid Fetching Unnecessary Fields
```typescript
// ❌ Fetches all fields
const user = await prisma.account.findUnique({
  where: { id: userId }
});

// ✅ Only fetch needed fields
const user = await prisma.account.findUnique({
  where: { id: userId },
  select: { id: true, email: true, name: true }
});
```

### 2. Use Pagination on Large Result Sets
```typescript
// ❌ Danger: Loads millions of records
const allProducts = await prisma.sku.findMany();

// ✅ Use pagination
const products = await prisma.sku.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

### 3. Add Database Indexes for Frequently Queried Fields
```prisma
model Product {
  id    String  @id @default(uuid())
  name  String  @db.VarChar(200)
  email String  @unique
  
  @@index([name])  // Add index on frequently searched field
}
```

### 4. Use Connection Pooling (Production)
```bash
# In DATABASE_URL, add pool settings
DATABASE_URL="postgresql://user:pass@localhost/db?schema=public&connection_limit=20"
```

---

## Monitoring & Logging

### View Application Logs
```bash
# Development (console)
npm run start:dev

# Production logs
pm2 logs ecommerce-backend

# Docker logs
docker logs ecommerce-api
```

### Database Performance
```bash
# Check slow queries in PostgreSQL
psql -d ecommerce_db -c "
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

### Monitor Prisma Queries
```typescript
// Enable query logging in prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Add logging
  // log: ["query", "info", "warn", "error"]
}
```

---

## Production Deployment

### Build
```bash
npm run build:prod
```

### Run
```bash
npm run start:prod
```

### Using PM2 (Process Manager)
```bash
npm install -g pm2

pm2 start dist/main.js --name ecommerce-backend

# Monitor
pm2 monit

# Check logs
pm2 logs ecommerce-backend

# Restart on file changes
pm2 start dist/main.js --name ecommerce-backend --watch
```

### Using Docker
```bash
# Build image
docker build -t ecommerce-backend:latest .

# Run container
docker run -d \
  --name ecommerce-api \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  -p 3056:3056 \
  ecommerce-backend:latest

# View logs
docker logs -f ecommerce-api
```

### Environment Variables (Production)
```bash
NODE_ENV=production
JWT_SECRET=<VERY_STRONG_SECRET>
STRIPE_SECRET_KEY=sk_live_xxx
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
```

---

## Resources

- **NestJS Docs:** https://docs.nestjs.com
- **Prisma Docs:** https://www.prisma.io/docs
- **Stripe API:** https://stripe.com/docs/api
- **Socket.io:** https://socket.io/docs
- **PostgreSQL:** https://www.postgresql.org/docs

---

## Support

- 📖 Check [BACKEND_DOCUMENTATION.md](BACKEND_DOCUMENTATION.md) for detailed docs
- 🔧 Check [ISSUES_AND_FIXES.md](ISSUES_AND_FIXES.md) for known issues
- 📡 Check [API_REFERENCE.md](API_REFERENCE.md) for API endpoints
- 💬 Open GitHub Issue for bugs
- 📧 Email: team@yourdomain.com

---

**Happy Coding! 🎉**

Last Updated: April 2026
