import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role?: string
            companyId?: number
            companyName?: string
        } & DefaultSession["user"]
    }

    interface User {
        id?: string
        role?: string
        companyId?: number
        companyName?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role?: string
        companyId?: number
        companyName?: string
    }
}
