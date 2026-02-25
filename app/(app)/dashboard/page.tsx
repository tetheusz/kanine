'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, PieChart as PieIcon, ListChecks, FileText, Search, Filter } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusDistributionChart, ValueTrendChart } from '@/components/dashboard/charts';
import { DashboardFilters } from '@/components/dashboard/filters';

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

export default function DashboardPage() {
    const { data: session } = useSession();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [chatLoading, setChatLoading] = useState<number | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const router = useRouter();

    useEffect(() => {
        fetchContracts();
    }, []);

    async function fetchContracts() {
        try {
            const res = await fetch('/api/contracts');
            const data = await res.json();
            setContracts(Array.isArray(data.contracts) ? data.contracts : []);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: number) {
        try {
            await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
            setContracts(contracts.filter((c) => c.id !== id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting contract:', error);
        }
    }

    async function handleUpdate(contract: Contract) {
        try {
            const res = await fetch(`/api/contracts/${contract.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parties: contract.parties,
                    signatureDate: contract.signatureDate,
                    expiryDate: contract.expiryDate,
                    value: contract.value,
                    cancellationClauses: contract.cancellationClauses,
                    summary: contract.summary,
                }),
            });
            const updated = await res.json();
            setContracts(contracts.map((c) => (c.id === updated.id ? { ...updated, status: contract.status } : c)));
            setEditingContract(null);
        } catch (error) {
            console.error('Error updating contract:', error);
        }
    }

    // Filter Logic
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            const matchesSearch = c.filename.toLowerCase().includes(search.toLowerCase()) ||
                (c.parties && c.parties.toLowerCase().includes(search.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [contracts, search, statusFilter]);

    const metrics = {
        total: contracts.length,
        active: contracts.filter((c) => c.status === 'active').length,
        expiring: contracts.filter((c) => c.status === 'expiring').length,
        expired: contracts.filter((c) => c.status === 'expired').length,
        totalValue: contracts.reduce((acc, c) => {
            // Simple clean up for value sum display
            const val = parseFloat(c.value?.replace(/[^0-9,.]/g, '').replace(',', '.') || '0');
            return acc + val;
        }, 0)
    };

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Controle</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500">Visão estratégica dos contratos</p>
                        {session?.user?.companyName && (
                            <Badge variant="outline" className="text-slate-700 bg-slate-50 border-slate-200 shadow-sm font-medium rounded-full px-3 py-0.5">
                                🏢 {session.user.companyName}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button onClick={() => router.push('/upload')} className="bg-primary hover:bg-primary/90 text-white shadow-sm rounded-full px-6">
                    + Novo Contrato
                </Button>
            </div>

            {/* Critical Alerts */}
            {metrics.expiring > 0 && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900 font-bold">Atenção Necessária</AlertTitle>
                    <AlertDescription className="text-amber-800">
                        Você tem <strong>{metrics.expiring} contratos</strong> vencendo nos próximos 30 dias. Verifique a lista abaixo.
                    </AlertDescription>
                </Alert>
            )}

            {/* Metrics Grid (Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total de Contratos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{metrics.total}</div>
                        <p className="text-xs text-slate-400 mt-1">Base completa</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{metrics.active}</div>
                        <p className="text-xs text-emerald-600/70 mt-1">Em vigência</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Vencendo (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-500">{metrics.expiring}</div>
                        <p className="text-xs text-amber-600/70 mt-1">Requer atenção</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Vencidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{metrics.expired}</div>
                        <p className="text-xs text-red-600/70 mt-1">Renovação pendente</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            {contracts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rounded-2xl border-slate-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <PieIcon className="h-5 w-5 text-primary" />
                                Distribuição de Status
                            </CardTitle>
                            <CardDescription>Visão percentual da carteira</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StatusDistributionChart contracts={contracts} />
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-slate-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Volume Cadastrado (6 Meses)
                            </CardTitle>
                            <CardDescription>Valor total de contratos por mês de criação</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ValueTrendChart contracts={contracts} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters & Actions */}
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-emerald-600" />
                        Lista de Contratos
                    </h2>
                </div>
                <DashboardFilters
                    search={search} onSearchChange={setSearch}
                    statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
                />


                {/* Contracts List Table View could be better here, but Cards are fine for now */}
                {filteredContracts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
                        {contracts.length === 0 ? (
                            <>
                                <div className="text-5xl mb-4">📂</div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum contrato cadastrado</h3>
                                <p className="text-slate-500 mb-6">Comece fazendo upload dos seus documentos.</p>
                                <Button onClick={() => router.push('/upload')} variant="outline">Ir para Upload</Button>
                            </>
                        ) : (
                            <div className="text-slate-500">Nenhum contrato encontrado com os filtros atuais.</div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredContracts.map((contract) => (
                            <Card
                                key={contract.id}
                                className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white"
                                onClick={() => router.push(`/contracts/${contract.id}`)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-900 line-clamp-1 break-all" title={contract.filename}>
                                                {contract.filename}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <Badge
                                            className="ml-auto shrink-0 font-medium tracking-wide rounded-full px-3 py-0.5"
                                            variant={
                                                contract.status === 'active' ? 'default' :
                                                    contract.status === 'expiring' ? 'secondary' :
                                                        contract.status === 'expired' ? 'destructive' : 'outline'
                                            }
                                        >
                                            {contract.status === 'active' ? 'Ativo' :
                                                contract.status === 'expiring' ? 'Vencendo' :
                                                    contract.status === 'expired' ? 'Vencido' : 'N/A'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Valor</span>
                                            <span className="font-medium text-slate-900">{contract.value || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Vencimento</span>
                                            <span className="font-medium text-slate-900">{contract.expiryDate || '-'}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded mt-2 line-clamp-2 min-h-[40px]">
                                            {contract.summary || 'Sem resumo disponível.'}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            className="flex-1 bg-slate-50 hover:bg-primary hover:text-white text-slate-700 shadow-none border border-slate-200 rounded-full transition-colors"
                                            size="sm"
                                            onClick={async () => {
                                                setChatLoading(contract.id);
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
                                                    setChatLoading(null);
                                                }
                                            }}
                                        >
                                            {chatLoading === contract.id ? '⏳' : '💬 Chat'}
                                        </Button>

                                        {contract.fileKey && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => window.open(`/api/contracts/${contract.id}/download`, '_blank')}
                                                title="Baixar PDF Original"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                ⬇️
                                            </Button>
                                        )}

                                        <Button variant="ghost" size="icon" onClick={() => setEditingContract(contract)} title="Editar">
                                            ✏️
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteConfirm(contract.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="Excluir"
                                        >
                                            🗑️
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Overlay (Custom for better UX) */}
            {deleteConfirm && (
                <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Excluir Contrato</DialogTitle>
                            <DialogDescription>
                                Tem certeza? Esta ação não pode ser desfeita. O arquivo e os dados serão removidos permanentemente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Confirmar Exclusão</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Edit Dialog */}
            {editingContract && (
                <Dialog open={!!editingContract} onOpenChange={() => setEditingContract(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Contrato</DialogTitle>
                            <DialogDescription>{editingContract.filename}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Partes</label>
                                <Input
                                    value={editingContract.parties || ''}
                                    onChange={(e) => setEditingContract({ ...editingContract, parties: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Data Assinatura</label>
                                    <Input
                                        value={editingContract.signatureDate || ''}
                                        onChange={(e) => setEditingContract({ ...editingContract, signatureDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Data Vencimento</label>
                                    <Input
                                        value={editingContract.expiryDate || ''}
                                        onChange={(e) => setEditingContract({ ...editingContract, expiryDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Valor</label>
                                <Input
                                    value={editingContract.value || ''}
                                    onChange={(e) => setEditingContract({ ...editingContract, value: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Cláusulas de Cancelamento</label>
                                <Textarea
                                    value={editingContract.cancellationClauses || ''}
                                    onChange={(e) => setEditingContract({ ...editingContract, cancellationClauses: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Resumo</label>
                                <Textarea
                                    value={editingContract.summary || ''}
                                    onChange={(e) => setEditingContract({ ...editingContract, summary: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setEditingContract(null)}>
                                    Cancelar
                                </Button>
                                <Button onClick={() => handleUpdate(editingContract)}>Salvar Alterações</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
