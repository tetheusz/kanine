import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { pettyCash, pettyCashFund, users } from '@/drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const conditions = [eq(pettyCash.companyId, companyId)];
    if (status) conditions.push(eq(pettyCash.status, status));
    if (from) conditions.push(gte(pettyCash.date, from));
    if (to) conditions.push(lte(pettyCash.date, to));

    const result = await db
        .select()
        .from(pettyCash)
        .where(and(...conditions))
        .orderBy(desc(pettyCash.createdAt))
        .limit(200);

    return NextResponse.json({ expenses: result });
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const userId = Number(token.id);
    const body = await req.json();

    const { description, amount, category, date, paidBy, notes } = body;

    if (!description || !amount) {
        return NextResponse.json({ error: 'Descrição e valor são obrigatórios' }, { status: 400 });
    }

    const [entry] = await db
        .insert(pettyCash)
        .values({
            description,
            amount: String(amount),
            category: category || 'geral',
            date: date || new Date().toISOString().split('T')[0],
            paidBy: paidBy || null,
            notes: notes || null,
            status: 'pending',
            companyId,
            createdBy: userId,
        })
        .returning();

    // Subtract from fund
    await db
        .update(pettyCashFund)
        .set({
            currentAmount: sql`CAST(${pettyCashFund.currentAmount} AS DECIMAL(10,2)) - ${parseFloat(String(amount))}`,
            updatedAt: new Date(),
        })
        .where(eq(pettyCashFund.companyId, companyId));

    return NextResponse.json(entry, { status: 201 });
}
