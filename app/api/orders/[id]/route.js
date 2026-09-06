import { getOrderById, isUuid, json, query, serverError, withTransaction } from "../../../../lib/db";

const allowedStatuses = new Set(["placed", "in_progress", "ready", "served"]);

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return json({ error: "Invalid order ID." }, 400);
    }

    const order = await getOrderById({ query }, id);
    if (!order) {
      return json({ error: "Order not found." }, 404);
    }

    return json(order);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return json({ error: "Invalid order ID." }, 400);
    }

    const body = await request.json();
    const fields = [];
    const values = [];
    const staffFields = [
      ["waiterId", "waiter_id"],
      ["chefId", "chef_id"],
      ["bartenderId", "bartender_id"]
    ];

    for (const [bodyKey, column] of staffFields) {
      if (bodyKey in body) {
        const value = body[bodyKey] || null;
        if (value && !isUuid(value)) {
          return json({ error: `${bodyKey} must be a valid UUID.` }, 400);
        }
        values.push(value);
        fields.push(`${column} = $${values.length}`);
      }
    }

    if ("status" in body) {
      if (!allowedStatuses.has(body.status)) {
        return json({ error: "Invalid order status." }, 400);
      }
      values.push(body.status);
      fields.push(`status = $${values.length}`);

      if (body.status === "served") {
        fields.push("served_at = coalesce(served_at, now())");
      }
    }

    if (fields.length === 0) {
      return json({ error: "No supported fields were provided." }, 400);
    }

    values.push(id);

    const order = await withTransaction(async (client) => {
      if ("status" in body && body.status !== "placed") {
        const orderLock = await client.query('select is_paid from "order" where id = $1 for update', [id]);
        if (orderLock.rowCount === 0) return null;
        if (!orderLock.rows[0].is_paid) {
          return { paymentRequired: true };
        }
      }

      const result = await client.query(
        `update "order" set ${fields.join(", ")} where id = $${values.length} returning id`,
        values
      );

      if (result.rowCount === 0) {
        return null;
      }

      return getOrderById(client, id);
    });

    if (!order) {
      return json({ error: "Order not found." }, 404);
    }

    if (order.paymentRequired) {
      return json({ error: "Payment is required before moving the order forward." }, 409);
    }

    return json(order);
  } catch (error) {
    return serverError(error);
  }
}
