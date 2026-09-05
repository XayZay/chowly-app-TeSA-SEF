import { getOrderById, isUuid, json, serverError, withTransaction } from "../../../../../lib/db";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return json({ error: "Invalid order ID." }, 400);
    }

    const body = await request.json();
    const score = Number(body.score);
    const comment = body.comment ? String(body.comment).trim() : null;

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return json({ error: "Rating score must be an integer from 1 to 5." }, 400);
    }

    const rating = await withTransaction(async (client) => {
      const order = await getOrderById(client, id);
      if (!order) return null;

      const result = await client.query(
        `
        insert into rating (order_id, score, comment)
        values ($1, $2, $3)
        on conflict (order_id)
        do update set score = excluded.score, comment = excluded.comment, submitted_at = now()
        returning id, order_id, score, comment, submitted_at
        `,
        [id, score, comment]
      );

      return result.rows[0];
    });

    if (!rating) {
      return json({ error: "Order not found." }, 404);
    }

    return json(rating, 201);
  } catch (error) {
    return serverError(error);
  }
}
