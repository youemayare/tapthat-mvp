import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2 bg-white/5 border border-white/10" />
          <Skeleton className="h-4 w-96 bg-white/5 border border-white/10" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl bg-white/5 border border-white/10" />
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 bg-white/5 border border-white/10" />
              <Skeleton className="h-4 w-4 rounded-full bg-white/5 border border-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2 bg-white/5 border border-white/10" />
              <Skeleton className="h-3 w-32 bg-white/5 border border-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Skeleton className="h-[400px] w-full rounded-2xl bg-white/5 border border-white/10" />
        <Skeleton className="h-[400px] w-full rounded-2xl bg-white/5 border border-white/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Skeleton className="h-[300px] w-full rounded-2xl bg-white/5 border border-white/10" />
        <Skeleton className="h-[300px] w-full rounded-2xl bg-white/5 border border-white/10" />
      </div>
    </div>
  );
}
