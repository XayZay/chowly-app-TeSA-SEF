"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(path, options) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      if (attempt === 1) throw error;
      await wait(500);
    }
  }
}

function money(value) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function shortId(id = "") {
  return id ? id.slice(0, 8).toUpperCase() : "";
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";
}

function csvToList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToCsv(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

const emptyForm = {
  name: "",
  price: "",
  prepTimeMinutes: "",
  category: "food",
  calories: "",
  rating: "4.6",
  imageUrl: "",
  sourceUrl: "",
  description: "",
  ingredients: "",
  allergens: "",
  pairings: ""
};

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async function loadAdminData() {
    setLoading(true);
    try {
      const [menuResult, feedbackResult] = await Promise.allSettled([
        api("/api/menu?all=1"),
        api("/api/admin/feedback")
      ]);
      const failures = [];

      if (menuResult.status === "fulfilled") setItems(menuResult.value);
      else failures.push(`Menu: ${menuResult.reason.message}`);

      if (feedbackResult.status === "fulfilled") setFeedback(feedbackResult.value);
      else failures.push(`Feedback: ${feedbackResult.reason.message}`);

      setMessage(failures.join("  "));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const session = await api("/api/admin/session");
        setAuthenticated(session.authenticated);
        if (session.authenticated) {
          await loadAdminData();
        }
      } catch (error) {
        setMessage(error.message);
      } finally {
        setCheckingSession(false);
        setLoading(false);
      }
    }

    checkSession();
  }, [loadAdminData]);

  async function login(event) {
    event.preventDefault();
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });
      setAuthenticated(true);
      setLoginForm({ username: "", password: "" });
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function logout() {
    await api("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setItems([]);
    setFeedback([]);
  }

  async function createItem(event) {
    event.preventDefault();
    try {
      await api("/api/menu", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          price: form.price,
          prepTimeMinutes: Number(form.prepTimeMinutes),
          category: form.category,
          calories: Number(form.calories) || null,
          rating: Number(form.rating) || 4.6,
          imageUrl: form.imageUrl,
          sourceUrl: form.sourceUrl,
          description: form.description,
          ingredients: csvToList(form.ingredients),
          allergens: csvToList(form.allergens),
          pairings: csvToList(form.pairings)
        })
      });
      setForm(emptyForm);
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateItem(item, patch) {
    try {
      await api(`/api/menu/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main>
      <header className="adminHero">
        <nav className="siteNav">
          <Link href="/" className="brandMark">Chowly</Link>
          <div className="navPills">
            <Link href="/">Restaurant</Link>
            {authenticated ? <button onClick={logout}>Logout</button> : <span>Admin</span>}
          </div>
        </nav>
        <div className="adminHeroText">
          <p className="eyebrow">Restaurant control room</p>
          <h1>Menu Studio</h1>
          <p>Manage the dine-in menu, photos, prices, prep times, and item story customers see before they order.</p>
        </div>
      </header>

      {message && <div className="notice">{message}</div>}

      {!authenticated ? (
        <section className="adminPage">
          <form className="loginPanel" onSubmit={login}>
            <div>
              <p className="eyebrow">Protected area</p>
              <h2>{checkingSession ? "Checking session" : "Admin login"}</h2>
            </div>
            <input
              autoComplete="username"
              disabled={checkingSession}
              onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="Username"
              value={loginForm.username}
            />
            <input
              autoComplete="current-password"
              disabled={checkingSession}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Password"
              type="password"
              value={loginForm.password}
            />
            <button className="primaryButton" disabled={checkingSession}>Login</button>
          </form>
        </section>
      ) : (
        <section className="adminPage">
        <div className="adminSplit">
          <form className="adminCreatePanel" onSubmit={createItem}>
          <div>
            <p className="eyebrow">New item</p>
            <h2>Add to menu</h2>
          </div>
          <div className="adminCreateGrid">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Item name" />
            <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price" type="number" min="1" step="50" />
            <input value={form.prepTimeMinutes} onChange={(event) => setForm((current) => ({ ...current, prepTimeMinutes: event.target.value }))} placeholder="Prep minutes" type="number" min="1" step="1" />
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              <option value="food">Food</option>
              <option value="drink">Drink</option>
            </select>
            <input value={form.calories} onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))} placeholder="Calories" type="number" min="0" step="10" />
            <input value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))} placeholder="Rating" type="number" min="0" max="5" step="0.1" />
          </div>
          <input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" />
          <input value={form.sourceUrl} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="Source URL" />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
          <div className="adminCreateGrid">
            <input value={form.ingredients} onChange={(event) => setForm((current) => ({ ...current, ingredients: event.target.value }))} placeholder="Ingredients, comma-separated" />
            <input value={form.allergens} onChange={(event) => setForm((current) => ({ ...current, allergens: event.target.value }))} placeholder="Allergens, comma-separated" />
            <input value={form.pairings} onChange={(event) => setForm((current) => ({ ...current, pairings: event.target.value }))} placeholder="Pairings, comma-separated" />
          </div>
          <button className="primaryButton">Add item</button>
          </form>

          <section className="feedbackPanel">
            <div className="adminListHeader">
              <div>
                <p className="eyebrow">Feedback</p>
                <h2>{feedback.length} order notes</h2>
              </div>
              <button className="ghostButton" onClick={loadAdminData}>Refresh</button>
            </div>

            {feedback.length === 0 ? <p className="empty">No complaints or ratings have been submitted yet.</p> : null}

            <div className="feedbackList">
              {feedback.map((order) => (
                <article className="feedbackCard" key={order.id}>
                  <div className="orderTop">
                    <div>
                      <p className="eyebrow">Order {shortId(order.id)}</p>
                      <h3>{order.rating ? `${order.rating.score}/5 rating` : "Complaint submitted"}</h3>
                    </div>
                    <strong>{money(order.total)}</strong>
                  </div>
                  <p className="finePrint">{formatDate(order.rating?.submittedAt || order.complaints?.[0]?.submittedAt || order.placed_at)}</p>
                  <div className="feedbackMeals">
                    {order.items.map((item) => <span key={item.id}>{item.quantity}x {item.name}</span>)}
                  </div>
                  {order.rating ? (
                    <p className="feedbackQuote">{order.rating.comment || "No rating comment added."}</p>
                  ) : null}
                  {order.complaints.map((complaint) => (
                    <p className="feedbackQuote complaintQuote" key={complaint.id}>{complaint.description}</p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="adminListHeader">
          <div>
            <p className="eyebrow">Current items</p>
            <h2>{loading ? "Loading menu" : `${items.length} records`}</h2>
          </div>
          <button className="ghostButton" onClick={loadAdminData}>Refresh</button>
        </div>

        <div className="adminMenuList">
          {items.map((item) => (
            <article className={!item.is_available ? "adminMenuCard mutedRow" : "adminMenuCard"} key={item.id}>
              <div className="adminPreview">
                <img src={item.image_url} alt={item.name} />
              </div>
              <div className="adminEditGrid">
                <input defaultValue={item.name} onBlur={(event) => event.target.value !== item.name && updateItem(item, { name: event.target.value })} />
                <input defaultValue={Number(item.price)} min="1" onBlur={(event) => Number(event.target.value) !== Number(item.price) && updateItem(item, { price: event.target.value })} step="50" type="number" />
                <input defaultValue={item.prep_time_minutes} min="1" onBlur={(event) => Number(event.target.value) !== Number(item.prep_time_minutes) && updateItem(item, { prepTimeMinutes: Number(event.target.value) })} step="1" type="number" />
                <select defaultValue={item.category} onChange={(event) => updateItem(item, { category: event.target.value })}>
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                </select>
                <input defaultValue={item.calories || ""} min="0" onBlur={(event) => Number(event.target.value || 0) !== Number(item.calories || 0) && updateItem(item, { calories: Number(event.target.value || 0) })} placeholder="Calories" type="number" />
                <input defaultValue={Number(item.rating || 4.6)} min="0" max="5" onBlur={(event) => Number(event.target.value) !== Number(item.rating || 0) && updateItem(item, { rating: Number(event.target.value) })} step="0.1" type="number" />
              </div>
              <textarea defaultValue={item.description || ""} onBlur={(event) => event.target.value !== (item.description || "") && updateItem(item, { description: event.target.value })} />
              <input defaultValue={item.image_url || ""} onBlur={(event) => event.target.value !== (item.image_url || "") && updateItem(item, { imageUrl: event.target.value })} placeholder="Image URL" />
              <input defaultValue={item.source_url || ""} onBlur={(event) => event.target.value !== (item.source_url || "") && updateItem(item, { sourceUrl: event.target.value })} placeholder="Source URL" />
              <div className="adminEditGrid triple">
                <input defaultValue={listToCsv(item.ingredients)} onBlur={(event) => event.target.value !== listToCsv(item.ingredients) && updateItem(item, { ingredients: csvToList(event.target.value) })} placeholder="Ingredients" />
                <input defaultValue={listToCsv(item.allergens)} onBlur={(event) => event.target.value !== listToCsv(item.allergens) && updateItem(item, { allergens: csvToList(event.target.value) })} placeholder="Allergens" />
                <input defaultValue={listToCsv(item.pairings)} onBlur={(event) => event.target.value !== listToCsv(item.pairings) && updateItem(item, { pairings: csvToList(event.target.value) })} placeholder="Pairings" />
              </div>
              <button className="ghostButton" onClick={() => updateItem(item, { isAvailable: !item.is_available })}>
                {item.is_available ? "Hide from menu" : "Show on menu"}
              </button>
            </article>
          ))}
        </div>
      </section>
      )}
    </main>
  );
}
