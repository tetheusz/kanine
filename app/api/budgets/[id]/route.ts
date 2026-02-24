import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { budgets, budgetRevisions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = Number(token.companyId);
    const userId = Number(token.id);
    const body = await req.json();

    // Get current budget for revision history
    const [current] = await db
        .select()
        .from(budgets)
        .where(and(eq(budgets.id, parseInt(id)), eq(budgets.companyId, companyId)));

    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Log revision if amount changed
    if (body.plannedAmount && String(body.plannedAmount) !== current.plannedAmount) {
        await db.insert(budgetRevisions).values({
            budgetId: current.id,
            previousAmount: current.plannedAmount,
            newAmount: String(body.plannedAmount),
            reason: body.revisionReason || null,
            revisedBy: userId,
        });
    }

    const [updated] = await db
        .update(budgets)
        .set({
            name: body.name || current.name,
            categoryId: body.categoryId !== undefined ? body.categoryId : current.categoryId,
            plannedAmount: body.plannedAmount ? String(body.plannedAmount) : current.plannedAmount,
            periodType: body.periodType || current.periodType,
            periodStart: body.periodStart || current.periodStart,
            periodEnd: body.periodEnd || current.periodEnd,
            alertThreshold: body.alertThreshold ? String(body.alertThreshold) : current.alertThreshold,
            notes: body.notes !== undefined ? body.notes : current.notes,
        })
        .where(and(eq(budgets.id, parseInt(id)), eq(budgets.companyId, companyId)))
        .returning();

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = Number(token.companyId);

    await db
        .delete(budgets)
        .where(and(eq(budgets.id, parseInt(id)), eq(budgets.companyId, companyId)));

    return NextResponse.json({ success: true });
}
