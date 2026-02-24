import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// TEMPORARY: Remove after use
export async function POST(req: NextRequest) {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
        return NextResponse.json({ error: 'email and newPassword required' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    const [updated] = await db
        .update(users)
        .set({ passwordHash: hash })
        .where(eq(users.email, email))
        .returning({ id: users.id, email: users.email });

    if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Password reset for ${updated.email}` });
}
