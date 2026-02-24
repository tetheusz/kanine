'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    TrendingUp, TrendingDown, Wallet, PiggyBank, FileDown, Calendar,
    Search, Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Upload
} from 'lucide-react';

interface Summary {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyBalance: number;
    allTimeBalance: number;
}

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

interface Category {
    id: number;
    name: string;
    type: string;
    color: string;
}

const TABS = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'transactions', label: 'Lançamentos', icon: '📋' },
    { id: 'new', label: 'Novo Lançamento', icon: '➕' },
    { id: 'import', label: 'Importar Planilha', icon: '📥' },
];

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const METHOD_LABELS: Record<string, string> = {
    pix: 'PIX', boleto: 'Boleto', cartao: 'Cartão', dinheiro: 'Dinheiro', transferencia: 'TED',
};

export default function FluxoCaixaPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState({
        description: '', amount: '', type: 'expense' as 'income' | 'expense',
        categoryId: '', date: now.toISOString().split('T')[0],
        paymentMethod: 'pix', status: 'confirmed', notes: '',
    });

    // Import state
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        const from = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const to = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${lastDay}`;

        Promise.all([
            fetch('/api/transactions/summary').then(r => r.json()).catch(() => null),
            fetch(`/api/transactions?from=${from}&to=${to}`).then(r => r.json()).catch(() => ({ transactions: [] })),
            fetch('/api/categories').then(r => r.json()).catch(() => ({ categories: [] })),
        ]).then(([s, t, c]) => {
            setSummary(s);
            setTransactions(t.transactions || []);
            setCategories(c.categories || []);
        }).finally(() => setLoading(false));
    }, [selectedYear, selectedMonth]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

    const filteredTransactions = transactions.filter(tx => {
        if (filterType !== 'all' && tx.type !== filterType) return false;
        if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: parseFloat(form.amount.replace(',', '.')),
                    categoryId: form.categoryId ? parseInt(form.categoryId) : null,
                }),
            });
            if (res.ok) {
                setForm({ description: '', amount: '', type: 'expense', categoryId: '', date: now.toISOString().split('T')[0], paymentMethod: 'pix', status: 'confirmed', notes: '' });
                setActiveTab('transactions');
                fetchData();
            }
        } catch { /* ignore */ } finally { setFormLoading(false); }
    }

    async function handleDelete(id: number) {
        if (!confirm('Excluir este lançamento?')) return;
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        fetchData();
    }

    async function handleImport() {
        if (!importFile) return;
        setImportLoading(true);
        setImportResult(null);
        const formData = new FormData();
        formData.append('file', importFile);
        try {
            const res = await fetch('/api/transactions/import', { method: 'POST', body: formData });
            const data = await res.json();
            setImportResult(data);
            if (data.success > 0) fetchData();
        } catch { setImportResult({ success: 0, errors: ['Erro de conexão'] }); }
        finally { setImportLoading(false); }
    }

    const filteredCategories = categories.filter(c => c.type === form.type);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                        Gestão de Fluxo de Caixa
                    </h1>
                    <p className="text-slate-500 mt-1">Controle de entradas e saídas financeiras</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-sm text-slate-700 border-none outline-none cursor-pointer">
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent text-sm text-slate-700 border-none outline-none cursor-pointer">
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setActiveTab('new')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-emerald-200">
                        <Plus className="w-4 h-4" /> Novo Lançamento
                    </button>
                </div>
            </div>

            {/* Saldo bar */}
            <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border shadow-sm">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-slate-500">Saldo Geral:</span>
                <span className={`text-sm font-bold ${(summary?.allTimeBalance ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmt(summary?.allTimeBalance ?? 0)}
                </span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                            ${activeTab === tab.id
                                ? 'border-emerald-600 text-emerald-700'
                                : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}>
                        <span>{tab.icon}</span>{tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                </div>
            ) : (
                <>
                    {/* === OVERVIEW === */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <SummaryCard label="Entradas (Mês)" value={fmt(summary?.monthlyIncome ?? 0)} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
                                <SummaryCard label="Saídas (Mês)" value={fmt(summary?.monthlyExpense ?? 0)} icon={<TrendingDown className="w-5 h-5" />} color="red" />
                                <SummaryCard label="Saldo Mensal" value={fmt(summary?.monthlyBalance ?? 0)} icon={<PiggyBank className="w-5 h-5" />} color="blue" />
                                <SummaryCard label="Saldo Geral" value={fmt(summary?.allTimeBalance ?? 0)} icon={<Wallet className="w-5 h-5" />} color="amber" />
                                <SummaryCard label="Transações" value={String(transactions.length)} icon={<FileDown className="w-5 h-5" />} color="indigo" />
                            </div>

                            {/* Recent table */}
                            <div className="bg-white rounded-xl border shadow-sm">
                                <div className="flex items-center justify-between px-5 py-4 border-b">
                                    <h2 className="text-base font-semibold text-slate-900">Últimos Lançamentos</h2>
                                    <button onClick={() => setActiveTab('transactions')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Ver todos →</button>
                                </div>
                                {transactions.length === 0 ? (
                                    <div className="px-5 py-12 text-center">
                                        <div className="text-4xl mb-3">💰</div>
                                        <h3 className="text-sm font-medium text-slate-700 mb-1">Nenhum lançamento este mês</h3>
                                        <p className="text-xs text-slate-400">Comece registrando suas entradas e saídas.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50">
                                                    <th className="text-left px-5 py-3 font-medium">Data</th>
                                                    <th className="text-left px-5 py-3 font-medium">Descrição</th>
                                                    <th className="text-left px-5 py-3 font-medium">Tipo</th>
                                                    <th className="text-left px-5 py-3 font-medium">Método</th>
                                                    <th className="text-right px-5 py-3 font-medium">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.slice(0, 5).map(tx => (
                                                    <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-5 py-3.5 text-sm text-slate-500">{fmtDate(tx.date)}</td>
                                                        <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{tx.description}</td>
                                                        <td className="px-5 py-3.5"><TypeBadge type={tx.type} /></td>
                                                        <td className="px-5 py-3.5 text-sm text-slate-400">{tx.paymentMethod ? METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod : '—'}</td>
                                                        <td className={`px-5 py-3.5 text-sm font-bold text-right tabular-nums ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                            {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* === TRANSACTIONS === */}
                    {activeTab === 'transactions' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border shadow-sm flex-1 min-w-[200px] max-w-sm">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Buscar lançamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
                                </div>
                                <div className="flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1">
                                    {[{ value: 'all', label: 'Todos' }, { value: 'income', label: 'Entradas' }, { value: 'expense', label: 'Saídas' }].map(ft => (
                                        <button key={ft.value} onClick={() => setFilterType(ft.value)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterType === ft.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {ft.label}
                                        </button>
                                    ))}
                                </div>
                                <span className="ml-auto text-xs text-slate-400">{filteredTransactions.length} lançamentos</span>
                            </div>

                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                {filteredTransactions.length === 0 ? (
                                    <div className="px-5 py-16 text-center">
                                        <div className="text-4xl mb-3">🔍</div>
                                        <h3 className="text-sm font-medium text-slate-700 mb-1">Nenhum lançamento encontrado</h3>
                                        <p className="text-xs text-slate-400">Tente ajustar os filtros ou adicione um novo lançamento.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50">
                                                    <th className="text-left px-5 py-3 font-medium">Data</th>
                                                    <th className="text-left px-5 py-3 font-medium">Descrição</th>
                                                    <th className="text-left px-5 py-3 font-medium">Tipo</th>
                                                    <th className="text-left px-5 py-3 font-medium">Método</th>
                                                    <th className="text-left px-5 py-3 font-medium">Status</th>
                                                    <th className="text-right px-5 py-3 font-medium">Valor</th>
                                                    <th className="text-right px-5 py-3 font-medium">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTransactions.map(tx => (
                                                    <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors group">
                                                        <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{fmtDate(tx.date)}</td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="text-sm text-slate-900 font-medium">{tx.description}</div>
                                                            {tx.notes && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{tx.notes}</div>}
                                                        </td>
                                                        <td className="px-5 py-3.5"><TypeBadge type={tx.type} /></td>
                                                        <td className="px-5 py-3.5 text-sm text-slate-400">{tx.paymentMethod ? METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod : '—'}</td>
                                                        <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                                                        <td className={`px-5 py-3.5 text-sm font-bold text-right tabular-nums whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                            {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount))}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <button onClick={() => handleDelete(tx.id)} title="Excluir"
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                                                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-slate-600">Total do Período</td>
                                                    <td className="px-5 py-3 text-sm font-bold text-right tabular-nums text-slate-900">{fmt(totalIncome - totalExpense)}</td>
                                                    <td />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* === NEW TRANSACTION === */}
                    {activeTab === 'new' && (
                        <div className="max-w-2xl animate-in fade-in duration-300">
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-5">Novo Lançamento</h2>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="flex rounded-lg overflow-hidden border">
                                        <button type="button" onClick={() => setForm({ ...form, type: 'income', categoryId: '' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${form.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                            <ArrowUpCircle className="w-4 h-4" /> Entrada
                                        </button>
                                        <button type="button" onClick={() => setForm({ ...form, type: 'expense', categoryId: '' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${form.type === 'expense' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                            <ArrowDownCircle className="w-4 h-4" /> Saída
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Descrição *</label>
                                        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Pagamento fornecedor" required
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Valor (R$) *</label>
                                            <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" required
                                                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Data *</label>
                                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
                                                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Categoria</label>
                                            <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all">
                                                <option value="">Selecione...</option>
                                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Método</label>
                                            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all">
                                                <option value="pix">PIX</option>
                                                <option value="boleto">Boleto</option>
                                                <option value="cartao">Cartão</option>
                                                <option value="dinheiro">Dinheiro</option>
                                                <option value="transferencia">Transferência</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Observações</label>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas opcionais..." rows={2}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none" />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setActiveTab('transactions')}
                                            className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={formLoading}
                                            className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200">
                                            {formLoading ? '⏳ Salvando...' : '✓ Registrar Lançamento'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* === IMPORT TAB === */}
                    {activeTab === 'import' && (
                        <div className="max-w-2xl animate-in fade-in duration-300">
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-2">Importar Lançamentos via Planilha</h2>
                                <p className="text-sm text-slate-500 mb-5">Faça upload de um arquivo Excel (.xlsx) com seus lançamentos para importação em massa.</p>

                                <div className="mb-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <h3 className="text-sm font-semibold text-emerald-800 mb-2">📥 Baixar Template</h3>
                                    <p className="text-xs text-emerald-700 mb-3">Use o template abaixo para preencher seus dados no formato correto.</p>
                                    <a href="/api/transactions/import?template=true" download="template_transacoes.xlsx"
                                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                                        <FileDown className="w-4 h-4" /> Baixar Template Excel
                                    </a>
                                </div>

                                <div className="mb-5">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Colunas do Template:</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border rounded-lg overflow-hidden">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="text-left px-3 py-2 font-medium text-slate-600">Coluna</th>
                                                    <th className="text-left px-3 py-2 font-medium text-slate-600">Obrigatório</th>
                                                    <th className="text-left px-3 py-2 font-medium text-slate-600">Exemplo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    ['descricao', 'Sim', 'Pagamento fornecedor X'],
                                                    ['valor', 'Sim', '1500.50'],
                                                    ['tipo', 'Sim', 'expense ou income'],
                                                    ['data', 'Sim', '2026-02-15'],
                                                    ['metodo_pagamento', 'Não', 'pix, boleto, cartao, dinheiro, transferencia'],
                                                    ['status', 'Não', 'confirmed, pending'],
                                                    ['observacoes', 'Não', 'Nota fiscal #123'],
                                                ].map(([col, req, ex]) => (
                                                    <tr key={col} className="border-t border-slate-100">
                                                        <td className="px-3 py-2 font-mono text-slate-700">{col}</td>
                                                        <td className="px-3 py-2">{req === 'Sim' ? <span className="text-red-600 font-bold">Sim</span> : <span className="text-slate-400">Não</span>}</td>
                                                        <td className="px-3 py-2 text-slate-500">{ex}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <input type="file" accept=".xlsx,.xls,.csv"
                                        onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                                        className="hidden" id="file-upload" />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <span className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Clique para selecionar</span>
                                        <span className="text-sm text-slate-400"> ou arraste o arquivo aqui</span>
                                    </label>
                                    {importFile && (
                                        <div className="mt-3 text-sm text-slate-700 font-medium">📎 {importFile.name}</div>
                                    )}
                                </div>

                                {importResult && (
                                    <div className={`mt-4 p-4 rounded-lg border ${importResult.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                        {importResult.success > 0 && <p className="text-sm text-emerald-700 font-medium">✅ {importResult.success} lançamentos importados com sucesso!</p>}
                                        {importResult.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm text-red-700 font-medium mb-1">⚠️ Erros encontrados:</p>
                                                <ul className="text-xs text-red-600 space-y-0.5">
                                                    {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-5">
                                    <button type="button" onClick={() => setActiveTab('overview')}
                                        className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Voltar</button>
                                    <button onClick={handleImport} disabled={!importFile || importLoading}
                                        className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200">
                                        {importLoading ? '⏳ Importando...' : '📤 Importar Lançamentos'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ---------- Sub-components ---------- */

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
    const colorMap: Record<string, { bg: string; text: string; icon: string; border: string }> = {
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-l-emerald-500' },
        red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', border: 'border-l-red-500' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-l-blue-500' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', border: 'border-l-amber-500' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600', border: 'border-l-indigo-500' },
    };
    const c = colorMap[color] || colorMap.blue;
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

function TypeBadge({ type }: { type: string }) {
    return type === 'income'
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Entrada</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Saída</span>;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
}
