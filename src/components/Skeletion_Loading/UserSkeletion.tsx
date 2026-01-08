import {
  Card,
  CardContent,
  CardHeader,

} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const UsersSkeleton = () => {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-full md:w-32 rounded-md" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Directory Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop Table Skeleton */}
          <div className="hidden md:block space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>

            {/* Table Rows */}
            {Array.from({ length: 6 }).map((_, row) => (
              <div
                key={row}
                className="grid grid-cols-6 gap-4 items-center"
              >
                {Array.from({ length: 6 }).map((_, col) => (
                  <Skeleton key={col} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>

          {/* Mobile Card Skeleton */}
          <div className="md:hidden flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 space-y-3"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default UsersSkeleton;
