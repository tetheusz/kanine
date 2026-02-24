import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { notifications } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [updated] = await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, Number(id)), eq(notifications.companyId, Number(token.companyId))))
        .returning();

    return NextResponse.json({ notification: updated });
}
