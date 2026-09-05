import { getOrderById, json, query, serverError, withTransaction } from "../../../lib/db";

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const quantities = new Map();

  for (const item of items) {
    const menuItemId = item?.menuItemId;
    const quantity = Number(item?.quantity);

    if (!menuItemId || !Number.isInteger(quantity) || quantity <= 0) {
      return null;
    }

    quantities.set(menuItemId, (quantities.get(menuItemId) || 0) + quantity);
  }

  return Array.from(quantities, ([menuItemId, quantity]) => ({ menuItemId, quantity }));
}

export async function GET() {
  try {
    const { rows } = await query(
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
              'name', mi.name,
              'category', mi.category,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price
            )
            order by mi.name
          ) filter (where oi.id is not null),
          '[]'::json
        ) as items
      from "order" o
      left join waiter w on w.id = o.waiter_id
      left join chef c on c.id = o.chef_id
      left join bartender b on b.id = o.bartender_id
      left join order_item oi on oi.order_id = o.id
      left join menu_item mi on mi.id = oi.menu_item_id
      group by o.id, w.name, c.name, b.name
      order by o.placed_at desc
      `
    );

    return json(rows.map((row) => ({ ...row, total: Number(row.total || 0), items: row.items || [] })));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const items = normalizeItems(body.items);

    if (!items) {
      return json({ error: "Order must include at least one valid item quantity." }, 400);
    }

    const order = await withTransaction(async (client) => {
      const ids = items.map((item) => item.menuItemId);
      const menuResult = await client.query(
        `
        select id, price, prep_time_minutes
        from menu_item
        where id = any($1::uuid[]) and is_available = true
        `,
        [ids]
      );

      if (menuResult.rowCount !== ids.length) {
        return { stale: true };
      }

      const menuById = new Map(menuResult.rows.map((item) => [item.id, item]));
      const waitTime = Math.max(...menuResult.rows.map((item) => item.prep_time_minutes));
      const orderResult = await client.query(
        'insert into "order" (wait_time_minutes) values ($1) returning id',
        [waitTime]
      );
      const orderId = orderResult.rows[0].id;

      for (const item of items) {
        const menuItem = menuById.get(item.menuItemId);
        await client.query(
          `
          insert into order_item (order_id, menu_item_id, quantity, unit_price)
          values ($1, $2, $3, $4)
          `,
          [orderId, item.menuItemId, item.quantity, menuItem.price]
        );
      }

      return getOrderById(client, orderId);
    });

    if (order.stale) {
      return json({ error: "One or more menu items are no longer available. Please refresh the menu." }, 400);
    }

    return json(order, 201);
  } catch (error) {
    return serverError(error);
  }
}
