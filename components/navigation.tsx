'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { K9Logo, KanineBrand } from '@/components/k9-logo';

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Nova Auditoria' },
    { href: '/chat', label: 'Assistente K9' },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="border-b bg-white">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-2 text-stone-900">
                            <KanineBrand size="small" />
                        </Link>

                        <div className="flex gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                                        pathname === item.href
                                            ? 'bg-stone-900 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:flex items-center gap-1.5">
                            <K9Logo className="w-4 h-4" />
                            {process.env.NEXT_PUBLIC_AI_ENABLED === 'true' ? 'K9 Engine + IA' : 'Regex Engine'}
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
