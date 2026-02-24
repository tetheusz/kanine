'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Category {
    id: number;
    name: string;
    type: string;
    color: string;
}

export default function NovaTransacaoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [form, setForm] = useState({
        description: '',
        amount: '',
        type: 'expense' as 'income' | 'expense',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'pix',
        status: 'confirmed',
        notes: '',
    });

    useEffect(() => {
        fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
    }, []);

    const filteredCategories = categories.filter(c => c.type === form.type);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

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
                router.push('/fluxo-caixa');
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
                <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Nova Transação</h1>
                <p className="text-slate-500 mt-1">Registre uma entrada ou saída financeira</p>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Type Toggle */}
                        <div className="flex rounded-lg overflow-hidden border">
                            <button
                                type="button"
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${form.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                onClick={() => setForm({ ...form, type: 'income', categoryId: '' })}
                            >
                                💰 Entrada
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${form.type === 'expense' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                onClick={() => setForm({ ...form, type: 'expense', categoryId: '' })}
                            >
                                💸 Saída
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Descrição *</label>
                            <Input
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Ex: Pagamento fornecedor"
                                required
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
                                <label className="text-sm font-medium text-slate-700">Data *</label>
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Categoria</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={form.categoryId}
                                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {filteredCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Método</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={form.paymentMethod}
                                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                                >
                                    <option value="pix">PIX</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="cartao">Cartão</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="transferencia">Transferência</option>
                                </select>
                            </div>
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
                                {loading ? '⏳ Salvando...' : '✓ Registrar'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
