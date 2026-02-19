import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as schemaSqlite from '../drizzle/schema';
import * as schemaPg from '../drizzle/schema.pg';

dotenv.config();

let db: any;
let sqlite: any;

// Check if we are using Neon (Postgres)
const isNeon = !!process.env.DATABASE_URL;

if (isNeon) {
  const connectionString = process.env.DATABASE_URL!;
  const sslUrl = connectionString.includes('sslmode') ? connectionString : `${connectionString}?sslmode=require`;
  const client = neon(sslUrl);
  db = drizzleNeon(client, { schema: schemaPg });
} else {
  // Local SQLite fallback - Lazy load to avoid Vercel Serverless crashes
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');

  sqlite = new Database('contractmind.db');
  db = drizzle(sqlite, { schema: schemaSqlite });
}

export { db };

// Initialize database (create tables if they don't exist)
// Note: For Neon, we rely on Drizzle Kit migrations (npm run db:push)
export async function initDb() {
  if (isNeon) {
    console.log("Using Neon (PostgreSQL). Please run 'npx drizzle-kit push' to update schema.");
    return;
  }

  // Local SQLite initialization
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      created_at TEXT NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_arquivo TEXT NOT NULL,
      partes TEXT,
      data_assinatura TEXT,
      data_vencimento TEXT,
      valor_contrato TEXT,
      clausulas_cancelamento TEXT,
      resumo TEXT,
      extraction_method TEXT,
      texto_bruto TEXT,
      company_id INTEGER,
      data_upload TEXT NOT NULL,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    )
  `);

  // Users table for authentication
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      company_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    )
  `);

  // Migrations for existing DBs
  try {
    sqlite.exec(`ALTER TABLE contratos ADD COLUMN texto_bruto TEXT`);
  } catch { }

  try {
    sqlite.exec(`ALTER TABLE contratos ADD COLUMN company_id INTEGER REFERENCES companies(id)`);
  } catch { }

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id)`);
  } catch { }

  try {
    sqlite.exec(`ALTER TABLE contratos ADD COLUMN file_key TEXT`);
  } catch { }
}


// Call on startup ONLY for local
if (!isNeon) {
  initDb();
}
