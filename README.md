# Chowly

Chowly is a no-login dine-in ordering demo built from `chowly-prd.md`.

## Run locally

1. Create a Postgres database.
2. Run `chowly-schema.sql` against it.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`.
4. Seed the admin login and rich menu:

```bash
npm run seed:admin
npm run seed:menu
```

The default lab admin is `admin` / `admin`; the password is stored in Postgres as a hash.

5. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Implemented flow

- Customer browses available menu items, builds a cart, places an order, sees a prep-time estimate, complains, rates, and pays.
- New orders are automatically assigned to a waiter, chef, and bartender, then shown in the waiter dashboard.
- Waiter reviews active orders, advances order status, and marks orders served; served orders leave the active queue.
- Admin lives at `/admin`, requires login, and manages menu item names, prices, prep times, categories, availability, images, descriptions, ingredients, allergens, pairings, calories, ratings, and source URLs.
- API routes persist all core records in Postgres with UUID primary keys, transaction-backed order creation, one rating per order, frozen order item prices, and idempotent payments.
