export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;

  if (request.method === 'PUT') {
    const item = await request.json();
    await env.DB.prepare(`
      UPDATE items SET
        type=?, image_key=?, category=?, seller=?, name=?, price=?, date=?,
        reason=?, purchase_reason=?, priority=?, frequency=?, usage_logs=?
      WHERE id=?
    `).bind(
      item.type, item.image_key || null, item.category || null,
      item.seller || null, item.name || '', item.price ?? null, item.date || null,
      item.reason || null, item.purchaseReason || null,
      item.priority ?? null, item.frequency ?? null,
      item.usageLogs ? JSON.stringify(item.usageLogs) : null,
      id
    ).run();
    return Response.json({ ok: true });
  }

  if (request.method === 'DELETE') {
    const row = await env.DB.prepare('SELECT image_key FROM items WHERE id=?').bind(id).first();
    if (row?.image_key) {
      await env.IMAGES.delete(row.image_key).catch(() => {});
    }
    await env.DB.prepare('DELETE FROM items WHERE id=?').bind(id).run();
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
