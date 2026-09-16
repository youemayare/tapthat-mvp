'use client';

import { useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

export default function RemoveExchangePage({ params }: { params: Promise<{ id: string, token: string }> }) {
  const unwrappedParams = use(params);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exchange/${unwrappedParams.id}/erasure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: unwrappedParams.token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove details');
      }

      setSuccess(true);
      toast.success('Your details have been removed');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Data Removed</h1>
          <p className="text-muted-foreground text-sm">
            Your contact details have been successfully removed and withdrawn from the recipient.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Revoke Access</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Are you sure you want to remove your shared contact details? This will permanently delete your information from the recipient's Anoya inbox.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={handleRemove} 
            disabled={loading}
            variant="destructive"
            className="w-full h-12 text-base font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Yes, remove my details
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
