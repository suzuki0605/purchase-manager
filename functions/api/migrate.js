import { initSchema } from './_shared.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  await initSchema(env.DB);

  const { items = [], categories = [] } = await request.json();

  // Migrate categories
  if (categories.length > 0) {
    const existing = await env.DB.prepare('SELECT COUNT(*) as cnt FROM categories').first();
    if (existing.cnt === 0) {
      await env.DB.batch(
        categories.map((name, i) =>
          env.DB.prepare('INSERT INTO categories (position, name) VALUES (?, ?)').bind(i, name)
        )
      );
    }
  }

  // Migrate items
  for (const item of items) {
    const exists = await env.DB.prepare('SELECT id FROM items WHERE id=?').bind(item.id).first();
    if (exists) continue;

    let imageKey = null;

    // Upload base64 image to R2
    if (item.image && item.image.startsWith('data:')) {
      try {
        const match = item.image.match(/^data:(image\/\w+);base64,/);
        const mimeType = match ? match[1] : 'image/jpeg';
        const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
        imageKey = `${item.id}.${ext}`;

        const binary = atob(item.image.split(',')[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        await env.IMAGES.put(imageKey, bytes, { httpMetadata: { contentType: mimeType } });
      } catch (e) {
        imageKey = null;
      }
    }

    await env.DB.prepare(`
      INSERT OR IGNORE INTO items
        (id, type, image_key, category, seller, name, price, date, reason, purchase_reason, priority, frequency, usage_logs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      item.id, item.type, imageKey, item.category || null,
      item.seller || null, item.name || '', item.price ?? null, item.date || null,
      item.reason || null, item.purchaseReason || null,
      item.priority ?? null, item.frequency ?? null,
      item.usageLogs ? JSON.stringify(item.usageLogs) : null
    ).run();
  }

  return Response.json({ ok: true, migrated: items.length });
}
