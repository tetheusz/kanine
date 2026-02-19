import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    schema: process.env.DATABASE_URL ? './drizzle/schema.pg.ts' : './drizzle/schema.ts',
    out: './drizzle/migrations',
    dialect: process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'contractmind.db',
    },
});
