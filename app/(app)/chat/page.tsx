'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Send, FileText, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatContext {
    text: string;
    filename: string;
    summary: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<ChatContext | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        // Load context from upload
        const savedContext = localStorage.getItem('chatContext');
        if (savedContext) {
            const parsed = JSON.parse(savedContext);
            setContext(parsed);

            // Initial greeting
            setMessages([
                {
                    role: 'assistant',
                    content: `Olá! Estou pronto para analisar o contrato **"${parsed.filename}"**. \n\nVocê pode perguntar sobre multas, prazos, obrigações ou pedir explicações de cláusulas.`
                }
            ]);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !context) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    context: context.text
                })
            });

            if (!res.ok) throw new Error('Falha na comunicação');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um erro ao processar sua pergunta. Tente novamente.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!context) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-6">
                <div className="bg-slate-50 p-12 rounded-lg border border-slate-200">
                    <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">Nenhum contrato selecionado</h2>
                    <p className="text-slate-600 max-w-md mx-auto">
                        Para usar o chat, primeiro faça o upload de um contrato na página de Upload.
                    </p>
                    <Button onClick={() => router.push('/upload')} className="mt-6">
                        Ir para Upload
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-3xl">💬</span> Chat com Contrato
                    </h1>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3" />
                        Analisando: <span className="font-medium text-slate-700">{context.filename}</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                    localStorage.removeItem('chatContext');
                    setContext(null);
                    router.push('/upload');
                }}>
                    <Upload className="w-4 h-4 mr-2" /> Novo Arquivo
                </Button>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-0 flex flex-col h-full bg-slate-50/50">
                    <div className="flex-1 p-6 overflow-y-auto" ref={scrollRef}>
                        <div className="space-y-6">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex gap-3"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pergunte sobre multas, prazos, obrigações..."
                                className="flex-1"
                                disabled={loading}
                            />
                            <Button type="submit" disabled={loading || !input.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
