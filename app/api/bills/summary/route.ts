import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { bills } from '@/drizzle/schema';
import { eq, and, sql, lte, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);
    const today = new Date().toISOString().split('T')[0];
    const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const [totalPayable] = await db.select({ sum: sql<string>`COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0)` })
        .from(bills).where(and(eq(bills.companyId, companyId), eq(bills.type, 'payable'), eq(bills.status, 'open')));

    const [totalReceivable] = await db.select({ sum: sql<string>`COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0)` })
        .from(bills).where(and(eq(bills.companyId, companyId), eq(bills.type, 'receivable'), eq(bills.status, 'open')));

    const [overdue] = await db.select({ count: sql<string>`COUNT(*)`, sum: sql<string>`COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0)` })
        .from(bills).where(and(eq(bills.companyId, companyId), eq(bills.status, 'open'), lte(bills.dueDate, today)));

    const [dueSoon] = await db.select({ count: sql<string>`COUNT(*)` })
        .from(bills).where(and(eq(bills.companyId, companyId), eq(bills.status, 'open'), gte(bills.dueDate, today), lte(bills.dueDate, in7days)));

    return NextResponse.json({
        totalPayable: parseFloat(totalPayable?.sum || '0'),
        totalReceivable: parseFloat(totalReceivable?.sum || '0'),
        overdueCount: parseInt(overdue?.count || '0'),
        overdueAmount: parseFloat(overdue?.sum || '0'),
        dueSoonCount: parseInt(dueSoon?.count || '0'),
    });
}
