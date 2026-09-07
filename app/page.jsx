"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const statusLabels = {
  placed: "Placed",
  in_progress: "In progress",
  ready: "Ready",
  served: "Served"
};

const statusSteps = ["placed", "in_progress", "ready", "served"];

function money(value) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function shortId(id = "") {
  return id ? id.slice(0, 8).toUpperCase() : "";
}

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

export default function Home() {
  const [mode, setMode] = useState("customer");
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState({ waiters: [], chefs: [], bartenders: [] });
  const [cart, setCart] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null);
  const [complaint, setComplaint] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const cartItems = useMemo(
    () =>
      menu
        .filter((item) => cart[item.id])
        .map((item) => ({ ...item, quantity: cart[item.id], lineTotal: Number(item.price) * cart[item.id] })),
    [cart, menu]
  );
  const cartTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartWait = cartItems.length ? Math.max(...cartItems.map((item) => item.prep_time_minutes)) : 0;

  const loadBaseData = useCallback(async function loadBaseData() {
    setLoading(true);
    
    const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
    let sessionId = localStorage.getItem("chowly:sessionId");
    let lastSeen = localStorage.getItem("chowly:sessionLastSeen");
    
    if (sessionId && lastSeen && (Date.now() - parseInt(lastSeen, 10) > SESSION_TIMEOUT)) {
      sessionId = null;
      localStorage.removeItem("chowly:lastOrderId"); // Clear any old active order
    }

    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("chowly:sessionId", sessionId);
    }
    localStorage.setItem("chowly:sessionLastSeen", Date.now().toString());

    try {
      const [menuResult, staffResult, orderResult] = await Promise.allSettled([
        api("/api/menu"),
        api("/api/staff"),
        api(`/api/orders${mode === "customer" ? "?sessionId=" + sessionId : ""}`)
      ]);
      const failures = [];

      if (menuResult.status === "fulfilled") setMenu(menuResult.value);
      else failures.push(`Menu: ${menuResult.reason.message}`);

      if (staffResult.status === "fulfilled") setStaff(staffResult.value);
      else failures.push(`Staff: ${staffResult.reason.message}`);

      if (orderResult.status === "fulfilled") setOrders(orderResult.value);
      else failures.push(`Orders: ${orderResult.reason.message}`);

      setMessage(failures.join("  "));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const loadOrder = useCallback(async function loadOrder(id) {
    if (!id) return;
    try {
      const order = await api(`/api/orders/${id}`);
      setActiveOrder(order);
      localStorage.setItem("chowly:lastOrderId", order.id);
    } catch (error) {
      setMessage(error.message);
    }
  }, []);

  async function refreshOrder(id = activeOrder?.id) {
    return loadOrder(id);
  }

  useEffect(() => {
    loadBaseData();
    const savedOrderId = localStorage.getItem("chowly:lastOrderId");
    if (savedOrderId) {
      loadOrder(savedOrderId);
    }
  }, [loadBaseData, loadOrder]);

  function changeQty(itemId, delta) {
    setCart((current) => {
      const nextQty = Math.max(0, (current[itemId] || 0) + delta);
      const next = { ...current };
      if (nextQty === 0) {
        delete next[itemId];
      } else {
        next[itemId] = nextQty;
      }
      return next;
    });
  }

  function openItem(item) {
    setSelectedItem(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function placeOrder() {
    if (cartItems.length === 0) return;
    setMessage("");
    try {
      const sessionId = localStorage.getItem("chowly:sessionId");
      const order = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
          sessionId
        })
      });
      setActiveOrder(order);
      setCart({});
      localStorage.setItem("chowly:lastOrderId", order.id);
      await loadBaseData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitComplaint() {
    if (!activeOrder || !complaint.trim()) return;
    try {
      await api(`/api/orders/${activeOrder.id}/complaint`, {
        method: "POST",
        body: JSON.stringify({ description: complaint })
      });
      setComplaint("");
      await refreshOrder();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitRating() {
    if (!activeOrder) return;
    try {
      await api(`/api/orders/${activeOrder.id}/rating`, {
        method: "POST",
        body: JSON.stringify({ score: ratingScore, comment: ratingComment })
      });
      setRatingComment("");
      await refreshOrder();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function payOrder() {
    if (!activeOrder) return;
    try {
      await api(`/api/orders/${activeOrder.id}/payment`, { method: "POST" });
      await refreshOrder();
      await loadBaseData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function closeCompletedOrder() {
    setActiveOrder(null);
    localStorage.removeItem("chowly:lastOrderId");
  }

  async function updateOrder(orderId, patch) {
    try {
      const order = await api(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      setActiveOrder((current) => (current?.id === order.id ? order : current));
      await loadBaseData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const visibleMenu = useMemo(() => {
    const term = search.trim().toLowerCase();
    return menu.filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        String(item.description || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, menu, search]);

  const groupedMenu = {
    food: visibleMenu.filter((item) => item.category === "food"),
    drink: visibleMenu.filter((item) => item.category === "drink")
  };

  return (
    <main>
      <header className="topbar">
        <div className="heroCopy">
          <p className="eyebrow">Restaurant table ordering</p>
          <h1>Chowly</h1>
          <p>Browse Nigerian dishes, place a table order, make a pretend payment, then follow waiter updates.</p>
        </div>
        <div className="topbarActions">
          <div className="modeSwitch" aria-label="Choose app mode">
            <button className={mode === "customer" ? "active" : ""} onClick={() => setMode("customer")}>
              Customer
            </button>
            <button className={mode === "waiter" ? "active" : ""} onClick={() => setMode("waiter")}>
              Waiter
            </button>
          </div>
          <Link href="/admin" className="adminLink" aria-label="Admin settings" title="Open Admin Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Admin</span>
          </Link>
        </div>
      </header>

      {message && <div className="notice">{message}</div>}

      {mode === "customer" && selectedItem ? (
        <ItemDetail
          item={selectedItem}
          quantity={cart[selectedItem.id] || 0}
          onBack={() => setSelectedItem(null)}
          onAdd={() => changeQty(selectedItem.id, 1)}
          onRemove={() => changeQty(selectedItem.id, -1)}
        />
      ) : mode === "customer" ? (
        <section className="customerLayout">
          <div className="menuPane">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Menu</p>
                <h2>Order now</h2>
              </div>
              <button className="ghostButton" onClick={loadBaseData}>Refresh</button>
            </div>

            <div className="menuTools">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rice, suya, zobo..." />
              <div className="categoryPills">
                <button className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>All</button>
                <button className={categoryFilter === "food" ? "active" : ""} onClick={() => setCategoryFilter("food")}>Foods</button>
                <button className={categoryFilter === "drink" ? "active" : ""} onClick={() => setCategoryFilter("drink")}>Drinks</button>
              </div>
            </div>

            {loading ? <p className="empty">Loading Chowly...</p> : null}
            {!loading && menu.length === 0 ? <p className="empty">The menu is currently unavailable.</p> : null}
            {!loading && menu.length > 0 && visibleMenu.length === 0 ? <p className="empty">No menu item matches that search.</p> : null}

            {["food", "drink"].map((category) => (
              groupedMenu[category].length > 0 && (
                <div className="menuGroup" key={category}>
                  <h3>{category === "food" ? "Kitchen" : "Bar"}</h3>
                  <div className="menuGrid">
                    {groupedMenu[category].map((item) => (
                      <article className="menuItem foodCard" key={item.id}>
                        <button className="cardImageButton" onClick={() => openItem(item)} aria-label={`View ${item.name}`}>
                          <img src={item.image_url} alt={item.name} />
                        </button>
                        <div className="foodCardBody">
                          <h4>{item.name}</h4>
                          <p>{item.description}</p>
                          <div className="foodMeta">
                            <span>{item.calories || "Fresh"} kcal</span>
                            <span>{item.prep_time_minutes} min</span>
                            <span>{Number(item.rating || 4.7).toFixed(1)} rating</span>
                          </div>
                        </div>
                        <div className="foodCardActions">
                          <strong>{money(item.price)}</strong>
                          <button className="ghostButton" onClick={() => openItem(item)}>Details</button>
                          <div className="stepper">
                            <button aria-label={`Remove ${item.name}`} onClick={() => changeQty(item.id, -1)}>-</button>
                            <span>{cart[item.id] || 0}</span>
                            <button aria-label={`Add ${item.name}`} onClick={() => changeQty(item.id, 1)}>+</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          <aside className="sidePanel">
            <h2>Your order</h2>
            {cartItems.length === 0 ? (
              <p className="empty">Select at least one item to place an order.</p>
            ) : (
              <>
                <div className="lineItems">
                  {cartItems.map((item) => (
                    <div className="lineItem" key={item.id}>
                      <span>{item.quantity}x {item.name}</span>
                      <strong>{money(item.lineTotal)}</strong>
                    </div>
                  ))}
                </div>
                <div className="totals">
                  <span>Estimated wait</span>
                  <strong>{cartWait} min</strong>
                  <span>Total</span>
                  <strong>{money(cartTotal)}</strong>
                </div>
                <button className="primaryButton" onClick={placeOrder}>Place order</button>
              </>
            )}
          </aside>

          {activeOrder && (
            <OrderStatus
              order={activeOrder}
              complaint={complaint}
              ratingComment={ratingComment}
              ratingScore={ratingScore}
              onComplaintChange={setComplaint}
              onRatingCommentChange={setRatingComment}
              onRatingScoreChange={setRatingScore}
              onRefresh={() => refreshOrder()}
              onSubmitComplaint={submitComplaint}
              onSubmitRating={submitRating}
              onPay={payOrder}
              onClose={closeCompletedOrder}
            />
          )}
        </section>
      ) : (
        <section className="waiterLayout">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Waiter dashboard</p>
              <h2>Open orders</h2>
              <p className="sectionNote">Orders stay placed until paid. Served orders leave this active queue automatically.</p>
            </div>
            <button className="ghostButton" onClick={loadBaseData}>Refresh</button>
          </div>

          {orders.length === 0 ? <p className="empty">No orders have been placed yet.</p> : null}

          <div className="ordersGrid">
            {orders.map((order) => (
              <article className="orderCard" key={order.id}>
                <div className="orderTop">
                  <div>
                    <p className="eyebrow">Order {shortId(order.id)}</p>
                    <h3>{statusLabels[order.status]}</h3>
                  </div>
                  <strong>{money(order.total)}</strong>
                </div>

                <div className="chips">
                  <span>{order.wait_time_minutes} min estimate</span>
                  <span>{order.is_paid ? "Paid" : "Unpaid"}</span>
                  {!order.is_paid ? <span>Waiting for pretend payment</span> : null}
                </div>

                <div className="lineItems compact">
                  {order.items.map((item) => (
                    <div className="lineItem" key={`${order.id}-${item.name}`}>
                      <span>{item.quantity}x {item.name}</span>
                      <strong>{money(Number(item.unitPrice) * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                <div className="assignmentGrid">
                  <label>
                    Waiter
                    <select value={order.waiter_id || ""} onChange={(event) => updateOrder(order.id, { waiterId: event.target.value })}>
                      <option value="">Unassigned</option>
                      {staff.waiters.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Chef
                    <select value={order.chef_id || ""} onChange={(event) => updateOrder(order.id, { chefId: event.target.value })}>
                      <option value="">Unassigned</option>
                      {staff.chefs.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Bartender
                    <select value={order.bartender_id || ""} onChange={(event) => updateOrder(order.id, { bartenderId: event.target.value })}>
                      <option value="">Unassigned</option>
                      {staff.bartenders.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="statusButtons">
                  {statusSteps.map((status) => (
                    <button
                      className={order.status === status ? "active" : ""}
                      disabled={!order.is_paid && status !== "placed"}
                      key={status}
                      onClick={() => updateOrder(order.id, { status })}
                      title={!order.is_paid && status !== "placed" ? "Payment is required before moving this order forward." : ""}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function OrderStatus({
  order,
  complaint,
  ratingComment,
  ratingScore,
  onComplaintChange,
  onRatingCommentChange,
  onRatingScoreChange,
  onRefresh,
  onSubmitComplaint,
  onSubmitRating,
  onPay,
  onClose
}) {
  const isComplete = order.status === "served" && order.is_paid;

  return (
    <section className="statusPanel">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Order {shortId(order.id)}</p>
          <h2>{statusLabels[order.status]} · {order.wait_time_minutes} min wait</h2>
        </div>
        <button className="ghostButton" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="progress" aria-label="Order progress">
        {statusSteps.map((status) => (
          <span className={statusSteps.indexOf(order.status) >= statusSteps.indexOf(status) ? "done" : ""} key={status}>
            {statusLabels[status]}
          </span>
        ))}
      </div>

      <div className="statusColumns">
        <div>
          <h3>Items</h3>
          <div className="lineItems">
            {order.items.map((item) => (
              <div className="lineItem" key={item.id}>
                <span>{item.quantity}x {item.name}</span>
                <strong>{money(Number(item.unitPrice) * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="totals single">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
        </div>

        <div>
          <h3>Prepared by</h3>
          <p className="staffLine">Waiter: {order.waiter_name || "Not assigned"}</p>
          <p className="staffLine">Chef: {order.chef_name || "Not assigned"}</p>
          <p className="staffLine">Bartender: {order.bartender_name || "Not assigned"}</p>
          <button className="primaryButton" disabled={order.is_paid} onClick={onPay}>
            {order.is_paid ? "Paid" : "Pretend payment"}
          </button>
          {isComplete ? (
            <button className="ghostButton full followButton" onClick={onClose}>Start new order</button>
          ) : null}
        </div>

        <div>
          <h3>{isComplete ? "Order complete" : "Feedback"}</h3>
          {isComplete ? <p className="staffLine">Thanks. This table order has been served and paid.</p> : null}
          <textarea value={complaint} onChange={(event) => onComplaintChange(event.target.value)} placeholder="Describe a delay or issue" />
          <button className="ghostButton full" onClick={onSubmitComplaint}>Submit complaint</button>

          <div className="ratingRow">
            {[1, 2, 3, 4, 5].map((score) => (
              <button className={ratingScore === score ? "active" : ""} key={score} onClick={() => onRatingScoreChange(score)}>
                {score}
              </button>
            ))}
          </div>
          <input value={ratingComment} onChange={(event) => onRatingCommentChange(event.target.value)} placeholder="Optional rating comment" />
          <button className="ghostButton full" onClick={onSubmitRating}>Submit rating</button>
          {order.rating ? <p className="finePrint">Current rating: {order.rating.score}/5</p> : null}
        </div>
      </div>
    </section>
  );
}

function ItemDetail({ item, quantity, onBack, onAdd, onRemove }) {
  const ingredients = item.ingredients || [];
  const allergens = item.allergens || [];
  const pairings = item.pairings || [];

  return (
    <section className="detailShell">
      <div className="phoneDetail">
        <div className="detailHero">
          <img src={item.image_url} alt={item.name} />
          <button className="roundButton left" onClick={onBack} aria-label="Back to menu">‹</button>
          <span className="roundButton right" aria-label="Rating">{Number(item.rating || 4.7).toFixed(1)}</span>
        </div>

        <div className="detailSheet">
          <div className="detailTitle">
            <h2>{item.name}</h2>
            <strong>{money(item.price)}</strong>
          </div>
          <p className="detailDescription">{item.description}</p>

          <div className="detailStats">
            <span>{item.calories || "Fresh"} kcal</span>
            <span>{item.prep_time_minutes} min</span>
            <span>{item.category === "food" ? "Meal" : "Drink"}</span>
          </div>

          <h3>Key ingredients</h3>
          <div className="ingredientGrid">
            {ingredients.map((ingredient) => (
              <span key={ingredient}>{ingredient}</span>
            ))}
          </div>

          <h3>Allergens</h3>
          <div className="tagRow">
            {allergens.map((allergen) => (
              <span key={allergen}>{allergen}</span>
            ))}
          </div>

          <h3>Pairing suggestion</h3>
          <div className="tagRow">
            {pairings.map((pairing) => (
              <span key={pairing}>{pairing}</span>
            ))}
          </div>

          {item.source_url ? (
            <a className="sourceLink" href={item.source_url} target="_blank" rel="noreferrer">
              View online source
            </a>
          ) : null}

          <div className="detailCart">
            <div className="stepper">
              <button aria-label={`Remove ${item.name}`} onClick={onRemove}>-</button>
              <span>{quantity}</span>
              <button aria-label={`Add ${item.name}`} onClick={onAdd}>+</button>
            </div>
            <button className="primaryButton" onClick={onAdd}>Add to order</button>
          </div>
        </div>
      </div>
    </section>
  );
}
