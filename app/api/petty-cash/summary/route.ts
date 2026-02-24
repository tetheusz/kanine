import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { pettyCash, pettyCashFund } from '@/drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);

    // Current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Monthly spending
    const [monthlyResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${pettyCash.amount} AS DECIMAL(10,2))), 0)` })
        .from(pettyCash)
        .where(and(
            eq(pettyCash.companyId, companyId),
            gte(pettyCash.date, monthStart),
            lte(pettyCash.date, monthEnd),
        ));

    // Pending count
    const [pendingResult] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(pettyCash)
        .where(and(eq(pettyCash.companyId, companyId), eq(pettyCash.status, 'pending')));

    // Fund status
    let fund = await db.select().from(pettyCashFund).where(eq(pettyCashFund.companyId, companyId));

    // Auto-create fund if none exists
    if (fund.length === 0) {
        await db.insert(pettyCashFund).values({
            name: 'Caixa Principal',
            initialAmount: '500',
            currentAmount: '500',
            replenishThreshold: '100',
            companyId,
        });
        fund = await db.select().from(pettyCashFund).where(eq(pettyCashFund.companyId, companyId));
    }

    return NextResponse.json({
        monthlySpending: parseFloat(monthlyResult?.total || '0'),
        pendingCount: parseInt(pendingResult?.count || '0'),
        fund: fund[0],
    });
}
