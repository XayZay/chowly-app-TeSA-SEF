import { getOrderById, isUuid, json, serverError, withTransaction } from "../../../../../lib/db";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return json({ error: "Invalid order ID." }, 400);
    }

    const payment = await withTransaction(async (client) => {
      const orderLock = await client.query('select id, is_paid from "order" where id = $1 for update', [id]);
      if (orderLock.rowCount === 0) return null;

      const existing = await client.query("select id, order_id, amount, is_pretend, paid_at from payment where order_id = $1", [id]);
      if (existing.rowCount > 0) {
        return existing.rows[0];
      }

      const amountResult = await client.query(
        "select coalesce(sum(unit_price * quantity), 0)::numeric(10,2) as amount from order_item where order_id = $1",
        [id]
      );
      const amount = amountResult.rows[0].amount;

      const result = await client.query(
        "insert into payment (order_id, amount, is_pretend) values ($1, $2, true) returning id, order_id, amount, is_pretend, paid_at",
        [id, amount]
      );

      await client.query('update "order" set is_paid = true where id = $1', [id]);

      return result.rows[0];
    });

    if (!payment) {
      return json({ error: "Order not found." }, 404);
    }

    return json(payment, 201);
  } catch (error) {
    return serverError(error);
  }
}
