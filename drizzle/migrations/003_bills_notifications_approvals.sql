-- Migration: Add bills, notifications, and approvals tables
-- Run this against your Neon database

-- Contas a Pagar/Receber
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'payable' | 'receivable'
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'open', -- 'open' | 'partial' | 'paid' | 'overdue' | 'cancelled'
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_date DATE,
    counterparty TEXT,
    category_id INTEGER REFERENCES categories(id),
    contract_id INTEGER REFERENCES contratos(id),
    payment_method TEXT,
    notes TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'bill_due' | 'budget_exceeded' | 'contract_expiring' | 'approval_required' | 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info' | 'warning' | 'critical'
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    related_id INTEGER,
    related_type TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Aprovações
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'expense' | 'petty_cash' | 'bill' | 'budget'
    related_id INTEGER NOT NULL,
    related_type TEXT NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(12,2),
    status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    notes TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_bills_company_status ON bills(company_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_company_user ON notifications(company_id, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_approvals_company_status ON approvals(company_id, status);
