# Chowly

Chowly is a no-login dine-in ordering demo built from `chowly-prd.md`.

## Run locally

1. Create a Postgres database.
2. Run `chowly-schema.sql` against it.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`.
4. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Implemented flow

- Customer browses available menu items, builds a cart, places an order, sees a prep-time estimate, complains, rates, and records a clearly labeled pretend payment.
- Waiter opens orders, assigns waiter/chef/bartender names, advances order status, and marks orders served.
- API routes persist all core records in Postgres with UUID primary keys, transaction-backed order creation, one rating per order, frozen order item prices, and idempotent payments.
