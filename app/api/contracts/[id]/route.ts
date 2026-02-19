import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/contracts/[id] - Get a single contract
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contractId = parseInt(id);

        const [contract] = await db
            .select()
            .from(contracts)
            .where(eq(contracts.id, contractId));

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        console.log(`[DEBUG] Fetching contract ${contractId}:`, {
            id: contract.id,
            filename: contract.filename,
            fileKey: contract.fileKey,
            hasFileKey: !!contract.fileKey
        });

        return NextResponse.json(contract);
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }
}

// PUT /api/contracts/[id] - Update a contract
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contractId = parseInt(id);
        const body = await request.json();

        const [updatedContract] = await db
            .update(contracts)
            .set({
                parties: body.parties,
                signatureDate: body.signatureDate,
                expiryDate: body.expiryDate,
                value: body.value,
                cancellationClauses: body.cancellationClauses,
                summary: body.summary,
            })
            .where(eq(contracts.id, contractId))
            .returning();

        if (!updatedContract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        return NextResponse.json(updatedContract);
    } catch (error) {
        console.error('Error updating contract:', error);
        return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
    }
}

// DELETE /api/contracts/[id] - Delete a contract
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contractId = parseInt(id);

        // 1. Get contract to find fileKey
        const [contract] = await db
            .select()
            .from(contracts)
            .where(eq(contracts.id, contractId));

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // 2. Delete file from R2 (if exists)
        if (contract.fileKey) {
            try {
                const { deleteFile } = await import('@/lib/storage');
                await deleteFile(contract.fileKey);
            } catch (err) {
                console.error('Failed to delete file from storage:', err);
                // Continue to delete DB record anyway? Yes, to avoid inconsistency.
            }
        }

        // 3. Delete from DB
        const [deletedContract] = await db
            .delete(contracts)
            .where(eq(contracts.id, contractId))
            .returning();

        if (!deletedContract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting contract:', error);
        return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
    }
}
