import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { transactions, categories } from '@/drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('[TX_DEBUG] Token:', { id: token.id, sub: token.sub, companyId: token.companyId, companyName: token.companyName });
    const companyId = Number(token.companyId);
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    const conditions = [eq(transactions.companyId, companyId)];
    if (type) conditions.push(eq(transactions.type, type));
    if (status) conditions.push(eq(transactions.status, status));
    if (categoryId) conditions.push(eq(transactions.categoryId, parseInt(categoryId)));
    if (from) conditions.push(gte(transactions.date, from));
    if (to) conditions.push(lte(transactions.date, to));

    const result = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(200);

    return NextResponse.json({ transactions: result });
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const userId = Number(token.id);
    const body = await req.json();

    const { description, amount, type, categoryId, date, paymentMethod, status, recurrence, recurrenceEnd, notes, contractId } = body;

    if (!description || !amount || !type || !date) {
        return NextResponse.json({ error: 'Campos obrigatórios: descrição, valor, tipo, data' }, { status: 400 });
    }

    const [newTransaction] = await db
        .insert(transactions)
        .values({
            description,
            amount: String(amount),
            type,
            categoryId: categoryId || null,
            date,
            paymentMethod: paymentMethod || null,
            status: status || 'confirmed',
            recurrence: recurrence || null,
            recurrenceEnd: recurrenceEnd || null,
            notes: notes || null,
            contractId: contractId || null,
            companyId,
            createdBy: userId,
        })
        .returning();

    return NextResponse.json(newTransaction, { status: 201 });
}
