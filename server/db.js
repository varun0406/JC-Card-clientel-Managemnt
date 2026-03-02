import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'cards.db');

let db = null;

function saveDb() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      writeFileSync(dbPath, buffer);
    } catch (e) {
      console.warn('Could not persist db:', e.message);
    }
  }
}

export async function init() {
  const SQL = await initSqlJs();
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      firm_name TEXT,
      person_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      metadata TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS card_images (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      image_data TEXT,
      mime_type TEXT,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `);

  try {
    db.run(`CREATE INDEX idx_cards_search ON cards(firm_name, person_name, email)`);
  } catch (_) {}
  try {
    db.run(`CREATE INDEX idx_card_images_card_id ON card_images(card_id)`);
  } catch (_) {}

  saveDb();
}

function prepare(sql) {
  if (!db) throw new Error('DB not initialized. Call init() first.');
  const stmt = db.prepare(sql);
  return {
    run(...params) {
      stmt.bind(params);
      stmt.run();
      stmt.free();
      const changes = db.getRowsModified();
      saveDb();
      return { changes };
    },
    get(...params) {
      stmt.bind(params);
      const result = stmt.step() ? { ...stmt.getAsObject() } : undefined;
      stmt.free();
      return result;
    },
    all(...params) {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push({ ...stmt.getAsObject() });
      stmt.free();
      return rows;
    },
  };
}

export default { init, prepare };
