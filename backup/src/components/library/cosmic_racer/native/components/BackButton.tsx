'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BackButtonContent({ defaultPath = '/dashboard/knowledge-mastery', label = '← Back' }: { defaultPath?: string, label?: string }) {
    const searchParams = useSearchParams();
    const backPath = searchParams.get('back') || defaultPath;

    return (
        <Link
            href={backPath}
            style={{
                position: 'absolute',
                top: '2rem',
                left: '2rem',
                display: 'block',
                marginBottom: '0',
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 500
            }}
        >
            {label}
        </Link>
    );
}

export default function BackButton(props: { defaultPath?: string, label?: string }) {
    return (
        <Suspense fallback={<Link href={props.defaultPath || '/dashboard/knowledge-mastery'} style={{ position: 'absolute', top: '2rem', left: '2rem' }}>← Back</Link>}>
            <BackButtonContent {...props} />
        </Suspense>
    );
}
