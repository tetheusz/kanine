import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contractId = parseInt(id, 10);

        if (isNaN(contractId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const [contract] = await db
            .select({
                id: contracts.id,
                filename: contracts.filename,
                summary: contracts.summary,
                rawText: contracts.rawText,
            })
            .from(contracts)
            .where(eq(contracts.id, contractId));

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        if (!contract.rawText) {
            return NextResponse.json({ error: 'No text available for this contract' }, { status: 404 });
        }

        return NextResponse.json({
            id: contract.id,
            filename: contract.filename,
            summary: contract.summary,
            text: contract.rawText
        });
    } catch (error) {
        console.error('Error fetching contract text:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
