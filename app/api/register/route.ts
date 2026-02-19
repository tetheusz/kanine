import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, companies } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, companyName } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
        }

        // Check existing user
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (existing) {
            return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
        }

        // Create Company first (1 User = 1 Company for MVP, or User joins Company later)
        // For MVP simplicity: Create a company based on user name/input or default
        const newCompanyName = companyName || `${name.split(' ')[0]}'s Company`;

        const [newCompany] = await db.insert(companies).values({
            name: newCompanyName,
            plan: 'free',
            createdAt: new Date().toISOString(),
        }).returning();

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user linked to company
        const [newUser] = await db
            .insert(users)
            .values({
                name,
                email,
                passwordHash,
                companyId: newCompany.id,
                createdAt: new Date().toISOString(),
            })
            .returning();

        return NextResponse.json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            companyId: newUser.companyId,
        }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
    }
}
