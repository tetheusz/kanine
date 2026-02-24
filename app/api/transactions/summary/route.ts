import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { transactions } from '@/drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const { searchParams } = new URL(req.url);

    // Default: current month
    const now = new Date();
    const from = searchParams.get('from') || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const conditions = [
        eq(transactions.companyId, companyId),
        eq(transactions.status, 'confirmed'),
        gte(transactions.date, from),
        lte(transactions.date, to),
    ];

    // Total income
    const [incomeResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(12,2))), 0)` })
        .from(transactions)
        .where(and(...conditions, eq(transactions.type, 'income')));

    // Total expense
    const [expenseResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(12,2))), 0)` })
        .from(transactions)
        .where(and(...conditions, eq(transactions.type, 'expense')));

    // All-time balance
    const [balanceResult] = await db
        .select({
            income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amount} AS DECIMAL(12,2)) ELSE 0 END), 0)`,
            expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amount} AS DECIMAL(12,2)) ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(and(eq(transactions.companyId, companyId), eq(transactions.status, 'confirmed')));

    const totalIncome = parseFloat(incomeResult?.total || '0');
    const totalExpense = parseFloat(expenseResult?.total || '0');
    const allTimeIncome = parseFloat(balanceResult?.income || '0');
    const allTimeExpense = parseFloat(balanceResult?.expense || '0');

    return NextResponse.json({
        period: { from, to },
        monthlyIncome: totalIncome,
        monthlyExpense: totalExpense,
        monthlyBalance: totalIncome - totalExpense,
        allTimeBalance: allTimeIncome - allTimeExpense,
    });
}
