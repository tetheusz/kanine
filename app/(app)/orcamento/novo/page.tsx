'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Category {
    id: number;
    name: string;
    type: string;
}

export default function NovoOrcamentoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [form, setForm] = useState({
        name: '',
        categoryId: '',
        plannedAmount: '',
        periodType: 'monthly',
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: '',
        alertThreshold: '80',
        notes: '',
    });

    useEffect(() => {
        fetch('/api/categories').then(r => r.json()).then(d => {
            setCategories((d.categories || []).filter((c: Category) => c.type === 'expense'));
        });

        // Default end date: 1 month from now
        const end = new Date();
        end.setMonth(end.getMonth() + 1);
        setForm(f => ({ ...f, periodEnd: end.toISOString().split('T')[0] }));
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    plannedAmount: parseFloat(form.plannedAmount.replace(',', '.')),
                    categoryId: form.categoryId ? parseInt(form.categoryId) : null,
                    alertThreshold: parseFloat(form.alertThreshold),
                }),
            });

            if (res.ok) {
                router.push('/orcamento');
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao salvar');
            }
        } catch {
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Novo Orçamento</h1>
                <p className="text-slate-500 mt-1">Defina um limite de gastos para acompanhar</p>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Nome do Orçamento *</label>
                            <Input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Ex: Orçamento de Marketing - Fev 2026"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Valor Planejado (R$) *</label>
                                <Input
                                    value={form.plannedAmount}
                                    onChange={e => setForm({ ...form, plannedAmount: e.target.value })}
                                    placeholder="5.000,00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Categoria</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={form.categoryId}
                                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                >
                                    <option value="">Todas as categorias</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Período</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={form.periodType}
                                    onChange={e => setForm({ ...form, periodType: e.target.value })}
                                >
                                    <option value="monthly">Mensal</option>
                                    <option value="quarterly">Trimestral</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Início *</label>
                                <Input
                                    type="date"
                                    value={form.periodStart}
                                    onChange={e => setForm({ ...form, periodStart: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Fim *</label>
                                <Input
                                    type="date"
                                    value={form.periodEnd}
                                    onChange={e => setForm({ ...form, periodEnd: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Alerta quando atingir (%) — Atual: {form.alertThreshold}%
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={form.alertThreshold}
                                onChange={e => setForm({ ...form, alertThreshold: e.target.value })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Observações</label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notas opcionais sobre este orçamento..."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                                {loading ? '⏳ Salvando...' : '✓ Criar Orçamento'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
