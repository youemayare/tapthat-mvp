import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function CardsLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">
      <div>
        <Skeleton className="h-8 w-48 mb-2 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
        <Skeleton className="h-4 w-64 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border overflow-hidden">
            <div className="h-32 bg-black/5 dark:bg-white/5" />
            <CardContent className="p-5">
              <Skeleton className="h-6 w-32 mb-2 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
              <Skeleton className="h-4 w-48 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 w-20 rounded-md bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
                <Skeleton className="h-8 w-20 rounded-md bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
