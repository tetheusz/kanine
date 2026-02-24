import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { bills } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = await getToken({ req: _req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [bill] = await db.select().from(bills).where(and(eq(bills.id, Number(id)), eq(bills.companyId, Number(token.companyId))));
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ bill });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const updates: Record<string, any> = {};
    for (const key of ['title', 'amount', 'type', 'dueDate', 'status', 'paidAmount', 'paidDate', 'counterparty', 'paymentMethod', 'notes']) {
        if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key];
    }
    if (body.amount) updates.amount = String(body.amount);
    if (body.paidAmount) updates.paidAmount = String(body.paidAmount);

    const [updated] = await db.update(bills).set(updates).where(and(eq(bills.id, Number(id)), eq(bills.companyId, Number(token.companyId)))).returning();
    return NextResponse.json({ bill: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.delete(bills).where(and(eq(bills.id, Number(id)), eq(bills.companyId, Number(token.companyId))));
    return NextResponse.json({ success: true });
}
