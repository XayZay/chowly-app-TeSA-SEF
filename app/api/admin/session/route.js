import { clearAdminSession, isAdminAuthenticated } from "../../../../lib/admin-auth";
import { json, serverError } from "../../../../lib/db";

export async function GET() {
  try {
    return json({ authenticated: await isAdminAuthenticated() });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE() {
  try {
    await clearAdminSession();
    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
