'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    TrendingDown, TrendingUp, AlertTriangle, Clock, Search,
    Plus, Trash2, CheckCircle, Calendar, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

interface Bill {
    id: number; title: string; amount: string; type: string;
    dueDate: string; status: string; paidAmount: string | null;
    paidDate: string | null; counterparty: string | null;
    paymentMethod: string | null; notes: string | null;
}
interface Summary {
    totalPayable: number; totalReceivable: number;
    overdueCount: number; overdueAmount: number; dueSoonCount: number;
}

const TABS = [
    { id: 'payable', label: 'A Pagar', icon: '💸' },
    { id: 'receivable', label: 'A Receber', icon: '💰' },
    { id: 'overdue', label: 'Vencidos', icon: '⚠️' },
    { id: 'new', label: 'Nova Conta', icon: '➕' },
];

export default function ContasPage() {
    const [tab, setTab] = useState('payable');
    const [bills, setBills] = useState<Bill[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState({
        title: '', amount: '', type: 'payable' as 'payable' | 'receivable',
        dueDate: new Date().toISOString().split('T')[0],
        counterparty: '', paymentMethod: 'pix', notes: '',
    });

    const fetchData = useCallback(() => {
        setLoading(true);
        const typeParam = tab === 'overdue' ? '' : `type=${tab === 'new' ? 'payable' : tab}`;
        const statusParam = tab === 'overdue' ? 'status=overdue' : '';
        const qs = [typeParam, statusParam].filter(Boolean).join('&');
        Promise.all([
            fetch(`/api/bills?${qs}`).then(r => r.json()).catch(() => ({ bills: [] })),
            fetch('/api/bills/summary').then(r => r.json()).catch(() => null),
        ]).then(([b, s]) => {
            setBills(b.bills || []);
            setSummary(s);
        }).finally(() => setLoading(false));
    }, [tab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
    const isOverdue = (d: string) => new Date(d) < new Date(new Date().toISOString().split('T')[0]);

    const filtered = bills.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.counterparty?.toLowerCase().includes(search.toLowerCase()));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await fetch('/api/bills', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount.replace(',', '.')) }),
            });
            if (res.ok) {
                setForm({ title: '', amount: '', type: 'payable', dueDate: new Date().toISOString().split('T')[0], counterparty: '', paymentMethod: 'pix', notes: '' });
                setTab('payable');
                fetchData();
            }
        } catch { } finally { setFormLoading(false); }
    }

    async function handleMarkPaid(id: number) {
        const bill = bills.find(b => b.id === id);
        if (!bill || !confirm(`Marcar "${bill.title}" como pago?`)) return;
        await fetch(`/api/bills/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paid', paidAmount: bill.amount, paidDate: new Date().toISOString().split('T')[0] }),
        });
        fetchData();
    }

    async function handleDelete(id: number) {
        if (!confirm('Excluir esta conta?')) return;
        await fetch(`/api/bills/${id}`, { method: 'DELETE' });
        fetchData();
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Contas a Pagar e Receber</h1>
                    <p className="text-slate-500 mt-1">Controle de vencimentos e pagamentos</p>
                </div>
                <button onClick={() => setTab('new')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-emerald-200">
                    <Plus className="w-4 h-4" /> Nova Conta
                </button>
            </div>

            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SCard label="Total a Pagar" value={fmt(summary.totalPayable)} icon={<TrendingDown className="w-5 h-5" />} color="red" />
                    <SCard label="Total a Receber" value={fmt(summary.totalReceivable)} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
                    <SCard label="Vencidos" value={`${summary.overdueCount} (${fmt(summary.overdueAmount)})`} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
                    <SCard label="Vencendo em 7d" value={String(summary.dueSoonCount)} icon={<Clock className="w-5 h-5" />} color="blue" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}>
                        <span>{t.icon}</span>{t.label}
                        {t.id === 'overdue' && summary && summary.overdueCount > 0 && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{summary.overdueCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                </div>
            ) : tab === 'new' ? (
                <div className="max-w-2xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-5">Registrar Nova Conta</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex rounded-lg overflow-hidden border">
                                <button type="button" onClick={() => setForm({ ...form, type: 'payable' })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${form.type === 'payable' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                    <ArrowDownCircle className="w-4 h-4" /> A Pagar
                                </button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'receivable' })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${form.type === 'receivable' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                    <ArrowUpCircle className="w-4 h-4" /> A Receber
                                </button>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Título *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Aluguel escritório" required
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Valor (R$) *</label>
                                    <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" required
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Vencimento *</label>
                                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Contraparte</label>
                                    <input value={form.counterparty} onChange={e => setForm({ ...form, counterparty: e.target.value })} placeholder="Cliente ou fornecedor"
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Método</label>
                                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                                        <option value="pix">PIX</option><option value="boleto">Boleto</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Observações</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas opcionais..." rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setTab('payable')} className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" disabled={formLoading} className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200">
                                    {formLoading ? '⏳ Salvando...' : '✓ Registrar Conta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border shadow-sm flex-1 min-w-[200px] max-w-sm">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Buscar por título ou contraparte..." value={search} onChange={e => setSearch(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
                        </div>
                        <span className="ml-auto text-xs text-slate-400">{filtered.length} contas</span>
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="px-5 py-16 text-center">
                                <div className="text-4xl mb-3">{tab === 'overdue' ? '✅' : '📂'}</div>
                                <h3 className="text-sm font-medium text-slate-700 mb-1">{tab === 'overdue' ? 'Nenhuma conta vencida!' : 'Nenhuma conta encontrada'}</h3>
                                <p className="text-xs text-slate-400">{tab === 'overdue' ? 'Parabéns, está tudo em dia.' : 'Cadastre suas contas a pagar e receber.'}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50">
                                            <th className="text-left px-5 py-3 font-medium">Vencimento</th>
                                            <th className="text-left px-5 py-3 font-medium">Título</th>
                                            <th className="text-left px-5 py-3 font-medium">Contraparte</th>
                                            <th className="text-left px-5 py-3 font-medium">Tipo</th>
                                            <th className="text-left px-5 py-3 font-medium">Status</th>
                                            <th className="text-right px-5 py-3 font-medium">Valor</th>
                                            <th className="text-right px-5 py-3 font-medium">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(b => {
                                            const overdue = b.status === 'open' && isOverdue(b.dueDate);
                                            const daysLate = overdue ? Math.floor((Date.now() - new Date(b.dueDate).getTime()) / 86400000) : 0;
                                            return (
                                                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors group">
                                                    <td className="px-5 py-3.5">
                                                        <span className={`text-sm ${overdue ? 'text-red-700 font-bold' : 'text-slate-500'}`}>{fmtDate(b.dueDate)}</span>
                                                        {overdue && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{daysLate}d</span>}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="text-sm text-slate-900 font-medium">{b.title}</div>
                                                        {b.notes && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{b.notes}</div>}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm text-slate-500">{b.counterparty || '—'}</td>
                                                    <td className="px-5 py-3.5">
                                                        {b.type === 'payable'
                                                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">A Pagar</span>
                                                            : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">A Receber</span>
                                                        }
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <StatusBadge status={b.status} overdue={overdue} />
                                                    </td>
                                                    <td className={`px-5 py-3.5 text-sm font-bold text-right tabular-nums whitespace-nowrap ${b.type === 'receivable' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {fmt(parseFloat(b.amount))}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            {b.status === 'open' && (
                                                                <button onClick={() => handleMarkPaid(b.id)} title="Marcar como pago"
                                                                    className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDelete(b.id)} title="Excluir"
                                                                className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function SCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
    const cm: Record<string, { bg: string; text: string; icon: string; border: string }> = {
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-l-emerald-500' },
        red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', border: 'border-l-red-500' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', border: 'border-l-amber-500' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-l-blue-500' },
    };
    const c = cm[color] || cm.blue;
    return (
        <div className={`bg-white rounded-xl border border-l-4 ${c.border} shadow-sm p-4 hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                <div className={`${c.bg} p-1.5 rounded-lg ${c.icon}`}>{icon}</div>
            </div>
            <div className={`text-xl font-bold ${c.text} tabular-nums`}>{value}</div>
        </div>
    );
}

function StatusBadge({ status, overdue }: { status: string; overdue: boolean }) {
    if (overdue) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 border border-red-200">Vencido</span>;
    const s: Record<string, string> = {
        open: 'bg-amber-50 text-amber-700 border-amber-200',
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        partial: 'bg-blue-50 text-blue-700 border-blue-200',
        cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const l: Record<string, string> = { open: 'Em Aberto', paid: 'Pago', partial: 'Parcial', cancelled: 'Cancelado' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${s[status] || s.open}`}>{l[status] || status}</span>;
}
