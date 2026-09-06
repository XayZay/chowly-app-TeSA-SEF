import { isUuid, json, query, serverError } from "../../../../lib/db";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return json({ error: "Invalid menu item ID." }, 400);
    }

    const body = await request.json();
    const updates = [];
    const values = [];

    if ("name" in body) {
      const name = String(body.name || "").trim();
      if (!name) return json({ error: "Name is required." }, 400);
      values.push(name);
      updates.push(`name = $${values.length}`);
    }

    if ("price" in body) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return json({ error: "Price must be positive." }, 400);
      values.push(price);
      updates.push(`price = $${values.length}`);
    }

    if ("prepTimeMinutes" in body) {
      const prepTime = Number(body.prepTimeMinutes);
      if (!Number.isInteger(prepTime) || prepTime <= 0) return json({ error: "Prep time must be a positive integer." }, 400);
      values.push(prepTime);
      updates.push(`prep_time_minutes = $${values.length}`);
    }

    if ("category" in body) {
      if (!["food", "drink"].includes(body.category)) return json({ error: "Category must be food or drink." }, 400);
      values.push(body.category);
      updates.push(`category = $${values.length}`);
    }

    if ("isAvailable" in body) {
      values.push(Boolean(body.isAvailable));
      updates.push(`is_available = $${values.length}`);
    }

    if (updates.length === 0) {
      return json({ error: "No supported fields were provided." }, 400);
    }

    values.push(id);
    const { rows } = await query(
      `
      update menu_item
      set ${updates.join(", ")}
      where id = $${values.length}
      returning id, name, price, prep_time_minutes, category, is_available
      `,
      values
    );

    if (!rows[0]) {
      return json({ error: "Menu item not found." }, 404);
    }

    return json(rows[0]);
  } catch (error) {
    return serverError(error);
  }
}
