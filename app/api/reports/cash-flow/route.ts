import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { transactions } from '@/drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);

    const url = new URL(req.url);
    const from = url.searchParams.get('from') || format(startOfMonth(new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)), 'yyyy-MM-dd');
    const to = url.searchParams.get('to') || format(endOfMonth(new Date()), 'yyyy-MM-dd');

    // 1. Fetch all transactions by month
    const results = await db.select({
        month: sql<string>`DATE_TRUNC('month', date)::text`,
        income: sql<string>`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)`,
        expense: sql<string>`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)`,
    })
        .from(transactions)
        .where(and(
            eq(transactions.companyId, companyId),
            gte(transactions.date, from),
            lte(transactions.date, to)
        ))
        .groupBy(sql`DATE_TRUNC('month', date)`)
        .orderBy(sql`DATE_TRUNC('month', date)`);

    // 2. Format for Recharts
    const data = results.map((r: any) => ({
        month: format(parseISO(r.month), 'MMM/yy'),
        receitas: parseFloat(r.income),
        despesas: parseFloat(r.expense),
        resultado: parseFloat(r.income) - parseFloat(r.expense),
    }));

    return NextResponse.json({ data });
}
