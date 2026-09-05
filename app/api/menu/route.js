import { json, query, serverError } from "../../../lib/db";

export async function GET() {
  try {
    const { rows } = await query(
      `
      select id, name, price, prep_time_minutes, category
      from menu_item
      where is_available = true
      order by category, name
      `
    );

    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}
