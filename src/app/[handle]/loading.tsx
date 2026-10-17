import { Loader2 } from 'lucide-react';

export default function HandleProfileLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Loading Profile...
      </p>
    </main>
  );
}
