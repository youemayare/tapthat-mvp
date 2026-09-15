'use client';

import { useEffect, useState } from 'react';
import { ExchangeRequestCard } from '@/components/dashboard/exchange-request-card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type RequestData = {
  exchange: any;
  sourceProfile: any;
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/exchange/requests')
      .then(res => res.json())
      .then(data => {
        if (data.requests) {
          setRequests(data.requests);
        }
      })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'block') => {
    try {
      const res = await fetch(`/api/exchange/${id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      
      toast.success(`Request ${action}ed`);
      setRequests(prev => prev.filter(r => r.exchange.id !== id));
      
      // Force a soft refresh of the layout to update the badge count
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center border rounded-2xl bg-card">
        <p className="text-muted-foreground">You have no pending requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <ExchangeRequestCard
          key={req.exchange.id}
          exchange={req.exchange}
          profile={req.sourceProfile}
          type="received"
          onAction={(action) => handleAction(req.exchange.id, action)}
        />
      ))}
    </div>
  );
}
