import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Query Postgres information_schema to see actual columns
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contratos';
        `);
        return NextResponse.json({
            success: true,
            columns: result.rows
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to inspect DB', details: String(error) }, { status: 500 });
    }
}
