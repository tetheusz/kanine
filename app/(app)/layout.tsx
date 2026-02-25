import { Sidebar } from '@/components/sidebar';

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <div className="flex h-full w-full p-2 md:p-3 gap-2">
                <div className="h-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col relative z-20 shrink-0">
                    <Sidebar />
                </div>
                <main className="flex-1 overflow-auto rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                    <div className="container mx-auto px-6 py-8 max-w-6xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
