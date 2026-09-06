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

Open `http://localhost:3000`. The admin dashboard is at `http://localhost:3000/admin`.

## Implemented flow

- Customer browses available Nigerian menu items, opens item detail pages, builds a cart, places an order, sees a prep-time estimate, submits complaints, rates, and makes a pretend payment.
- New orders are automatically assigned to a waiter, chef, and bartender, then shown in the waiter dashboard as `Placed`.
- Orders cannot move from `Placed` to `In progress`, `Ready`, or `Served` until pretend payment is recorded.
- Waiter reviews active paid orders, advances status by command, and marks orders served; served orders leave the active queue.
- Admin lives at `/admin`, requires login, and manages menu item names, prices, prep times, categories, availability, images, descriptions, ingredients, allergens, pairings, calories, ratings, and source URLs.
- Admin also has a Feedback section backed by Postgres. It shows retained complaints and ratings attached to each meal order every time the admin dashboard opens, including after a new session.
- API routes persist all core records in Postgres with UUID primary keys, transaction-backed order creation, one rating per order, frozen order item prices, retained complaints, and idempotent pretend payments.
- First-load API calls retry once and load independently so a slow Supabase/DNS connection does not blank the whole app. If Supabase still cannot resolve the pooler host, the notice will show the database error so the connection string or network can be fixed.
