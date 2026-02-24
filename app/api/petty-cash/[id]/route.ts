import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { pettyCash, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = Number(token.companyId);
    const userId = Number(token.id);
    const userRole = (token.role as string) || 'user';
    const body = await req.json();

    // Only managers can approve/reject
    if (body.status && ['approved', 'rejected', 'reimbursed'].includes(body.status)) {
        if (userRole !== 'manager' && userRole !== 'admin') {
            return NextResponse.json({ error: 'Apenas gestores podem aprovar despesas' }, { status: 403 });
        }
        body.approvedBy = userId;
    }

    const [updated] = await db
        .update(pettyCash)
        .set({
            description: body.description,
            amount: body.amount ? String(body.amount) : undefined,
            category: body.category,
            paidBy: body.paidBy,
            notes: body.notes,
            status: body.status,
            approvedBy: body.approvedBy,
        })
        .where(and(eq(pettyCash.id, parseInt(id)), eq(pettyCash.companyId, companyId)))
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
        .delete(pettyCash)
        .where(and(eq(pettyCash.id, parseInt(id)), eq(pettyCash.companyId, companyId)));

    return NextResponse.json({ success: true });
}
