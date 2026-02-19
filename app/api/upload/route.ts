import { NextRequest, NextResponse } from 'next/server';
import { extractContractMetadata } from '@/lib/ai';
import { db } from '@/lib/db';
import { contracts, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { uploadFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

        if (!token?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's companyId
        const [user] = await db.select().from(users).where(eq(users.email, token.email));
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Check for duplicate filename WITHIN user's company
        const existing = await db
            .select()
            .from(contracts)
            .where(and(
                eq(contracts.filename, file.name),
                eq(contracts.companyId, user.companyId)
            ));

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'duplicate', message: `File "${file.name}" already exists` },
                { status: 409 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2 (S3)
        console.log('Starting R2 upload...');
        const fileExtension = file.name.split('.').pop() || 'pdf';
        const fileKey = `${user.companyId}/${uuidv4()}.${fileExtension}`;
        const contentType = file.type || 'application/pdf';

        await uploadFile(buffer, fileKey, contentType);
        console.log('R2 upload successful:', fileKey);

        // Extract metadata
        const metadata = await extractContractMetadata(buffer, file.name);

        // Save to database
        const [newContract] = await db
            .insert(contracts)
            .values({
                filename: file.name,
                parties: metadata.parties,
                signatureDate: metadata.signatureDate,
                expiryDate: metadata.expiryDate,
                value: metadata.value,
                cancellationClauses: metadata.cancellationClauses,
                summary: metadata.summary,
                extractionMethod: metadata.extractionMethod,
                rawText: metadata.rawText,
                fileKey: fileKey, // Save the R2 key
                companyId: user.companyId,
                createdAt: new Date().toISOString(),
            })
            .returning();


        // Return saved contract + rawText for chat context
        return NextResponse.json({
            ...newContract,
            rawText: metadata.rawText,
            aiError: metadata.aiError
        }, { status: 201 });
    } catch (error) {
        console.error('CRITICAL UPLOAD ERROR:', error);
        return NextResponse.json(
            { error: 'Failed to process file', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
