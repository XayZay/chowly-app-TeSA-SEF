import pg from "pg";

const { Pool } = pg;

let pool;

const transientDbCodes = new Set(["EAI_AGAIN", "ECONNRESET", "ETIMEDOUT", "57P01", "08006"]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run chowly-schema.sql on Postgres and add DATABASE_URL to .env.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 5,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    });
  }

  return pool;
}

export async function query(text, params = []) {
  try {
    return await getPool().query(text, params);
  } catch (error) {
    if (!transientDbCodes.has(error.code)) throw error;
    await delay(700);
    return getPool().query(text, params);
  }
}

export async function withTransaction(callback) {
  let client;

  try {
    client = await getPool().connect();
  } catch (error) {
    if (!transientDbCodes.has(error.code)) throw error;
    await delay(700);
    client = await getPool().connect();
  }

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getFeedbackOrders(client) {
  const { rows } = await client.query(
    `
    select
      o.id,
      o.status,
      o.is_paid,
      o.placed_at,
      o.served_at,
      o.wait_time_minutes,
      w.name as waiter_name,
      c.name as chef_name,
      b.name as bartender_name,
      coalesce(sum(oi.unit_price * oi.quantity), 0)::numeric(10,2) as total,
      coalesce(
        json_agg(
          json_build_object(
            'id', oi.id,
            'menuItemId', mi.id,
            'name', mi.name,
            'category', mi.category,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price
          )
          order by mi.name
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', complaint.id,
              'description', complaint.description,
              'status', complaint.status,
              'submittedAt', complaint.submitted_at
            )
            order by complaint.submitted_at desc
          )
          from complaint
          where complaint.order_id = o.id
        ),
        '[]'::json
      ) as complaints,
      (
        select json_build_object(
          'id', rating.id,
          'score', rating.score,
          'comment', rating.comment,
          'submittedAt', rating.submitted_at
        )
        from rating
        where rating.order_id = o.id
      ) as rating
    from "order" o
    left join waiter w on w.id = o.waiter_id
    left join chef c on c.id = o.chef_id
    left join bartender b on b.id = o.bartender_id
    left join order_item oi on oi.order_id = o.id
    left join menu_item mi on mi.id = oi.menu_item_id
    where exists (select 1 from complaint where complaint.order_id = o.id)
       or exists (select 1 from rating where rating.order_id = o.id)
    group by o.id, w.name, c.name, b.name
    order by greatest(
      coalesce((select max(complaint.submitted_at) from complaint where complaint.order_id = o.id), o.placed_at),
      coalesce((select rating.submitted_at from rating where rating.order_id = o.id), o.placed_at)
    ) desc
    `
  );

  return rows.map(normalizeOrder);
}

export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function serverError(error) {
  console.error(error);
  if (["ENOTFOUND", "EAI_AGAIN"].includes(error.code)) {
    return json(
      {
        error:
          "Database host could not be resolved. Check the Supabase pooler host in DATABASE_URL or try again when DNS/network access is available."
      },
      500
    );
  }
  return json({ error: error.message || "Something went wrong" }, 500);
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeOrder(row) {
  if (!row) return null;

  return {
    ...row,
    total: Number(row.total || 0),
    items: row.items || [],
    complaints: row.complaints || [],
    rating: row.rating || null,
    payment: row.payment || null
  };
}

export async function getOrderById(client, id) {
  const { rows } = await client.query(
    `
    select
      o.id,
      o.status,
      o.wait_time_minutes,
      o.is_paid,
      o.placed_at,
      o.served_at,
      o.waiter_id,
      o.chef_id,
      o.bartender_id,
      w.name as waiter_name,
      c.name as chef_name,
      b.name as bartender_name,
      coalesce(sum(oi.unit_price * oi.quantity), 0)::numeric(10,2) as total,
      coalesce(
        json_agg(
          json_build_object(
            'id', oi.id,
            'menuItemId', mi.id,
            'name', mi.name,
            'category', mi.category,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'prepTimeMinutes', mi.prep_time_minutes
          )
          order by mi.name
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', complaint.id,
              'description', complaint.description,
              'status', complaint.status,
              'submittedAt', complaint.submitted_at
            )
            order by complaint.submitted_at desc
          )
          from complaint
          where complaint.order_id = o.id
        ),
        '[]'::json
      ) as complaints,
      (
        select json_build_object(
          'id', rating.id,
          'score', rating.score,
          'comment', rating.comment,
          'submittedAt', rating.submitted_at
        )
        from rating
        where rating.order_id = o.id
      ) as rating,
      (
        select json_build_object(
          'id', payment.id,
          'amount', payment.amount,
          'isPretend', payment.is_pretend,
          'paidAt', payment.paid_at
        )
        from payment
        where payment.order_id = o.id
      ) as payment
    from "order" o
    left join waiter w on w.id = o.waiter_id
    left join chef c on c.id = o.chef_id
    left join bartender b on b.id = o.bartender_id
    left join order_item oi on oi.order_id = o.id
    left join menu_item mi on mi.id = oi.menu_item_id
    where o.id = $1
    group by o.id, w.name, c.name, b.name
    `,
    [id]
  );

  return normalizeOrder(rows[0]);
}
