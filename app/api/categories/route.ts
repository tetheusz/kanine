import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { categories } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Default categories seeded per company (PT-BR)
const DEFAULT_CATEGORIES = [
    { name: 'Salários', type: 'expense', color: '#EF4444', icon: 'users' },
    { name: 'Aluguel', type: 'expense', color: '#F97316', icon: 'home' },
    { name: 'Serviços', type: 'expense', color: '#8B5CF6', icon: 'wrench' },
    { name: 'Material', type: 'expense', color: '#6366F1', icon: 'package' },
    { name: 'Transporte', type: 'expense', color: '#0EA5E9', icon: 'truck' },
    { name: 'Alimentação', type: 'expense', color: '#10B981', icon: 'utensils' },
    { name: 'Marketing', type: 'expense', color: '#EC4899', icon: 'megaphone' },
    { name: 'Impostos', type: 'expense', color: '#DC2626', icon: 'landmark' },
    { name: 'Outros Gastos', type: 'expense', color: '#6B7280', icon: 'circle' },
    { name: 'Vendas', type: 'income', color: '#22C55E', icon: 'shopping-cart' },
    { name: 'Serviços Prestados', type: 'income', color: '#14B8A6', icon: 'briefcase' },
    { name: 'Investimentos', type: 'income', color: '#3B82F6', icon: 'trending-up' },
    { name: 'Outras Receitas', type: 'income', color: '#A3E635', icon: 'plus-circle' },
];

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);

    let result = await db
        .select()
        .from(categories)
        .where(eq(categories.companyId, companyId));

    // Auto-seed defaults if company has no categories
    if (result.length === 0) {
        await db.insert(categories).values(
            DEFAULT_CATEGORIES.map((c) => ({
                ...c,
                companyId,
                isSystem: true,
            }))
        );
        result = await db.select().from(categories).where(eq(categories.companyId, companyId));
    }

    return NextResponse.json({ categories: result });
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === 'production' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const body = await req.json();

    const { name, type, color, icon } = body;
    if (!name || !type) {
        return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 });
    }

    const [newCat] = await db
        .insert(categories)
        .values({
            name,
            type,
            color: color || '#6B7280',
            icon: icon || 'circle',
            companyId,
            isSystem: false,
        })
        .returning();

    return NextResponse.json(newCat, { status: 201 });
}
