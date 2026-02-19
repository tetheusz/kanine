import { pgTable, text, serial, integer } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    plan: text('plan').default('free'),
    createdAt: text('created_at').notNull(),
});

export const contracts = pgTable('contratos', {
    id: serial('id').primaryKey(),
    filename: text('nome_arquivo').notNull(),
    parties: text('partes'),
    signatureDate: text('data_assinatura'),
    expiryDate: text('data_vencimento'),
    value: text('valor_contrato'),
    cancellationClauses: text('clausulas_cancelamento'),
    summary: text('resumo'),
    extractionMethod: text('extraction_method'),
    rawText: text('texto_bruto'),
    fileKey: text('file_key'),
    companyId: integer('company_id').references(() => companies.id),
    createdAt: text('data_upload').notNull(),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    companyId: integer('company_id').references(() => companies.id),
    createdAt: text('created_at').notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
