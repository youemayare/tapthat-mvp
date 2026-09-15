import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ShieldAlert, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExchangeRequestCardProps {
  exchange: any;
  profile: any; // sourceProfile for received, targetProfile for sent
  type: 'received' | 'sent';
  onAction?: (action: 'accept' | 'reject' | 'block') => void;
}

export function ExchangeRequestCard({ exchange, profile, type, onAction }: ExchangeRequestCardProps) {
  const fullName = profile 
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') 
    : exchange.name || 'Unknown User';
    
  const jobTitle = profile?.jobTitle || exchange.jobTitle || 'No title';
  const timeAgo = formatDistanceToNow(new Date(exchange.createdAt), { addSuffix: true });

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    accepted: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    blocked: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border rounded-2xl gap-4">
      <div className="flex items-center gap-4">
        {profile?.profilePhotoUrl ? (
          <img
            src={profile.profilePhotoUrl}
            alt={fullName}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-brand-500">
              {fullName?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        
        <div>
          <h3 className="font-semibold text-foreground">
            {fullName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-sm">
            <span className="text-muted-foreground">{jobTitle}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {type === 'sent' || exchange.status !== 'pending' ? (
          <Badge variant="outline" className={statusColors[exchange.status as keyof typeof statusColors]}>
            {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onAction?.('accept')}
              className="rounded-full bg-brand-600 hover:bg-brand-500 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction?.('reject')}
              className="rounded-full"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction?.('block')}
              className="rounded-full text-muted-foreground hover:text-red-500"
            >
              <ShieldAlert className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
