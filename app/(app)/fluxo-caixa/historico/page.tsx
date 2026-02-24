'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Transaction {
    id: number;
    description: string;
    amount: string;
    type: string;
    date: string;
    paymentMethod: string | null;
    status: string;
    notes: string | null;
    createdAt: string;
}

export default function HistoricoPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: 'all', from: '', to: '' });

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    async function fetchTransactions() {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.type !== 'all') params.set('type', filter.type);
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);

        const res = await fetch(`/api/transactions?${params}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
        setLoading(false);
    }

    const methodLabels: Record<string, string> = {
        pix: 'PIX', boleto: 'Boleto', cartao: 'Cartão', dinheiro: 'Dinheiro', transferencia: 'Transferência',
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Histórico de Transações</h1>
                <p className="text-slate-500 mt-1">Todas as suas entradas e saídas</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex rounded-lg overflow-hidden border">
                    {['all', 'income', 'expense'].map(t => (
                        <button
                            key={t}
                            type="button"
                            className={`px-4 py-2 text-xs font-semibold transition-colors ${filter.type === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            onClick={() => setFilter({ ...filter, type: t })}
                        >
                            {t === 'all' ? 'Tudo' : t === 'income' ? '💰 Entradas' : '💸 Saídas'}
                        </button>
                    ))}
                </div>
                <input
                    type="date"
                    value={filter.from}
                    onChange={e => setFilter({ ...filter, from: e.target.value })}
                    className="h-9 px-3 rounded-md border border-slate-200 text-sm"
                    placeholder="De"
                />
                <input
                    type="date"
                    value={filter.to}
                    onChange={e => setFilter({ ...filter, to: e.target.value })}
                    className="h-9 px-3 rounded-md border border-slate-200 text-sm"
                    placeholder="Até"
                />
            </div>

            {/* Transactions List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                </div>
            ) : transactions.length === 0 ? (
                <Card className="shadow-sm">
                    <CardContent className="py-16 text-center text-slate-500">
                        Nenhuma transação encontrada com esses filtros.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {transactions.map(tx => (
                        <div
                            key={tx.id}
                            className="flex items-center gap-4 bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                {tx.type === 'income' ? '↗' : '↘'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">{tx.description}</p>
                                <div className="flex gap-2 mt-0.5">
                                    <span className="text-xs text-slate-400">
                                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                                    </span>
                                    {tx.paymentMethod && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {methodLabels[tx.paymentMethod] || tx.paymentMethod}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className={`text-right font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {tx.type === 'income' ? '+' : '-'} R$ {parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
