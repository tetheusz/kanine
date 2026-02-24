import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { transactions, categories as categoriesTable } from '@/drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = Number(token.companyId);

    const url = new URL(req.url);
    const from = url.searchParams.get('from'); // YYYY-MM-DD
    const to = url.searchParams.get('to'); // YYYY-MM-DD

    if (!from || !to) {
        return NextResponse.json({ error: 'Filtro de data (from, to) é obrigatório' }, { status: 400 });
    }

    // 1. Fetch all transactions in period with their categories
    const results = await db.select({
        amount: transactions.amount,
        type: transactions.type,
        categoryName: categoriesTable.name,
    })
        .from(transactions)
        .leftJoin(categoriesTable, eq(transactions.categoryId, categoriesTable.id))
        .where(and(
            eq(transactions.companyId, companyId),
            gte(transactions.date, from),
            lte(transactions.date, to)
        ));

    // 2. Group by category
    const incomeCategories: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    results.forEach((t: any) => {
        const amt = parseFloat(t.amount);
        const cat = t.categoryName || 'Outros';
        if (t.type === 'income') {
            incomeCategories[cat] = (incomeCategories[cat] || 0) + amt;
            totalIncome += amt;
        } else {
            expenseCategories[cat] = (expenseCategories[cat] || 0) + amt;
            totalExpense += amt;
        }
    });

    return NextResponse.json({
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        margin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
        incomeCategories: Object.entries(incomeCategories).map(([name, value]) => ({ name, value })),
        expenseCategories: Object.entries(expenseCategories).map(([name, value]) => ({ name, value })),
    });
}
