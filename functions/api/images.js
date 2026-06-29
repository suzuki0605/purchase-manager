export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'POST') {
    const { base64, type } = await request.json();
    const ext = type === 'image/webp' ? 'webp' : 'jpg';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const dataStr = base64.split(',')[1];
    const binary = atob(dataStr);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    await env.IMAGES.put(key, bytes, {
      httpMetadata: { contentType: type },
    });

    return Response.json({ key });
  }

  return new Response('Method not allowed', { status: 405 });
}
