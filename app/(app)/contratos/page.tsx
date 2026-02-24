'use client';

import DashboardPage from '@/app/(app)/dashboard/page';

// Re-export: /contratos maps to the existing contract dashboard
// This keeps backward compatibility while reorganizing navigation
export default function ContratosPage() {
    return <DashboardPage />;
}
