'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  BarChart3,
  CreditCard,
  UserCheck,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/cards', label: 'My Cards', icon: CreditCard },
  { href: '/dashboard/connections', label: 'My Connections', icon: UserCheck },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-card border-r border-border z-40">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

export function SidebarContent({ pathname, onItemClick }: { pathname: string, onItemClick?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Link href="/" className="text-xl font-bold text-foreground tracking-tight" onClick={onItemClick}>
          Tap<span className="text-indigo-400">That</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-400' : '')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-zinc-600">TapThat MVP · v0.1.0</p>
      </div>
    </>
  );
}
