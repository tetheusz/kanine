'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PettyCashSummary {
    monthlySpending: number;
    pendingCount: number;
    fund: {
        name: string;
        currentAmount: string;
        replenishThreshold: string;
    } | null;
}

interface PettyCashEntry {
    id: number;
    description: string;
    amount: string;
    category: string;
    date: string;
    paidBy: string | null;
    status: string;
    createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
    reimbursed: { label: 'Reembolsado', color: 'bg-blue-100 text-blue-800' },
};

const categoryIcons: Record<string, string> = {
    alimentacao: '🍔', transporte: '🚗', escritorio: '📎', limpeza: '🧹', geral: '📦', outros: '📦',
};

export default function DespesasPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<PettyCashSummary | null>(null);
    const [expenses, setExpenses] = useState<PettyCashEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/petty-cash/summary').then(r => r.json()),
            fetch('/api/petty-cash').then(r => r.json()),
        ]).then(([s, e]) => {
            setSummary(s);
            setExpenses(e.expenses || []);
        }).finally(() => setLoading(false));
    }, []);

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const fundBalance = parseFloat(summary?.fund?.currentAmount || '0');
    const threshold = parseFloat(summary?.fund?.replenishThreshold || '100');
    const isLow = fundBalance <= threshold;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                        Pequenas Despesas
                    </h1>
                    <p className="text-slate-500 mt-1">Controle gastos do dia-a-dia da caixinha</p>
                </div>
                <Button
                    onClick={() => router.push('/despesas/novo')}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                    + Novo Lançamento
                </Button>
            </div>

            {/* Low fund alert */}
            {isLow && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-semibold text-amber-900">Caixinha com saldo baixo!</p>
                        <p className="text-sm text-amber-700">O saldo ({fmt(fundBalance)}) está abaixo do limite mínimo ({fmt(threshold)}). Considere repor o fundo.</p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all ${isLow ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Saldo da Caixinha
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {fmt(fundBalance)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{summary?.fund?.name || 'Caixa Principal'}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 uppercase tracking-wider">
                            Gastos (Mês)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-700">{fmt(summary?.monthlySpending ?? 0)}</div>
                        <p className="text-xs text-slate-400 mt-1">Despesas lançadas</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 uppercase tracking-wider">
                            Pendentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-700">{summary?.pendingCount ?? 0}</div>
                        <p className="text-xs text-slate-400 mt-1">Aguardando aprovação</p>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses Timeline */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Despesas Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    {expenses.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">🧾</div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma despesa registrada</h3>
                            <p className="text-slate-500 mb-6">Registre gastos pequenos como café, transporte e material.</p>
                            <Button onClick={() => router.push('/despesas/novo')} variant="outline">
                                Lançar Primeira Despesa
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {expenses.map(ex => {
                                const st = statusMap[ex.status] || statusMap.pending;
                                return (
                                    <div key={ex.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">
                                            {categoryIcons[ex.category] || '📦'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm truncate">{ex.description}</p>
                                            <div className="flex gap-2 items-center mt-0.5">
                                                <span className="text-xs text-slate-400">{new Date(ex.date).toLocaleDateString('pt-BR')}</span>
                                                {ex.paidBy && <span className="text-xs text-slate-400">• {ex.paidBy}</span>}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                                            {st.label}
                                        </span>
                                        <div className="font-bold text-sm tabular-nums text-red-700">
                                            - {fmt(parseFloat(ex.amount))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
