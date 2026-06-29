import { initSchema } from './_shared.js';

const DEFAULT_CATEGORIES = ['家雑貨', '美容', '仕事関連', 'ファッション', '食品'];

export async function onRequest(context) {
  const { request, env } = context;
  await initSchema(env.DB);

  if (request.method === 'GET') {
    const result = await env.DB.prepare(
      'SELECT name FROM categories ORDER BY position ASC'
    ).all();
    if (result.results.length === 0) {
      return Response.json(DEFAULT_CATEGORIES);
    }
    return Response.json(result.results.map(r => r.name));
  }

  if (request.method === 'PUT') {
    const cats = await request.json();
    await env.DB.prepare('DELETE FROM categories').run();
    if (cats.length > 0) {
      await env.DB.batch(
        cats.map((name, i) =>
          env.DB.prepare('INSERT INTO categories (position, name) VALUES (?, ?)').bind(i, name)
        )
      );
    }
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
