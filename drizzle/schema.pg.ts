import { pgTable, text, serial, integer, decimal, date, boolean, timestamp } from 'drizzle-orm/pg-core';

// ==========================================
// CORE TABLES (EXISTING — DO NOT MODIFY STRUCTURE)
// ==========================================

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
    role: text('role').default('user'), // 'user' | 'manager' | 'admin'
    companyId: integer('company_id').references(() => companies.id),
    createdAt: text('created_at').notNull(),
});

// ==========================================
// MODULE: FLUXO DE CAIXA (Cash Flow)
// ==========================================

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'income' | 'expense'
    color: text('color').default('#6B7280'),
    icon: text('icon').default('circle'),
    isSystem: boolean('is_system').default(false),
    companyId: integer('company_id').references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    type: text('type').notNull(), // 'income' | 'expense'
    categoryId: integer('category_id').references(() => categories.id),
    date: date('date').notNull(),
    paymentMethod: text('payment_method'), // 'pix', 'boleto', 'cartao', 'dinheiro', 'transferencia'
    status: text('status').default('confirmed'), // 'pending' | 'confirmed' | 'cancelled'
    recurrence: text('recurrence'), // null, 'monthly', 'weekly', 'yearly'
    recurrenceEnd: date('recurrence_end'),
    notes: text('notes'),
    attachmentKey: text('attachment_key'), // R2 reference
    contractId: integer('contract_id').references(() => contracts.id),
    companyId: integer('company_id').notNull().references(() => companies.id),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bankAccounts = pgTable('bank_accounts', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    bankName: text('bank_name'),
    accountType: text('account_type').default('checking'), // 'checking' | 'savings' | 'credit'
    initialBalance: decimal('initial_balance', { precision: 12, scale: 2 }).default('0'),
    currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).default('0'),
    isActive: boolean('is_active').default(true),
    companyId: integer('company_id').references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// MODULE: GESTÃO ORÇAMENTÁRIA (Budget)
// ==========================================

export const budgets = pgTable('budgets', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    plannedAmount: decimal('planned_amount', { precision: 12, scale: 2 }).notNull(),
    periodType: text('period_type').notNull(), // 'monthly' | 'quarterly' | 'yearly'
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }).default('80'),
    notes: text('notes'),
    companyId: integer('company_id').notNull().references(() => companies.id),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});

export const budgetRevisions = pgTable('budget_revisions', {
    id: serial('id').primaryKey(),
    budgetId: integer('budget_id').references(() => budgets.id),
    previousAmount: decimal('previous_amount', { precision: 12, scale: 2 }),
    newAmount: decimal('new_amount', { precision: 12, scale: 2 }),
    reason: text('reason'),
    revisedBy: integer('revised_by').references(() => users.id),
    revisedAt: timestamp('revised_at').defaultNow(),
});

// ==========================================
// MODULE: PEQUENAS DESPESAS (Petty Cash)
// ==========================================

export const pettyCash = pgTable('petty_cash', {
    id: serial('id').primaryKey(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: text('category').default('geral'), // 'alimentacao' | 'transporte' | 'escritorio' | 'outros'
    date: date('date').notNull(),
    paidBy: text('paid_by'),
    receiptKey: text('receipt_key'), // R2 reference
    status: text('status').default('pending'), // 'pending' | 'approved' | 'rejected' | 'reimbursed'
    approvedBy: integer('approved_by').references(() => users.id),
    notes: text('notes'),
    companyId: integer('company_id').notNull().references(() => companies.id),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});

export const pettyCashFund = pgTable('petty_cash_fund', {
    id: serial('id').primaryKey(),
    name: text('name').default('Caixa Principal'),
    initialAmount: decimal('initial_amount', { precision: 10, scale: 2 }).notNull(),
    currentAmount: decimal('current_amount', { precision: 10, scale: 2 }).notNull(),
    replenishThreshold: decimal('replenish_threshold', { precision: 10, scale: 2 }).default('100'),
    companyId: integer('company_id').notNull().references(() => companies.id),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// MODULE: CHATBOT K9
// ==========================================

export const chatMessages = pgTable('chat_messages', {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    contextType: text('context_type'), // 'contract' | 'cashflow' | 'budget' | 'general'
    contextId: integer('context_id'),
    companyId: integer('company_id').notNull().references(() => companies.id),
    userId: integer('user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// MODULE: CONTAS A PAGAR/RECEBER (Bills)
// ==========================================

export const bills = pgTable('bills', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    type: text('type').notNull(), // 'payable' | 'receivable'
    dueDate: date('due_date').notNull(),
    status: text('status').default('open'), // 'open' | 'partial' | 'paid' | 'overdue' | 'cancelled'
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
    paidDate: date('paid_date'),
    counterparty: text('counterparty'), // cliente ou fornecedor
    categoryId: integer('category_id').references(() => categories.id),
    contractId: integer('contract_id').references(() => contracts.id),
    paymentMethod: text('payment_method'),
    notes: text('notes'),
    companyId: integer('company_id').notNull().references(() => companies.id),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// MODULE: NOTIFICAÇÕES (Notifications)
// ==========================================

export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    type: text('type').notNull(), // 'bill_due' | 'budget_exceeded' | 'contract_expiring' | 'approval_required' | 'system'
    title: text('title').notNull(),
    message: text('message').notNull(),
    severity: text('severity').default('info'), // 'info' | 'warning' | 'critical'
    isRead: boolean('is_read').default(false),
    actionUrl: text('action_url'),
    relatedId: integer('related_id'),
    relatedType: text('related_type'), // 'bill' | 'budget' | 'contract' | 'approval'
    companyId: integer('company_id').notNull().references(() => companies.id),
    userId: integer('user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// MODULE: APROVAÇÕES (Approvals)
// ==========================================

export const approvals = pgTable('approvals', {
    id: serial('id').primaryKey(),
    type: text('type').notNull(), // 'expense' | 'petty_cash' | 'bill' | 'budget'
    relatedId: integer('related_id').notNull(),
    relatedType: text('related_type').notNull(), // table reference
    title: text('title').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }),
    status: text('status').default('pending'), // 'pending' | 'approved' | 'rejected'
    requestedBy: integer('requested_by').references(() => users.id),
    approvedBy: integer('approved_by').references(() => users.id),
    requestedAt: timestamp('requested_at').defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    notes: text('notes'),
    companyId: integer('company_id').notNull().references(() => companies.id),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetRevision = typeof budgetRevisions.$inferSelect;
export type PettyCashEntry = typeof pettyCash.$inferSelect;
export type NewPettyCashEntry = typeof pettyCash.$inferInsert;
export type PettyCashFundEntry = typeof pettyCashFund.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;

