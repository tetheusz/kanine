'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Contract {
    id: number;
    filename: string;
    parties: string | null;
    signatureDate: string | null;
    expiryDate: string | null;
    value: string | null;
    cancellationClauses: string | null;
    summary: string | null;
    extractionMethod: string | null;
    createdAt: string;
    rawText: string | null;
    fileKey: string | null;
    companyId: number | null;
    status: 'active' | 'expiring' | 'expired' | 'unknown';
}

export default function ContractDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        if (id) fetchContract();
    }, [id]);

    async function fetchContract() {
        try {
            const res = await fetch(`/api/contracts/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setContract(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-semibold text-slate-700">Contrato não encontrado</h2>
                <Button onClick={() => router.push('/dashboard')}>Voltar ao Painel</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-serif font-bold text-slate-900 truncate" title={contract.filename}>{contract.filename}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                                contract.status === 'active' ? 'default' :
                                    contract.status === 'expiring' ? 'secondary' :
                                        contract.status === 'expired' ? 'destructive' : 'outline'
                            }>
                                {contract.status === 'active' ? 'Ativo' :
                                    contract.status === 'expiring' ? 'Vencendo' :
                                        contract.status === 'expired' ? 'Vencido' : 'N/A'}
                            </Badge>
                            <span className="text-sm text-slate-500 hidden sm:inline-block">
                                • Adicionado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0 self-end md:self-auto items-center">
                    {/* DEBUG INFO - REMOVE LATER */}
                    <div className="text-[10px] text-slate-300 font-mono hidden md:block">
                        ID: {contract.id} | Key: {contract.fileKey ? '✅' : '❌'}
                    </div>
                    {contract.fileKey && (
                        <Button variant="outline" onClick={() => window.open(`/api/contracts/${contract.id}/download`, '_blank')}>
                            <Download className="mr-2 h-4 w-4" /> Baixar PDF
                        </Button>
                    )}
                    <Button
                        className="bg-slate-900 text-white hover:bg-slate-800"
                        onClick={async () => {
                            setChatLoading(true);
                            try {
                                const res = await fetch(`/api/contracts/${contract.id}/text`);
                                if (!res.ok) throw new Error('Texto indisponível');
                                const data = await res.json();
                                localStorage.setItem('chatContext', JSON.stringify({
                                    text: data.text,
                                    filename: data.filename,
                                    summary: data.summary
                                }));
                                router.push('/chat');
                            } catch {
                                alert('Erro ao carregar chat.');
                            } finally {
                                setChatLoading(false);
                            }
                        }}
                    >
                        {chatLoading ? '⏳' : <><MessageSquare className="mr-2 h-4 w-4" /> Chat IA</>}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Key Info */}
                <div className="order-2 xl:order-1 xl:col-span-1 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-medium text-slate-500 uppercase tracking-wider">Valor Convertido</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-700">{contract.value || 'N/A'}</div>
                            <p className="text-xs text-slate-400 mt-1">Valor identificado no documento</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-medium text-slate-500 uppercase tracking-wider">Datas Importantes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-1">Data de Assinatura</h4>
                                <div className="text-lg text-slate-900 p-2 bg-slate-50 rounded border border-slate-100">
                                    {contract.signatureDate || '-'}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-1">Data de Vencimento</h4>
                                <div className="text-lg text-slate-900 p-2 bg-slate-50 rounded border border-slate-100">
                                    {contract.expiryDate || '-'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Text Details */}
                <div className="order-1 xl:order-2 xl:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Partes Envolvidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 p-4 rounded-md border text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                {contract.parties || 'Não identificado'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Resumo do Contrato</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 p-4 rounded-md border text-slate-700 leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-slate-200">
                                {contract.summary || 'Sem resumo disponível.'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-amber-100">
                        <CardHeader className="bg-amber-50/30">
                            <CardTitle className="text-amber-800 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Cláusulas de Cancelamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 bg-amber-50/50 p-4 rounded-md border border-amber-100 text-slate-700 leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-amber-200">
                                {contract.cancellationClauses || 'Nenhuma cláusula de cancelamento identificada.'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
