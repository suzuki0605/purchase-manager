export async function initSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      image_key TEXT,
      category TEXT,
      seller TEXT,
      name TEXT NOT NULL DEFAULT '',
      price INTEGER,
      date TEXT,
      reason TEXT,
      purchase_reason TEXT,
      priority INTEGER,
      frequency INTEGER,
      usage_logs TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
      position INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `).run();
}

export function itemFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    image_key: row.image_key || null,
    category: row.category || null,
    seller: row.seller || null,
    name: row.name,
    price: row.price ?? null,
    date: row.date || null,
    reason: row.reason || null,
    purchaseReason: row.purchase_reason || null,
    priority: row.priority ?? null,
    frequency: row.frequency ?? null,
    usageLogs: row.usage_logs ? JSON.parse(row.usage_logs) : [],
  };
}

export function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
