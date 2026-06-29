import { initSchema, itemFromRow } from './_shared.js';

export async function onRequest(context) {
  const { request, env } = context;
  await initSchema(env.DB);

  if (request.method === 'GET') {
    const result = await env.DB.prepare(
      'SELECT * FROM items ORDER BY created_at DESC'
    ).all();
    return Response.json(result.results.map(itemFromRow));
  }

  if (request.method === 'POST') {
    const item = await request.json();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO items
        (id, type, image_key, category, seller, name, price, date, reason, purchase_reason, priority, frequency, usage_logs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      item.id, item.type, item.image_key || null, item.category || null,
      item.seller || null, item.name || '', item.price ?? null, item.date || null,
      item.reason || null, item.purchaseReason || null,
      item.priority ?? null, item.frequency ?? null,
      item.usageLogs ? JSON.stringify(item.usageLogs) : null
    ).run();
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
