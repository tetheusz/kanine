import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    try {
        log('Starting Schema Fix...');

        // 1. List current columns
        const before = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contratos';
        `);
        log(`Columns before: ${before.rows.map((r: any) => r.column_name).join(', ')}`);

        // 2. Force Add file_key
        try {
            await db.execute(sql`ALTER TABLE contratos ADD COLUMN file_key TEXT;`);
            log('SUCCESS: Added file_key');
        } catch (e: any) {
            log(`INFO: Could not add file_key: ${e.message}`);
        }

        // 3. Force Add company_id (just in case)
        try {
            await db.execute(sql`ALTER TABLE contratos ADD COLUMN company_id INTEGER;`);
            log('SUCCESS: Added company_id');
        } catch (e: any) {
            log(`INFO: Could not add company_id: ${e.message}`);
        }

        // 4. Force Add texto_bruto (just in case)
        try {
            await db.execute(sql`ALTER TABLE contratos ADD COLUMN texto_bruto TEXT;`);
            log('SUCCESS: Added texto_bruto');
        } catch (e: any) {
            log(`INFO: Could not add texto_bruto: ${e.message}`);
        }

        // 5. Verify
        const after = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contratos';
        `);
        log(`Columns after: ${after.rows.map((r: any) => r.column_name).join(', ')}`);

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        log(`CRITICAL FAIL: ${error}`);
        return NextResponse.json({ error: 'Fix failed', logs }, { status: 500 });
    }
}
