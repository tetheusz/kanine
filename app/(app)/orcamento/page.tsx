'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BudgetEntry {
    id: number;
    name: string;
    plannedAmount: string;
    periodType: string;
    periodStart: string;
    periodEnd: string;
    actualSpent: number;
    percentage: number;
    isOverBudget: boolean;
    isWarning: boolean;
}

export default function OrcamentoPage() {
    const router = useRouter();
    const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/budgets').then(r => r.json()).then(d => {
            setBudgets(d.budgets || []);
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

    const totalPlanned = budgets.reduce((s, b) => s + parseFloat(b.plannedAmount), 0);
    const totalSpent = budgets.reduce((s, b) => s + b.actualSpent, 0);
    const totalRemaining = totalPlanned - totalSpent;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                        Gestão Orçamentária
                    </h1>
                    <p className="text-slate-500 mt-1">Planeje e acompanhe seus orçamentos por categoria</p>
                </div>
                <Button
                    onClick={() => router.push('/orcamento/novo')}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                    + Novo Orçamento
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                            Total Orçado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{fmt(totalPlanned)}</div>
                        <p className="text-xs text-slate-400 mt-1">Planejado para os períodos ativos</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 uppercase tracking-wider">
                            Total Gasto
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-700">{fmt(totalSpent)}</div>
                        <p className="text-xs text-slate-400 mt-1">Realizado até agora</p>
                    </CardContent>
                </Card>
                <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all ${totalRemaining >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium uppercase tracking-wider ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            Saldo Disponível
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${totalRemaining >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {fmt(totalRemaining)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Margem restante</p>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Progress Bars */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Acompanhamento por Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                    {budgets.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">📈</div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum orçamento definido</h3>
                            <p className="text-slate-500 mb-6">Defina limites de gastos por categoria para controlar melhor suas finanças.</p>
                            <Button onClick={() => router.push('/orcamento/novo')} variant="outline">
                                Criar Primeiro Orçamento
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {budgets.map(b => {
                                const barColor = b.isOverBudget
                                    ? 'bg-red-500'
                                    : b.isWarning
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500';
                                const clampedPct = Math.min(b.percentage, 100);

                                return (
                                    <div key={b.id} className="p-4 rounded-xl border bg-white hover:shadow-sm transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{b.name}</h4>
                                                <span className="text-xs text-slate-400">
                                                    {b.periodType === 'monthly' ? 'Mensal' : b.periodType === 'quarterly' ? 'Trimestral' : 'Anual'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-bold ${b.isOverBudget ? 'text-red-700' : b.isWarning ? 'text-amber-700' : 'text-slate-900'}`}>
                                                    {b.percentage}%
                                                </span>
                                                {b.isOverBudget && <span className="ml-1 text-xs">🚨</span>}
                                                {b.isWarning && !b.isOverBudget && <span className="ml-1 text-xs">⚠️</span>}
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                                                style={{ width: `${clampedPct}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                                            <span>Gasto: {fmt(b.actualSpent)}</span>
                                            <span>Orçado: {fmt(parseFloat(b.plannedAmount))}</span>
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
