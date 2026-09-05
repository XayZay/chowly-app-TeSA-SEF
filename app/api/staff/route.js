import { json, query, serverError } from "../../../lib/db";

export async function GET() {
  try {
    const [waiters, chefs, bartenders] = await Promise.all([
      query("select id, name from waiter order by name"),
      query("select id, name from chef order by name"),
      query("select id, name from bartender order by name")
    ]);

    return json({
      waiters: waiters.rows,
      chefs: chefs.rows,
      bartenders: bartenders.rows
    });
  } catch (error) {
    return serverError(error);
  }
}
