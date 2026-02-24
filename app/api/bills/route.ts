import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { bills } from '@/drizzle/schema';
import { eq, and, desc, sql, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);

    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'payable' | 'receivable'
    const status = url.searchParams.get('status'); // 'open' | 'paid' | 'overdue'

    let conditions = [eq(bills.companyId, companyId)];
    if (type) conditions.push(eq(bills.type, type));
    if (status === 'overdue') {
        conditions.push(eq(bills.status, 'open'));
        conditions.push(lte(bills.dueDate, new Date().toISOString().split('T')[0]));
    } else if (status) {
        conditions.push(eq(bills.status, status));
    }

    const result = await db.select().from(bills).where(and(...conditions)).orderBy(desc(bills.dueDate));
    return NextResponse.json({ bills: result });
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);
    const userId = Number(token.id);

    const body = await req.json();
    const { title, amount, type, dueDate, counterparty, categoryId, contractId, paymentMethod, notes } = body;

    if (!title || !amount || !type || !dueDate) {
        return NextResponse.json({ error: 'Campos obrigatórios: title, amount, type, dueDate' }, { status: 400 });
    }

    const [bill] = await db.insert(bills).values({
        title, amount: String(amount), type, dueDate,
        counterparty: counterparty || null,
        categoryId: categoryId || null,
        contractId: contractId || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        companyId, createdBy: userId,
    }).returning();

    return NextResponse.json({ bill }, { status: 201 });
}
