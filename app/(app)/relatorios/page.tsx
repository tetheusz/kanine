'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart, Calendar,
    ArrowRight, ChevronDown, Download, Filter
} from 'lucide-react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

interface DREData {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    margin: number;
    incomeCategories: { name: string; value: number }[];
    expenseCategories: { name: string; value: number }[];
}

interface CashFlowData {
    month: string;
    receitas: number;
    despesas: number;
    resultado: number;
}

export default function RelatoriosPage() {
    const [dateRange, setDateRange] = useState({
        from: format(startOfYear(new Date()), 'yyyy-MM-dd'),
        to: format(endOfYear(new Date()), 'yyyy-MM-dd'),
    });
    const [dre, setDre] = useState<DREData | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dreRes, cfRes] = await Promise.all([
                fetch(`/api/reports/dre?from=${dateRange.from}&to=${dateRange.to}`).then(r => r.json()),
                fetch(`/api/reports/cash-flow?from=${dateRange.from}&to=${dateRange.to}`).then(r => r.json()),
            ]);
            setDre(dreRes);
            setCashFlow(cfRes.data || []);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Relatórios Financeiros</h1>
                    <p className="text-slate-500 mt-1">Visão analítica do desempenho da empresa</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2 group">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="text-xs font-medium text-slate-600 outline-none border-none bg-transparent"
                        />
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="text-xs font-medium text-slate-600 outline-none border-none bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard
                            title="Receita Bruta"
                            value={fmt(dre?.totalIncome || 0)}
                            icon={<TrendingUp className="w-5 h-5" />}
                            trend="+12% vs mês ant."
                            color="emerald"
                        />
                        <SummaryCard
                            title="Despesas Totais"
                            value={fmt(dre?.totalExpense || 0)}
                            icon={<TrendingDown className="w-5 h-5" />}
                            trend="-5% vs mês ant."
                            color="red"
                        />
                        <SummaryCard
                            title="Lucro Líquido"
                            value={fmt(dre?.netProfit || 0)}
                            icon={<DollarSign className="w-5 h-5" />}
                            trend={dre?.netProfit && dre.netProfit > 0 ? "Positivo" : "Negativo"}
                            color={dre?.netProfit && dre.netProfit > 0 ? "blue" : "red"}
                        />
                        <SummaryCard
                            title="Margem de Lucro"
                            value={`${dre?.margin.toFixed(1)}%`}
                            icon={<PieChart className="w-5 h-5" />}
                            trend="Meta: 15%"
                            color="amber"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cash Flow Chart */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900">Fluxo de Caixa Mensal</h3>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Receitas
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                        <div className="w-2 h-2 rounded-full bg-red-400" /> Despesas
                                    </span>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                                        <Bar dataKey="despesas" fill="#f87171" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* DRE Summary */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6 overflow-hidden">
                            <h3 className="font-bold text-slate-900 mb-6">DRE Resumido</h3>
                            <div className="space-y-4">
                                <DRERow label="(+) Receita Operacional Bruta" value={fmt(dre?.totalIncome || 0)} bold primary />
                                <div className="pl-4 space-y-2">
                                    {dre?.incomeCategories.map(c => (
                                        <DRERow key={c.name} label={c.name} value={fmt(c.value)} small />
                                    ))}
                                </div>
                                <DRERow label="(-) Custos e Despesas" value={fmt(dre?.totalExpense || 0)} bold danger />
                                <div className="pl-4 space-y-2 max-h-[150px] overflow-y-auto">
                                    {dre?.expenseCategories.map(c => (
                                        <DRERow key={c.name} label={c.name} value={fmt(c.value)} small />
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <DRERow
                                        label="(=) LUCRO LÍQUIDO"
                                        value={fmt(dre?.netProfit || 0)}
                                        bold
                                        large
                                        color={dre?.netProfit && dre.netProfit > 0 ? 'text-emerald-600' : 'text-red-600'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function SummaryCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
    };

    return (
        <div className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{value}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-2 flex items-center gap-1">
                <ArrowRight className="w-2.5 h-2.5" /> {trend}
            </p>
        </div>
    );
}

function DRERow({ label, value, bold = false, small = false, large = false, primary = false, danger = false, color }: any) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className={`
                ${bold ? 'font-bold' : 'font-medium'} 
                ${small ? 'text-xs text-slate-500' : 'text-sm text-slate-700'}
                ${large ? 'text-base' : ''}
             uppercase tracking-tight`}>
                {label}
            </span>
            <span className={`
                tabular-nums
                ${bold ? 'font-bold' : 'font-medium'} 
                ${small ? 'text-xs' : 'text-sm'}
                ${primary ? 'text-emerald-700' : ''}
                ${danger ? 'text-red-700' : ''}
                ${color || 'text-slate-900'}
            `}>
                {value}
            </span>
        </div>
    );
}
