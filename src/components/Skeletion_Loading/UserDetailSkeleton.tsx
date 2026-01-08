import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const UserDetailSkeleton = () => {
  return (
    <>
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />

        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* PROFILE CARD */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>

            <div className="space-y-2 text-center">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>

            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* ACTIVITY CARD */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>

          <CardContent>
            {/* STATS */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>

            {/* TABLE */}
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserDetailSkeleton;
