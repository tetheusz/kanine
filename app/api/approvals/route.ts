import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { approvals } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let conditions = [eq(approvals.companyId, companyId)];
    if (status) conditions.push(eq(approvals.status, status));

    const result = await db.select().from(approvals).where(and(...conditions)).orderBy(desc(approvals.requestedAt));
    const pendingCount = result.filter((a: any) => a.status === 'pending').length;

    return NextResponse.json({ approvals: result, pendingCount });
}
