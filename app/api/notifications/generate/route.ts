import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { notifications, bills, budgets, contracts } from '@/drizzle/schema';
import { eq, and, sql, lte, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);
    const userId = Number(token.id);
    const today = new Date().toISOString().split('T')[0];
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const generated: string[] = [];

    // 1. Bills due in 3 days
    const dueSoon = await db.select().from(bills)
        .where(and(eq(bills.companyId, companyId), eq(bills.status, 'open'), gte(bills.dueDate, today), lte(bills.dueDate, in3days)));

    for (const bill of dueSoon) {
        const exists = await db.select({ id: notifications.id }).from(notifications)
            .where(and(eq(notifications.relatedId, bill.id), eq(notifications.relatedType, 'bill'), eq(notifications.type, 'bill_due'), eq(notifications.companyId, companyId)))
            .limit(1);

        if (exists.length === 0) {
            await db.insert(notifications).values({
                type: 'bill_due', title: `Conta vencendo em breve`,
                message: `"${bill.title}" vence em ${new Date(bill.dueDate).toLocaleDateString('pt-BR')} — R$ ${parseFloat(bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                severity: 'warning', actionUrl: '/contas', relatedId: bill.id, relatedType: 'bill', companyId, userId,
            });
            generated.push(`bill_due:${bill.id}`);
        }
    }

    // 2. Overdue bills
    const overdue = await db.select().from(bills)
        .where(and(eq(bills.companyId, companyId), eq(bills.status, 'open'), lte(bills.dueDate, today)));

    for (const bill of overdue) {
        const exists = await db.select({ id: notifications.id }).from(notifications)
            .where(and(eq(notifications.relatedId, bill.id), eq(notifications.relatedType, 'bill'), eq(notifications.type, 'bill_due'), eq(notifications.severity, 'critical'), eq(notifications.companyId, companyId)))
            .limit(1);

        if (exists.length === 0) {
            const daysLate = Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / 86400000);
            await db.insert(notifications).values({
                type: 'bill_due', title: `Conta vencida!`,
                message: `"${bill.title}" está ${daysLate}d em atraso — R$ ${parseFloat(bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                severity: 'critical', actionUrl: '/contas', relatedId: bill.id, relatedType: 'bill', companyId, userId,
            });
            generated.push(`bill_overdue:${bill.id}`);
        }
    }

    // 3. Contracts expiring in 30 days
    const expiring = await db.select().from(contracts)
        .where(and(eq(contracts.companyId, companyId), gte(contracts.expiryDate, today), lte(contracts.expiryDate, in30days)));

    for (const c of expiring) {
        const exists = await db.select({ id: notifications.id }).from(notifications)
            .where(and(eq(notifications.relatedId, c.id), eq(notifications.relatedType, 'contract'), eq(notifications.type, 'contract_expiring'), eq(notifications.companyId, companyId)))
            .limit(1);

        if (exists.length === 0) {
            await db.insert(notifications).values({
                type: 'contract_expiring', title: `Contrato expirando`,
                message: `"${c.filename}" expira em ${c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('pt-BR') : 'breve'}`,
                severity: 'warning', actionUrl: `/contracts/${c.id}`, relatedId: c.id, relatedType: 'contract', companyId, userId,
            });
            generated.push(`contract:${c.id}`);
        }
    }

    return NextResponse.json({ generated: generated.length, details: generated });
}
