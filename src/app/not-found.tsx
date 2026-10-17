import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          TAYZ
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground">
            This profile or link could not be found. It may have been moved or is no longer active.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="h-10 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Back to Tayz</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
