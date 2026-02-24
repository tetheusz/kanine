import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { notifications } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);
    const userId = Number(token.id);

    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    let conditions = [eq(notifications.companyId, companyId), eq(notifications.userId, userId)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    const result = await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(50);
    const unreadCount = result.filter((n: any) => !n.isRead).length;

    return NextResponse.json({ notifications: result, unreadCount });
}
