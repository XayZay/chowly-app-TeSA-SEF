# Chowly 🍲

Chowly is a robust, no-login dine-in restaurant ordering application. Built with Next.js and PostgreSQL, it features a comprehensive full-stack architecture catering to Customers, Waiters, and Administrators, currently themed around authentic Nigerian cuisine.

## 🌟 Key Features

### 🧑‍🍳 Customer Experience (Guest Mode)
- **Guest Session Isolation:** Customers are instantly assigned a unique session ID tied to their device. Active orders are completely isolated from other diners, preventing data leaks.
- **Rolling Expiration:** Customer sessions automatically expire after 1 hour of inactivity, resetting the UI for a fresh dining experience without losing historical database records.
- **Rich Menu Browsing:** Browse authentic dishes with high-definition imagery, calorie counts, preparation times, ingredients, allergens, and suggested pairings.
- **Interactive Cart & Order Tracking:** Build a cart, place an order, view estimated wait times, and track order progress in real-time.
- **Pretend Payment & Feedback:** Customers can simulate payments and submit complaints or 1-5 star ratings for their orders.

### 🛎️ Waiter Dashboard
- **Centralized Queue:** Waiters can view all open orders across the restaurant in one unified dashboard.
- **Staff Assignment:** Orders are automatically assigned a Chef, Bartender, and Waiter, which can be manually overridden.
- **Strict Progression Logic:** Enforces a strict "Pay-Upfront" model (Fast-Casual). Orders cannot be moved to `In Progress`, `Ready`, or `Served` until the customer has explicitly paid. Unpaid orders remain locked in the `Placed` state.

### ⚙️ Admin Dashboard
- **Secure Authentication:** Protected `/admin` route requiring username and hashed password login.
- **Live Menu Management:** Toggle item availability (Active/Hidden), update prices, names, and descriptions on the fly.
- **Instant Search:** Quickly filter the menu by name, description, or ingredients.
- **Feedback Hub:** Review retained complaints and ratings tied to specific historical orders.

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), React, CSS Modules (Responsive Dark Theme UI)
- **Backend:** Next.js API Routes, Node.js
- **Database:** PostgreSQL (using `pg` driver), Transaction-backed queries

## 🚀 Run Locally

### 1. Database Setup
Create a PostgreSQL database and initialize the tables by running the schema:
```bash
psql -d <your_database_name> -f chowly-schema.sql
```

### 2. Environment Variables
Copy the example environment file and add your PostgreSQL connection string:
```bash
cp .env.example .env
```
Update `.env` with your `DATABASE_URL`.

### 3. Seed the Database
Populate the database with the default admin user and the rich, verified 22-item Nigerian menu:
```bash
npm run seed:admin
npm run seed:menu
```
*Note: The default admin login is `admin` / `admin`.*

### 4. Install & Run
Install dependencies and start the Next.js development server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app. 
The Admin dashboard is available at [http://localhost:3000/admin](http://localhost:3000/admin).

## 🏗️ Architecture & Workflows

### Session-Based Order Isolation
Instead of a heavyweight user-account system, Chowly uses a seamless **Guest Checkout** model. When a user visits the site, the app generates a `sessionId` (stored in `localStorage`). This ID is passed in the headers/body of API requests (`GET /api/orders` and `POST /api/orders`) to ensure customers only see their own active orders. The session gracefully expires after 1 hour of inactivity.

### Order Progression Flow
1. **Placed:** Order is created in the database wrapped in a safe transaction (freezing prices at the time of purchase).
2. **Payment Required:** The Waiter UI and `PATCH /api/orders/[id]` backend block any progression until the customer clicks "Pretend Payment".
3. **In Progress:** The kitchen has started preparing the food.
4. **Ready:** The meal is ready to be delivered to the table.
5. **Served:** The meal is delivered. Once an order is paid and served, it is removed from the Waiter's active queue.

### Resilience
API routes persist all core records with UUID primary keys. First-load API calls retry once automatically and load independently so a slow DNS/database connection does not blank the entire application.
