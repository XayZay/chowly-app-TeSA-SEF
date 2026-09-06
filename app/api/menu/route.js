import { json, query, serverError } from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnavailable = searchParams.get("all") === "1";
    const { rows } = await query(
      `
      select
        id,
        name,
        price,
        prep_time_minutes,
        category,
        is_available,
        description,
        image_url,
        source_url,
        calories,
        rating,
        ingredients,
        allergens,
        pairings
      from menu_item
      ${includeUnavailable ? "" : "where is_available = true"}
      order by category, name
      `
    );

    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const prepTime = Number(body.prepTimeMinutes);
    const category = body.category;

    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(prepTime) || prepTime <= 0) {
      return json({ error: "Name, positive price, and positive prep time are required." }, 400);
    }

    if (!["food", "drink"].includes(category)) {
      return json({ error: "Category must be food or drink." }, 400);
    }

    const { rows } = await query(
      `
      insert into menu_item (name, price, prep_time_minutes, category, is_available, description, image_url, source_url, calories, rating)
      values ($1, $2, $3, $4, true, $5, $6, $7, $8, $9)
      returning id, name, price, prep_time_minutes, category, is_available, description, image_url, source_url, calories, rating, ingredients, allergens, pairings
      `,
      [
        name,
        price,
        prepTime,
        category,
        body.description || "Freshly prepared Chowly menu item.",
        body.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        body.sourceUrl || "",
        Number(body.calories) || null,
        Number(body.rating) || 4.6
      ]
    );

    return json(rows[0], 201);
  } catch (error) {
    return serverError(error);
  }
}
