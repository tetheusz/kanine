import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        const latest = await db.select().from(contracts).orderBy(desc(contracts.createdAt)).limit(1);

        if (latest.length === 0) {
            return NextResponse.json({ message: 'No contracts found' });
        }

        return NextResponse.json({
            success: true,
            latest: latest[0],
            hasFileKey: !!latest[0].fileKey,
            fileKeyVal: latest[0].fileKey
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch', details: String(error) }, { status: 500 });
    }
}
