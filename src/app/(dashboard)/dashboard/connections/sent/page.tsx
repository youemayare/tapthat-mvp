'use client';

import { useEffect, useState } from 'react';
import { ExchangeRequestCard } from '@/components/dashboard/exchange-request-card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type SentData = {
  exchange: any;
  targetProfile: any;
};

export default function SentRequestsPage() {
  const [sent, setSent] = useState<SentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/exchange/sent')
      .then(res => res.json())
      .then(data => {
        if (data.sent) {
          setSent(data.sent);
        }
      })
      .catch(() => toast.error('Failed to load sent requests'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (sent.length === 0) {
    return (
      <div className="py-12 text-center border rounded-2xl bg-card">
        <p className="text-muted-foreground">You haven't sent any requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sent.map((req) => (
        <ExchangeRequestCard
          key={req.exchange.id}
          exchange={req.exchange}
          profile={req.targetProfile}
          type="sent"
        />
      ))}
    </div>
  );
}
