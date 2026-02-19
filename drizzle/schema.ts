import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import * as schemaPg from './schema.pg';

// Decide which schema to export based on environment
const isPostgres = !!process.env.DATABASE_URL;

// --- SQLite Definitions (Legacy/Local) ---
const companiesSqlite = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  plan: text('plan').default('free'), // free, pro, enterprise
  createdAt: text('created_at').notNull(),
});

const contractsSqlite = sqliteTable('contratos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('nome_arquivo').notNull(),
  parties: text('partes'),
  signatureDate: text('data_assinatura'),
  expiryDate: text('data_vencimento'),
  value: text('valor_contrato'),
  cancellationClauses: text('clausulas_cancelamento'),
  summary: text('resumo'),
  extractionMethod: text('extraction_method'),
  rawText: text('texto_bruto'),
  fileKey: text('file_key'), // S3/R2 Key
  companyId: integer('company_id').references(() => companiesSqlite.id), // Multi-tenancy
  createdAt: text('data_upload').notNull(),
});

const usersSqlite = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  companyId: integer('company_id').references(() => companiesSqlite.id), // Multi-tenancy
  createdAt: text('created_at').notNull(),
});

// Export the correct one
export const companies = isPostgres ? schemaPg.companies : companiesSqlite;
export const contracts = isPostgres ? schemaPg.contracts : contractsSqlite;
export const users = isPostgres ? schemaPg.users : usersSqlite;

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
