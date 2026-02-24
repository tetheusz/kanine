import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { approvals, notifications } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = token.role as string;
    if (!['manager', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Somente gestores podem aprovar/rejeitar' }, { status: 403 });
    }

    const body = await req.json();
    const { action, notes } = body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'action deve ser "approve" ou "reject"' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const [updated] = await db.update(approvals)
        .set({ status: newStatus, approvedBy: Number(token.id), resolvedAt: new Date(), notes: notes || null })
        .where(and(eq(approvals.id, Number(id)), eq(approvals.companyId, Number(token.companyId))))
        .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Create notification for requester
    if (updated.requestedBy) {
        await db.insert(notifications).values({
            type: 'system',
            title: `Solicitação ${newStatus === 'approved' ? 'aprovada ✅' : 'rejeitada ❌'}`,
            message: `"${updated.title}" foi ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'}${notes ? ` — ${notes}` : ''}`,
            severity: newStatus === 'approved' ? 'info' : 'warning',
            actionUrl: '/aprovacoes',
            companyId: Number(token.companyId),
            userId: updated.requestedBy,
        });
    }

    return NextResponse.json({ approval: updated });
}
