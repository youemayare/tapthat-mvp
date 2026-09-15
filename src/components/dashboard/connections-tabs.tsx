'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ConnectionsTabs({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Connections',
      href: '/dashboard/connections',
      exact: true,
    },
    {
      name: 'Received Requests',
      href: '/dashboard/connections/requests',
      count: pendingCount,
    },
    {
      name: 'Sent Requests',
      href: '/dashboard/connections/sent',
    },
  ];

  return (
    <div className="flex items-center gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.exact 
          ? pathname === tab.href 
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors hover:text-foreground",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {tab.name}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant={isActive ? "default" : "secondary"} className="h-5 px-1.5 rounded-md">
                  {tab.count}
                </Badge>
              )}
            </div>
            {isActive && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
