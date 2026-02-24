'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TransactionSummary {
    monthlyIncome: number;
    monthlyExpense: number;
    allTimeBalance: number;
}

interface PettyCashSummary {
    monthlySpending: number;
    pendingCount: number;
    fund: { currentAmount: string } | null;
}

interface BudgetEntry {
    id: number;
    name: string;
    percentage: number;
    isOverBudget: boolean;
    isWarning: boolean;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function HomePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [contractCount, setContractCount] = useState(0);
    const [txSummary, setTxSummary] = useState<TransactionSummary | null>(null);
    const [pcSummary, setPcSummary] = useState<PettyCashSummary | null>(null);
    const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/contracts').then(r => r.json()).catch(() => ({ contracts: [] })),
            fetch('/api/transactions/summary').then(r => r.json()).catch(() => null),
            fetch('/api/petty-cash/summary').then(r => r.json()).catch(() => null),
            fetch('/api/budgets').then(r => r.json()).catch(() => ({ budgets: [] })),
        ]).then(([contracts, tx, pc, bgt]) => {
            setContractCount(contracts?.contracts?.length || 0);
            setTxSummary(tx);
            setPcSummary(pc);
            setBudgets((bgt?.budgets || []).slice(0, 3));
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const overBudgetCount = budgets.filter(b => b.isOverBudget).length;
    const warningBudgetCount = budgets.filter(b => b.isWarning && !b.isOverBudget).length;

    const modules = [
        {
            title: 'Contratos',
            description: 'Gestão completa de documentos e contratos',
            href: '/contratos',
            icon: '📋',
            gradient: 'from-slate-800 to-slate-900',
            stat: `${contractCount} contrato${contractCount !== 1 ? 's' : ''}`,
            statColor: 'text-slate-300',
        },
        {
            title: 'Fluxo de Caixa',
            description: 'Entradas, saídas e saldo financeiro',
            href: '/fluxo-caixa',
            icon: '💰',
            gradient: 'from-emerald-600 to-emerald-700',
            stat: txSummary ? `Saldo: ${fmt(txSummary.allTimeBalance)}` : 'Começar agora',
            statColor: (txSummary?.allTimeBalance ?? 0) >= 0 ? 'text-emerald-200' : 'text-red-200',
        },
        {
            title: 'Orçamentos',
            description: 'Planejamento e controle de gastos',
            href: '/orcamento',
            icon: '📊',
            gradient: 'from-blue-600 to-blue-700',
            stat: budgets.length > 0
                ? `${budgets.length} orçamento${budgets.length !== 1 ? 's' : ''}${overBudgetCount > 0 ? ` • ${overBudgetCount} estourado${overBudgetCount !== 1 ? 's' : ''}` : ''}`
                : 'Criar primeiro orçamento',
            statColor: overBudgetCount > 0 ? 'text-red-200' : 'text-blue-200',
        },
        {
            title: 'Despesas',
            description: 'Controle da caixinha e gastos diários',
            href: '/despesas',
            icon: '🧾',
            gradient: 'from-amber-600 to-amber-700',
            stat: pcSummary
                ? `${pcSummary.pendingCount} pendente${pcSummary.pendingCount !== 1 ? 's' : ''} • ${fmt(pcSummary.monthlySpending)} este mês`
                : 'Começar agora',
            statColor: (pcSummary?.pendingCount ?? 0) > 0 ? 'text-amber-200' : 'text-amber-300',
        },
        {
            title: 'Chatbot K9',
            description: 'Assistente IA para consultas financeiras e contratos',
            href: '/chat',
            icon: '🤖',
            gradient: 'from-slate-600 to-slate-700',
            stat: 'IA ativa',
            statColor: 'text-slate-300',
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                    Olá, {session?.user?.name?.split(' ')[0] || 'Gestor'} 👋
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500">Selecione um módulo para começar</p>
                    {session?.user?.companyName && (
                        <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 shadow-sm font-medium">
                            🏢 {session.user.companyName}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Quick Overview Bar */}
            {txSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Saldo Geral</p>
                        <p className={`text-xl font-bold mt-1 ${(txSummary.allTimeBalance) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {fmt(txSummary.allTimeBalance)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Receitas (Mês)</p>
                        <p className="text-xl font-bold mt-1 text-blue-700">{fmt(txSummary.monthlyIncome)}</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Despesas (Mês)</p>
                        <p className="text-xl font-bold mt-1 text-red-700">{fmt(txSummary.monthlyExpense)}</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Contratos</p>
                        <p className="text-xl font-bold mt-1 text-slate-900">{contractCount}</p>
                    </div>
                </div>
            )}

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {modules.map((mod) => (
                    <Card
                        key={mod.href}
                        className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 border-0"
                        onClick={() => router.push(mod.href)}
                    >
                        <CardContent className={`p-0`}>
                            <div className={`bg-gradient-to-br ${mod.gradient} p-6 text-white min-h-[160px] flex flex-col justify-between`}>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{mod.icon}</span>
                                        <h3 className="text-xl font-bold">{mod.title}</h3>
                                    </div>
                                    <p className="text-sm opacity-80 leading-relaxed">{mod.description}</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className={`text-xs font-medium ${mod.statColor}`}>{mod.stat}</span>
                                    <span className="text-white/50 group-hover:text-white/80 group-hover:translate-x-1 transition-all text-lg">→</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Budget Alerts */}
            {(overBudgetCount > 0 || warningBudgetCount > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-900 mb-2">⚠️ Alertas de Orçamento</h3>
                    <div className="space-y-1.5">
                        {budgets.filter(b => b.isOverBudget || b.isWarning).map(b => (
                            <div key={b.id} className="flex items-center justify-between text-sm">
                                <span className="text-amber-800">{b.name}</span>
                                <span className={`font-bold ${b.isOverBudget ? 'text-red-700' : 'text-amber-700'}`}>
                                    {b.percentage}% {b.isOverBudget ? '🚨' : '⚠️'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
