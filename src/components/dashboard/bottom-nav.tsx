
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./sidebar";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  // Filter out settings because it is inside the avatar menu on mobile
  const items = navItems.filter(item => item.label !== "Settings");

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 lg:hidden pointer-events-none">
      <nav className="flex items-center justify-between gap-1 w-full max-w-sm px-2 py-2 bg-background/80 backdrop-blur-xl border border-border rounded-full shadow-lg pointer-events-auto">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all relative group",
                isActive 
                  ? "text-brand-500" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-full transition-opacity",
                isActive ? "bg-brand-500/10 opacity-100" : "opacity-0"
              )} />
              <Icon className={cn(
                "w-5 h-5 relative z-10 transition-transform duration-200",
                isActive ? "scale-110 stroke-[2.5px]" : "scale-100"
              )} />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

