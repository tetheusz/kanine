'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = async () => {
        try {
            const res = await fetch('/api/notifications?unread=true');
            const data = await res.json();
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchUnread();
        // Refresh every 2 minutes
        const interval = setInterval(fetchUnread, 120000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link
            href="/notificacoes"
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            title="Notificações"
        >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
