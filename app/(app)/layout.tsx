import { Navigation } from '@/components/navigation';

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    );
}
