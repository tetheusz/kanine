import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import { sql as sqlt } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    const migrationPath = process.argv[2];
    if (!migrationPath) {
        console.error('Please provide a migration path');
        process.exit(1);
    }

    try {
        const fullPath = path.resolve(migrationPath);
        console.log(`Reading migration file: ${fullPath}`);
        const sql = fs.readFileSync(fullPath, 'utf8');

        // Split SQL by semicolons to execute chunks if needed, 
        // but for simple CREATE TABLEs, raw execute usually works.
        // However, Drizzle's db.execute might have issues with multiple statements in one call depending on driver.
        // Let's split by '-- Split' or just try as one block if confirmed it works.

        console.log('Executing SQL...');
        // Remove block comments and single-line comments
        const cleanSql = sql
            .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* block comments */
            .replace(/--.*$/gm, '');          // remove -- single line comments

        const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`Executing (trimmed): ${statement.substring(0, 70)}...`);
            await db.execute(sqlt.raw(statement));
        }
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
