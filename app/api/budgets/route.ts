import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { budgets, budgetRevisions, transactions, categories } from '@/drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);

    const result = await db
        .select()
        .from(budgets)
        .where(eq(budgets.companyId, companyId))
        .orderBy(desc(budgets.createdAt));

    // For each budget, compute actual spending from transactions
    const enriched = await Promise.all(
        result.map(async (budget: typeof result[number]) => {
            const conditions = [
                eq(transactions.companyId, companyId),
                eq(transactions.type, 'expense'),
                eq(transactions.status, 'confirmed'),
                gte(transactions.date, budget.periodStart),
                lte(transactions.date, budget.periodEnd),
            ];

            if (budget.categoryId) {
                conditions.push(eq(transactions.categoryId, budget.categoryId));
            }

            const [spent] = await db
                .select({ total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(12,2))), 0)` })
                .from(transactions)
                .where(and(...conditions));

            const actualSpent = parseFloat(spent?.total || '0');
            const planned = parseFloat(budget.plannedAmount);
            const percentage = planned > 0 ? (actualSpent / planned) * 100 : 0;

            return {
                ...budget,
                actualSpent,
                percentage: Math.round(percentage * 10) / 10,
                isOverBudget: percentage > 100,
                isWarning: percentage >= parseFloat(budget.alertThreshold || '80'),
            };
        })
    );

    return NextResponse.json({ budgets: enriched });
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const userId = Number(token.id);
    const body = await req.json();

    const { name, categoryId, plannedAmount, periodType, periodStart, periodEnd, alertThreshold, notes } = body;

    if (!name || !plannedAmount || !periodType || !periodStart || !periodEnd) {
        return NextResponse.json({ error: 'Campos obrigatórios: nome, valor, tipo de período, início e fim' }, { status: 400 });
    }

    const [newBudget] = await db
        .insert(budgets)
        .values({
            name,
            categoryId: categoryId || null,
            plannedAmount: String(plannedAmount),
            periodType,
            periodStart,
            periodEnd,
            alertThreshold: alertThreshold ? String(alertThreshold) : '80',
            notes: notes || null,
            companyId,
            createdBy: userId,
        })
        .returning();

    return NextResponse.json(newBudget, { status: 201 });
}
