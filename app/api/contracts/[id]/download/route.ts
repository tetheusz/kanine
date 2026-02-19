import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { getDownloadUrl } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        console.log('[DOWNLOAD_DEBUG] Init', {
            id: (await params).id,
            isProduction,
            hasSecret: !!process.env.AUTH_SECRET
        });

        let token = await getToken({
            req: request,
            secret: process.env.AUTH_SECRET,
            secureCookie: isProduction
        });

        console.log('[DOWNLOAD_DEBUG] Token result:', { hasToken: !!token });

        // Fallback: Try without secureCookie if failed (sanity check)
        if (!token && isProduction) {
            console.log('[DOWNLOAD_DEBUG] Retrying without secureCookie...');
            token = await getToken({
                req: request,
                secret: process.env.AUTH_SECRET,
                secureCookie: false
            });
            console.log('[DOWNLOAD_DEBUG] Retry result:', { hasToken: !!token });
        }

        if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const [user] = await db.select().from(users).where(eq(users.email, token.email));
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
        }

        const { id } = await params;
        const contractId = parseInt(id);

        if (isNaN(contractId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const [contract] = await db
            .select()
            .from(contracts)
            .where(and(eq(contracts.id, contractId), eq(contracts.companyId, user.companyId)));

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        if (!contract.fileKey) {
            return NextResponse.json({ error: 'File not available' }, { status: 404 });
        }

        const url = await getDownloadUrl(contract.fileKey);

        if (!url) {
            return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
        }

        // Redirect user to the presigned URL
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('Error generating download URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
