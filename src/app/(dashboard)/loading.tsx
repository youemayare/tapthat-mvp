import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4 text-muted-foreground animate-in fade-in duration-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm font-medium tracking-wide">Loading...</p>
    </div>
  );
}
