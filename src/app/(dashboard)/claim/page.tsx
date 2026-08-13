import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClaimForm } from './claim-form';

export const metadata: Metadata = {
  title: 'Activate Card | Anoya',
  description: 'Link a physical NFC card to your Anoya account.',
};

interface Props {
  searchParams: Promise<{ uid?: string }>;
}

export default async function ClaimPage({ searchParams }: Props) {
  const { uid } = await searchParams;

  if (!uid || typeof uid !== 'string') {
    notFound();
  }

  const sanitizedUid = uid.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (sanitizedUid.length < 8) {
    notFound();
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <ClaimForm uid={sanitizedUid} />
      </div>
    </main>
  );
}
