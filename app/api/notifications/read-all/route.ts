import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { notifications } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.companyId, Number(token.companyId)), eq(notifications.userId, Number(token.id)), eq(notifications.isRead, false)));

    return NextResponse.json({ success: true });
}
