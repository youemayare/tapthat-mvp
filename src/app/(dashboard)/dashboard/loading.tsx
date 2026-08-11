import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverviewLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Greeting Skeleton */}
      <div>
        <Skeleton className="h-8 w-3/4 max-w-[16rem] mb-2 bg-white/5 border border-white/10" />
        <Skeleton className="h-4 w-full max-w-[24rem] bg-white/5 border border-white/10" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
          >
            <Skeleton className="w-11 h-11 rounded-xl bg-white/5 border border-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-16 bg-white/5 border border-white/10" />
              <Skeleton className="h-4 w-24 bg-white/5 border border-white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-4 bg-white/5 border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <Skeleton className="w-6 h-6 mb-3 bg-white/5 border border-white/10" />
              <Skeleton className="h-5 w-32 mb-2 bg-white/5 border border-white/10" />
              <Skeleton className="h-4 w-full bg-white/5 border border-white/10" />
              <Skeleton className="h-4 w-4/5 mt-1 bg-white/5 border border-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
