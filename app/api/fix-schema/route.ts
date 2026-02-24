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

        // 5. Fix orphaned company references
        try {
            const orphans = await db.execute(sql`
                SELECT DISTINCT u.company_id 
                FROM users u 
                LEFT JOIN companies c ON u.company_id = c.id 
                WHERE u.company_id IS NOT NULL AND c.id IS NULL
            `);
            if (orphans.rows.length > 0) {
                for (const row of orphans.rows) {
                    const cid = (row as any).company_id;
                    await db.execute(sql`
                        INSERT INTO companies (id, name, plan, created_at)
                        VALUES (${cid}, ${'Minha Empresa'}, ${'free'}, ${new Date().toISOString()})
                        ON CONFLICT (id) DO NOTHING
                    `);
                    log(`FIXED: Created missing company id=${cid}`);
                }
                // Reset sequence to avoid future conflicts
                await db.execute(sql`SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies))`);
                log('FIXED: Reset companies_id_seq');
            } else {
                log('OK: No orphaned company references');
            }
        } catch (e: any) {
            log(`WARN: Company fix: ${e.message}`);
        }

        // 6. Verify
        const after = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contratos';
        `);
        log(`Columns after: ${after.rows.map((r: any) => r.column_name).join(', ')}`);

        // 7. Show companies for verification
        const companiesList = await db.execute(sql`SELECT id, name FROM companies`);
        log(`Companies: ${JSON.stringify(companiesList.rows)}`);

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        log(`CRITICAL FAIL: ${error}`);
        return NextResponse.json({ error: 'Fix failed', logs }, { status: 500 });
    }
}
