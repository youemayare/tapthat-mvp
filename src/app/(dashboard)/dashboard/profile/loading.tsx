import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="w-full">
        <Skeleton className="h-8 w-48 mb-2 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
        <Skeleton className="h-4 w-full max-w-[24rem] bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
                  <Skeleton className="h-4 w-24 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
            </div>
            
            <div className="mt-6 flex gap-3">
              <Skeleton className="h-9 flex-1 rounded-md bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
              <Skeleton className="h-9 w-24 rounded-md bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
