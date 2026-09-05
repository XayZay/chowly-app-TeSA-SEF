import { getOrderById, isUuid, json, serverError, withTransaction } from "../../../../../lib/db";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return json({ error: "Invalid order ID." }, 400);
    }

    const body = await request.json();
    const description = String(body.description || "").trim();

    if (!description) {
      return json({ error: "Complaint description is required." }, 400);
    }

    const result = await withTransaction(async (client) => {
      const order = await getOrderById(client, id);
      if (!order) return null;

      const complaint = await client.query(
        "insert into complaint (order_id, description) values ($1, $2) returning id, description, status, submitted_at",
        [id, description]
      );

      return complaint.rows[0];
    });

    if (!result) {
      return json({ error: "Order not found." }, 404);
    }

    return json(result, 201);
  } catch (error) {
    return serverError(error);
  }
}
