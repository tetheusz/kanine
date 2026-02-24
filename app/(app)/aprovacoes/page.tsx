'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

interface Approval {
    id: number; type: string; relatedId: number; relatedType: string;
    title: string; amount: string | null; status: string;
    requestedBy: number | null; approvedBy: number | null;
    requestedAt: string; resolvedAt: string | null; notes: string | null;
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    expense: { label: 'Despesa', icon: '🧾' },
    petty_cash: { label: 'Caixinha', icon: '💵' },
    bill: { label: 'Conta', icon: '📄' },
    budget: { label: 'Orçamento', icon: '📈' },
};

export default function AprovacoesPage() {
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'pending' | 'history'>('pending');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [rejectNotes, setRejectNotes] = useState<{ id: number; notes: string } | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        fetch(`/api/approvals${tab === 'pending' ? '?status=pending' : ''}`)
            .then(r => r.json())
            .then(data => { setApprovals(data.approvals || []); setPendingCount(data.pendingCount || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [tab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: string) => parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    async function handleAction(id: number, action: 'approve' | 'reject', notes?: string) {
        setActionLoading(id);
        try {
            await fetch(`/api/approvals/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes }),
            });
            setRejectNotes(null);
            fetchData();
        } catch { } finally { setActionLoading(null); }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl">
                        <Shield className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Aprovações</h1>
                        <p className="text-slate-500 mt-1">Gerencie solicitações que precisam da sua aprovação</p>
                    </div>
                </div>
                {pendingCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-full">{pendingCount} pendente{pendingCount > 1 && 's'}</span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200">
                <button onClick={() => setTab('pending')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'pending' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                    <Clock className="w-4 h-4" /> Pendentes
                    {pendingCount > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
                </button>
                <button onClick={() => setTab('history')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'history' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                    📋 Histórico
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                </div>
            ) : approvals.length === 0 ? (
                <div className="bg-white rounded-xl border shadow-sm px-5 py-16 text-center">
                    <div className="text-4xl mb-4">{tab === 'pending' ? '✅' : '📋'}</div>
                    <h3 className="text-sm font-medium text-slate-700 mb-1">
                        {tab === 'pending' ? 'Nenhuma aprovação pendente' : 'Nenhum histórico de aprovações'}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {tab === 'pending' ? 'Quando houver solicitações, elas aparecerão aqui.' : 'O histórico será preenchido conforme aprovações forem processadas.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {approvals.map(a => {
                        const t = TYPE_LABELS[a.type] || { label: a.type, icon: '📋' };
                        const isResolving = actionLoading === a.id;
                        const showRejectForm = rejectNotes?.id === a.id;
                        return (
                            <div key={a.id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="text-2xl">{t.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">{t.label}</span>
                                            <span className="text-xs text-slate-400">#{a.id}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                                        {a.amount && <p className="text-lg font-bold text-slate-800 mt-1 tabular-nums">{fmt(a.amount)}</p>}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                            <span>Solicitado em {fmtDate(a.requestedAt)}</span>
                                            {a.resolvedAt && <span>• Resolvido em {fmtDate(a.resolvedAt)}</span>}
                                        </div>
                                        {a.notes && a.status !== 'pending' && (
                                            <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                                💬 {a.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {a.status === 'pending' ? (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleAction(a.id, 'approve')} disabled={isResolving}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                                                </button>
                                                <button onClick={() => setRejectNotes({ id: a.id, notes: '' })} disabled={isResolving}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors disabled:opacity-50">
                                                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                                                </button>
                                            </div>
                                        ) : a.status === 'approved' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Aprovado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                                                <XCircle className="w-3.5 h-3.5" /> Rejeitado
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {showRejectForm && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-slate-700 mb-1 block">Motivo da rejeição</label>
                                            <input value={rejectNotes.notes} onChange={e => setRejectNotes({ ...rejectNotes, notes: e.target.value })}
                                                placeholder="Descreva o motivo..."
                                                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500" />
                                        </div>
                                        <button onClick={() => handleAction(a.id, 'reject', rejectNotes.notes)} disabled={isResolving}
                                            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                                            Confirmar Rejeição
                                        </button>
                                        <button onClick={() => setRejectNotes(null)}
                                            className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
