'use client';

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Contract } from '@/drizzle/schema';

// Colors for status
const COLORS = {
    active: '#22c55e', // green-500
    expiring: '#f59e0b', // amber-500
    expired: '#ef4444', // red-500
    unknown: '#94a3b8', // slate-400
};

interface DashboardChartsProps {
    contracts: (Contract & { status: 'active' | 'expiring' | 'expired' | 'unknown' })[];
}

export function StatusDistributionChart({ contracts }: DashboardChartsProps) {
    const data = [
        { name: 'Ativos', value: contracts.filter(c => c.status === 'active').length, color: COLORS.active },
        { name: 'Vencendo (30d)', value: contracts.filter(c => c.status === 'expiring').length, color: COLORS.expiring },
        { name: 'Vencidos', value: contracts.filter(c => c.status === 'expired').length, color: COLORS.expired },
    ].filter(item => item.value > 0);

    if (data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        itemStyle={{ color: '#1e293b' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ValueTrendChart({ contracts }: DashboardChartsProps) {
    // Group totals by month (simple approximation using createdAt or signatureDate)
    // Using createdAt for "New Value Added" metric
    const dataMap = new Map<string, number>();

    contracts.forEach(contract => {
        const date = new Date(contract.createdAt);
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`; // e.g. 2/2026

        // Parse BR currency: "R$ 1.000,00" -> 1000.00
        let val = 0;
        if (contract.value) {
            // 1. Remove non-numeric characters EXCEPT comma and dot
            // 2. Remove dots (thousands separator)
            // 3. Replace comma with dot (decimal separator)
            const clean = contract.value
                .replace(/[^0-9,.-]/g, '') // Keep minus just in case
                .replace(/\./g, '')        // Remove thousands dots
                .replace(',', '.');        // Convert decimal comma to dot

            val = parseFloat(clean) || 0;
        }

        dataMap.set(key, (dataMap.get(key) || 0) + val);
    });

    const data = Array.from(dataMap.entries())
        .map(([name, value]) => ({ name, value }))
        .slice(-6); // Last 6 months

    if (data.length === 0) return null;

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `R$ ${value / 1000}k`}
                    />
                    <Tooltip
                        formatter={(value?: number) => [`R$ ${(value || 0).toLocaleString('pt-BR')}`, 'Valor Total'] as any}
                        cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
