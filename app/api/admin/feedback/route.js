import { requireAdmin } from "../../../../lib/admin-auth";
import { getFeedbackOrders, json, query, serverError } from "../../../../lib/db";

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    return json(await getFeedbackOrders({ query }));
  } catch (error) {
    return serverError(error);
  }
}
