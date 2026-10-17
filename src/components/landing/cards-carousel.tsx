"use client";

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';

export interface CardFinishItem {
  id: string;
  name: string;
  src: string;
}

export function CardsCarousel({ cards }: { cards: CardFinishItem[] }) {
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true }, [WheelGesturesPlugin()]);

  return (
    <div className="overflow-hidden pb-12 cursor-grab active:cursor-grabbing" ref={emblaRef}>
      <div className="flex touch-pan-y">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex-[0_0_85vw] sm:flex-[0_0_500px] md:flex-[0_0_600px] min-w-0 flex flex-col items-center gap-6 px-4 md:px-8 group/card"
          >
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-border-medium group-hover/card:shadow-[0_0_60px_rgba(255,255,255,0.1)] group-hover/card:border-border-strong transition-all duration-500 select-none">
              <Image src={card.src} alt={card.name} fill className="object-cover group-hover/card:scale-105 transition-transform duration-1000 pointer-events-none" draggable={false} />
            </div>
            <div className="text-lg font-medium text-[#52525b] dark:text-[#a1a1aa] group-hover/card:text-foreground transition-colors duration-300">
              {card.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
