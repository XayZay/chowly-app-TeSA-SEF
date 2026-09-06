import { findAdmin, setAdminSession, verifyPassword } from "../../../../lib/admin-auth";
import { json, serverError } from "../../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const admin = await findAdmin(username);

    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return json({ error: "Invalid admin username or password." }, 401);
    }

    await setAdminSession(admin.username);
    return json({ ok: true, username: admin.username });
  } catch (error) {
    return serverError(error);
  }
}
