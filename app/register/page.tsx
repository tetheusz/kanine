'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KanineBrand } from '@/components/k9-logo';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao criar conta');
                return;
            }

            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                router.push('/login');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2 text-stone-900">
                        <KanineBrand />
                    </Link>
                    <p className="text-stone-400 text-sm">Crie sua conta de auditoria</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
                            Nome
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Seu nome"
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900/30 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Criando Conta...' : 'Começar Auditoria'}
                    </button>
                </form>

                <p className="text-center text-sm text-stone-400 mt-8">
                    Já tem conta?{' '}
                    <Link href="/login" className="text-amber-600 font-medium hover:text-amber-700 transition-colors">
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    );
}
