import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts, users, Contract } from '@/drizzle/schema'; // Import user to join if needed, or rely on getToken
import { getToken } from 'next-auth/jwt'; // Use getToken for session info
import { desc, eq, and } from 'drizzle-orm';

// GET /api/contracts - List contracts for user's company
export async function GET(req: NextRequest) {
    try {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET,
            secureCookie: process.env.NODE_ENV === 'production'
        });

        if (!token?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's companyId from DB based on email (since session might be stale or not have it)
        const [user] = await db.select().from(users).where(eq(users.email, token.email));

        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
        }

        const companyId = user.companyId;
        console.log("Fetching contracts for companyId:", companyId);

        const allContracts = await db
            .select()
            .from(contracts)
            .where(eq(contracts.companyId, companyId)) // Filter by company
            .orderBy(desc(contracts.id));

        // Calculate status for each contract
        const contractsWithStatus = allContracts.map((contract: Contract) => {
            const status = getContractStatus(contract.expiryDate);
            return { ...contract, status };
        });

        return NextResponse.json({ contracts: contractsWithStatus });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }
}


// POST /api/contracts - Create a new contract
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.AUTH_SECRET,
            secureCookie: process.env.NODE_ENV === 'production'
        });

        if (!token?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [user] = await db.select().from(users).where(eq(users.email, token.email));
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
        }

        const body = await request.json();
        console.log("Creating contract for company:", user.companyId, "payload:", body);

        const [newContract] = await db
            .insert(contracts)
            .values({
                filename: body.filename,
                parties: body.parties,
                signatureDate: body.signatureDate,
                expiryDate: body.expiryDate,
                value: body.value,
                cancellationClauses: body.cancellationClauses,
                summary: body.summary,
                extractionMethod: body.extractionMethod,
                rawText: body.text, // Save the full text for chat context
                companyId: user.companyId, // Link to company
                createdAt: new Date().toISOString(),
            })
            .returning();

        return NextResponse.json(newContract, { status: 201 });
    } catch (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
    }
}

// Helper function to determine contract status
function getContractStatus(expiryDate: string | null): 'active' | 'expiring' | 'expired' | 'unknown' {
    if (!expiryDate || expiryDate === 'Não identificado') {
        return 'unknown';
    }

    try {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (expiry < today) {
            return 'expired';
        } else if (expiry <= thirtyDaysFromNow) {
            return 'expiring';
        } else {
            return 'active';
        }
    } catch {
        return 'unknown';
    }
}
