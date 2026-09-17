'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export function TimeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const range = searchParams.get('range') || '30d';

  const handleValueChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap w-[80px]">Timeframe</span>
      <Select value={range} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger className="w-[200px] h-9 relative bg-card border-border">
          <SelectValue />
          {isPending && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            </div>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
