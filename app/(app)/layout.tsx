import { Sidebar } from '@/components/sidebar';

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto px-6 py-8">{children}</div>
            </main>
        </div>
    );
}
