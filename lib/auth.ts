import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, companies } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                const [user] = await db
                    .select({
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        passwordHash: users.passwordHash,
                        companyId: users.companyId,
                        companyName: companies.name,
                    })
                    .from(users)
                    .leftJoin(companies, eq(users.companyId, companies.id))
                    .where(eq(users.email, email));

                if (!user) return null;

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: String(user.id),
                    name: user.name,
                    email: user.email,
                    companyId: user.companyId,
                    companyName: user.companyName,
                };
            },
        }),
    ],
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.companyId = user.companyId as unknown as number;
                token.companyName = user.companyName as unknown as string;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.companyId = token.companyId as number;
                session.user.companyName = token.companyName as string;
            }
            return session;
        },
    },
});
