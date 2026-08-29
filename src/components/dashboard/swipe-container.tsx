
"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, PanInfo } from "framer-motion";
import { navItems } from "./sidebar";

const SWIPE_THRESHOLD = 50;

export function SwipeContainer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // We only consider the bottom nav items (first 5 items) for swiping
  const swipeableItems = navItems.filter(i => i.label !== "Settings");
  const currentIndex = swipeableItems.findIndex(i => 
    i.exact ? pathname === i.href : pathname.startsWith(i.href)
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Swiped left, go to next tab
      if (currentIndex !== -1 && currentIndex < swipeableItems.length - 1) {
        router.push(swipeableItems[currentIndex + 1].href);
      }
    } else if (offset > SWIPE_THRESHOLD || velocity > 500) {
      // Swiped right, go to previous tab
      if (currentIndex !== -1 && currentIndex > 0) {
        router.push(swipeableItems[currentIndex - 1].href);
      }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      drag={isMobile ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="flex-1 w-full"
      style={{ touchAction: "pan-y" }}
    >
      {children}
    </motion.div>
  );
}

