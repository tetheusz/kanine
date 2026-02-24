import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { companies } from '@/drizzle/schema';
import { users } from '@/drizzle/schema.pg';
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
                console.log('[AUTH] Init info:', {
                    hasSecret: !!process.env.AUTH_SECRET,
                    secretStart: process.env.AUTH_SECRET?.substring(0, 3),
                    url: process.env.NEXTAUTH_URL,
                    nodeEnv: process.env.NODE_ENV
                });
                console.log('[AUTH] Starting authorization for:', credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log('[AUTH] Missing credentials');
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                try {
                    console.log('[AUTH] Querying DB for user...');
                    const [user] = await db
                        .select({
                            id: users.id,
                            name: users.name,
                            email: users.email,
                            passwordHash: users.passwordHash,
                            role: users.role,
                            companyId: users.companyId,
                            companyName: companies.name,
                        })
                        .from(users)
                        .leftJoin(companies, eq(users.companyId, companies.id))
                        .where(eq(users.email, email));

                    if (!user) {
                        console.log('[AUTH] User not found in DB');
                        return null;
                    }

                    console.log('[AUTH] User found, verifying password...');
                    const isValid = await bcrypt.compare(password, user.passwordHash);

                    if (!isValid) {
                        console.log('[AUTH] Invalid password');
                        return null;
                    }

                    console.log('[AUTH] Login successful for user:', user.id);
                    return {
                        id: String(user.id),
                        name: user.name,
                        email: user.email,
                        role: user.role || 'user',
                        companyId: user.companyId,
                        companyName: user.companyName,
                    };
                } catch (error) {
                    console.error('[AUTH] Error during authorization:', error);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            console.log('[AUTH_CB] JWT Callback', { hasUser: !!user, tokenId: token?.id });
            if (user) {
                token.id = user.id as string;
                token.role = (user as any).role || 'user';
                token.companyId = user.companyId as unknown as number;
                token.companyName = user.companyName as unknown as string;
            }
            return token;
        },
        async session({ session, token }) {
            console.log('[AUTH_CB] Session Callback', { hasToken: !!token, userId: token?.id });
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.companyId = token.companyId as number;
                session.user.companyName = token.companyName as string;
            }
            return session;
        },
    },
});
