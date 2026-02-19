import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Query Postgres information_schema to see actual columns
        const columnsUsers = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        // Check if tables exist before counting to avoid errors if they don't
        let countUsers = { rows: [{ count: 'Error (Table Missing)' }] };
        let countContratos = { rows: [{ count: 'Error (Table Missing)' }] };
        let countCompanies = { rows: [{ count: 'Error (Table Missing)' }] };

        try { countUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users`); } catch { }
        try { countContratos = await db.execute(sql`SELECT COUNT(*) as count FROM contratos`); } catch { }
        try { countCompanies = await db.execute(sql`SELECT COUNT(*) as count FROM companies`); } catch { }

        return NextResponse.json({
            success: true,
            tables: {
                users: {
                    exists: columnsUsers.rows.length > 0,
                    count: countUsers.rows[0]?.count,
                    columns: columnsUsers.rows
                },
                contratos: { count: countContratos.rows[0]?.count },
                companies: { count: countCompanies.rows[0]?.count }
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to inspect DB', details: String(error) }, { status: 500 });
    }
}
