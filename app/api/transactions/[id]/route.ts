import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { transactions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = Number(token.companyId);
    const body = await req.json();

    const [updated] = await db
        .update(transactions)
        .set({
            description: body.description,
            amount: body.amount ? String(body.amount) : undefined,
            type: body.type,
            categoryId: body.categoryId,
            date: body.date,
            paymentMethod: body.paymentMethod,
            status: body.status,
            notes: body.notes,
            updatedAt: new Date(),
        })
        .where(and(eq(transactions.id, parseInt(id)), eq(transactions.companyId, companyId)))
        .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = Number(token.companyId);

    await db
        .delete(transactions)
        .where(and(eq(transactions.id, parseInt(id)), eq(transactions.companyId, companyId)));

    return NextResponse.json({ success: true });
}
