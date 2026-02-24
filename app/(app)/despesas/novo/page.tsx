'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const PETTY_CATEGORIES = [
    { value: 'alimentacao', label: '🍔 Alimentação' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'escritorio', label: '📎 Escritório' },
    { value: 'limpeza', label: '🧹 Limpeza' },
    { value: 'outros', label: '📦 Outros' },
];

export default function NovaDespesaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: 'geral',
        date: new Date().toISOString().split('T')[0],
        paidBy: '',
        notes: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/petty-cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: parseFloat(form.amount.replace(',', '.')),
                }),
            });

            if (res.ok) {
                router.push('/despesas');
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
        <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Lançamento Rápido</h1>
                <p className="text-slate-500 mt-1">Registre uma despesa pequena da caixinha</p>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700">O que foi comprado? *</label>
                            <Input
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Ex: Café para o escritório"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Valor (R$) *</label>
                                <Input
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Data</label>
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Categoria</label>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                                {PETTY_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, category: cat.value })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${form.category === cat.value
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Quem pagou?</label>
                            <Input
                                value={form.paidBy}
                                onChange={e => setForm({ ...form, paidBy: e.target.value })}
                                placeholder="Nome da pessoa (opcional)"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Observações</label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notas opcionais..."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                                {loading ? '⏳ Salvando...' : '✓ Lançar Despesa'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
