'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SidebarContent } from '@/components/dashboard/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, Menu } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface Props {
  user: User;
}

export function DashboardHeader({ user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const name = user.user_metadata?.full_name ?? user.email ?? 'User';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 h-[72px] border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-colors">
      {/* Mobile Burger Menu & Logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger className="p-2 -ml-2 text-foreground hover:bg-accent rounded-lg transition-colors flex items-center justify-center">
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-border flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Dashboard navigation menu</SheetDescription>
            <SidebarContent pathname={pathname} onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="text-xl font-bold text-foreground">
          Ano<span className="text-brand-400">ya</span>
        </Link>
      </div>

      {/* Page title placeholder (Desktop) */}
      <div className="hidden lg:block" />

      {/* User menu & Theme toggle */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-3 rounded-xl hover:bg-card text-card-foreground px-3 py-2 transition-colors cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-none">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-none">{user.email}</p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-brand-500/20 text-brand-300 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">My Account</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="flex items-center cursor-pointer w-full">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/settings" className="flex items-center cursor-pointer w-full">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-red-400 cursor-pointer focus:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
