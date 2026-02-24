'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { KanineBrand } from '@/components/k9-logo';
import { useState } from 'react';
import { NotificationBell } from './notification-bell';

const modules = [
    {
        label: 'Painel Geral',
        href: '/home',
        icon: '🏠',
    },
    {
        label: 'Relatórios',
        href: '/relatorios',
        icon: '📊',
    },
    {
        label: 'Contratos',
        href: '/contratos',
        icon: '📄',
        children: [
            { label: 'Painel', href: '/dashboard' },
            { label: 'Todos os Contratos', href: '/contratos' },
            { label: 'Nova Auditoria', href: '/contratos/upload' },
        ],
    },
    {
        label: 'Fluxo de Caixa',
        href: '/fluxo-caixa',
        icon: '💰',
        children: [
            { label: 'Dashboard', href: '/fluxo-caixa' },
            { label: 'Nova Transação', href: '/fluxo-caixa/novo' },
            { label: 'Histórico', href: '/fluxo-caixa/historico' },
        ],
    },
    {
        label: 'Orçamento',
        href: '/orcamento',
        icon: '📈',
        children: [
            { label: 'Dashboard', href: '/orcamento' },
            { label: 'Novo Orçamento', href: '/orcamento/novo' },
        ],
    },
    {
        label: 'Despesas',
        href: '/despesas',
        icon: '🧾',
        children: [
            { label: 'Dashboard', href: '/despesas' },
            { label: 'Novo Lançamento', href: '/despesas/novo' },
        ],
    },
    {
        label: 'Contas',
        href: '/contas',
        icon: '📑',
    },
    {
        label: 'Aprovações',
        href: '/aprovacoes',
        icon: '✅',
    },
    {
        label: 'Notificações',
        href: '/notificacoes',
        icon: '🔔',
    },
    {
        label: 'Assistente K9',
        href: '/chat',
        icon: '🤖',
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    return (
        <aside
            className={cn(
                'flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 sticky top-0',
                collapsed ? 'w-16' : 'w-60'
            )}
        >
            {/* Brand */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
                {!collapsed && (
                    <Link href="/home">
                        <KanineBrand size="small" />
                    </Link>
                )}
                <div className="flex items-center gap-1">
                    {!collapsed && <NotificationBell />}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title={collapsed ? 'Expandir' : 'Recolher'}
                    >
                        {collapsed ? '→' : '←'}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-0.5 px-2">
                    {modules.map((mod) => {
                        const active = isActive(mod.href);
                        const isOpen = openMenu === mod.href;
                        const hasChildren = mod.children && mod.children.length > 0;

                        return (
                            <li key={mod.href}>
                                <div className="flex flex-col">
                                    <Link
                                        href={mod.href}
                                        onClick={(e) => {
                                            if (hasChildren) {
                                                e.preventDefault();
                                                setOpenMenu(isOpen ? null : mod.href);
                                            }
                                        }}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                            active
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        )}
                                    >
                                        <span className="text-base shrink-0">{mod.icon}</span>
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1">{mod.label}</span>
                                                {hasChildren && (
                                                    <span className={cn('text-xs transition-transform', isOpen && 'rotate-90')}>
                                                        ▸
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Link>

                                    {/* Sub-navigation */}
                                    {!collapsed && hasChildren && isOpen && (
                                        <ul className="mt-0.5 ml-8 space-y-0.5">
                                            {mod.children!.map((child) => (
                                                <li key={child.href}>
                                                    <Link
                                                        href={child.href}
                                                        className={cn(
                                                            'block px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                                            pathname === child.href
                                                                ? 'text-slate-900 bg-slate-100'
                                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                        )}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100">
                {!collapsed && (
                    <div className="text-xs text-slate-400 mb-2 px-2">
                        {process.env.NEXT_PUBLIC_AI_ENABLED === 'true' ? '🧠 K9 Engine + IA' : '⚙️ Regex Engine'}
                    </div>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={cn(
                        'flex items-center gap-2 w-full rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors',
                        collapsed ? 'justify-center p-2' : 'px-3 py-2'
                    )}
                >
                    <span>🚪</span>
                    {!collapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
    );
}
