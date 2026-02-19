import Image from 'next/image';

export function K9Logo({ className = 'w-12 h-12' }: { className?: string }) {
    // Determine size based on className for Image optimization
    const size = className.includes('w-16') ? 64 : className.includes('w-4') ? 16 : 48;

    return (
        <div className={`relative ${className} flex-shrink-0`}>
            <Image
                src="/k9-logo-v2.png"
                alt="Kanine Logo"
                fill
                className="object-contain" // Use v2 to bust cache
                priority
            />
        </div>
    );
}

export function KanineBrand({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
    const textSizes = {
        small: 'text-base',
        default: 'text-lg',
        large: 'text-2xl',
    };
    const iconSizes = {
        small: 'w-8 h-8',
        default: 'w-10 h-10',
        large: 'w-14 h-14',
    };

    return (
        <span className="inline-flex items-center gap-3">
            <K9Logo className={iconSizes[size]} />
            <span className={`${textSizes[size]} font-bold tracking-tight`}>
                <span className="text-stone-900">Kan</span>
                <span className="text-amber-500">i</span>
                <span className="text-stone-900">ne</span>
            </span>
        </span>
    );
}
