'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notif {
    id: number; type: string; title: string; message: string;
    severity: string; isRead: boolean; actionUrl: string | null;
    createdAt: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', dot: 'bg-blue-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', dot: 'bg-amber-500' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', dot: 'bg-red-500' },
};

export default function NotificacoesPage() {
    const [notifs, setNotifs] = useState<Notif[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const router = useRouter();

    const fetchNotifs = useCallback(() => {
        setLoading(true);
        // Generate notifications first, then fetch
        fetch('/api/notifications/generate').then(() =>
            fetch(`/api/notifications${filter === 'unread' ? '?unread=true' : ''}`).then(r => r.json())
        ).then(data => {
            setNotifs(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [filter]);

    useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

    async function markRead(id: number) {
        await fetch(`/api/notifications/${id}`, { method: 'PUT' });
        setNotifs(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
    }

    async function markAllRead() {
        await fetch('/api/notifications/read-all', { method: 'PUT' });
        setNotifs(ns => ns.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }

    function handleClick(n: Notif) {
        if (!n.isRead) markRead(n.id);
        if (n.actionUrl) router.push(n.actionUrl);
    }

    const grouped = notifs.reduce((acc, n) => {
        const d = new Date(n.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[d]) acc[d] = [];
        acc[d].push(n);
        return acc;
    }, {} as Record<string, Notif[]>);

    const fmtTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Notificações</h1>
                    <p className="text-slate-500 mt-1">Centro de alertas e avisos do sistema</p>
                </div>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full">{unreadCount} não lida{unreadCount > 1 && 's'}</span>
                    )}
                    <button onClick={markAllRead} disabled={unreadCount === 0}
                        className="flex items-center gap-2 bg-white border shadow-sm text-sm font-medium text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                        <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1 w-fit">
                {[{ v: 'all' as const, l: 'Todas' }, { v: 'unread' as const, l: 'Não lidas' }].map(f => (
                    <button key={f.v} onClick={() => setFilter(f.v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.v ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                        {f.l}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                </div>
            ) : notifs.length === 0 ? (
                <div className="bg-white rounded-xl border shadow-sm px-5 py-16 text-center">
                    <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-slate-700 mb-1">Nenhuma notificação</h3>
                    <p className="text-xs text-slate-400">Você está em dia! Notificações aparecerão aqui automaticamente.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 capitalize">{date}</h3>
                            <div className="space-y-2">
                                {items.map(n => {
                                    const s = SEVERITY_STYLES[n.severity] || SEVERITY_STYLES.info;
                                    return (
                                        <div key={n.id} onClick={() => handleClick(n)}
                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${n.isRead ? 'bg-white border-slate-100 hover:bg-slate-50' : `${s.bg} ${s.border} hover:shadow-sm`}`}>
                                            <div className="mt-1 flex flex-col items-center gap-1">
                                                {!n.isRead && <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />}
                                                {n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`text-sm font-semibold ${n.isRead ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</h4>
                                                    <span className="text-[10px] text-slate-400">{fmtTime(n.createdAt)}</span>
                                                </div>
                                                <p className={`text-sm mt-0.5 ${n.isRead ? 'text-slate-400' : 'text-slate-600'}`}>{n.message}</p>
                                            </div>
                                            {n.actionUrl && <ExternalLink className="w-4 h-4 text-slate-300 shrink-0 mt-1" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
