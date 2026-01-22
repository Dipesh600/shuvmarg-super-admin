import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const StatSkeleton = () => (
  <div className="p-4 bg-muted/50 rounded-lg text-center space-y-2">
    <Skeleton className="h-5 w-5 mx-auto rounded-full" />
    <Skeleton className="h-6 w-16 mx-auto" />
    <Skeleton className="h-3 w-20 mx-auto" />
  </div>
);

export const BusOwnerDetailSkeleton = () => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-lg" />
            </div>

            <div className="space-y-2 text-center">
              <Skeleton className="h-5 w-40 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-4 w-36 mx-auto" />
            </div>

            <div className="space-y-3 pt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>

            <div className="pt-4 border-t space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Right Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>

          <CardContent>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <StatSkeleton key={i} />
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>

            {/* Table */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
