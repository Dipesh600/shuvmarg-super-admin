import {
  Card,
  CardContent,
  CardHeader,

} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BookingsSkeleton = () => {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
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

      {/* Bookings Table Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
             <Skeleton className="h-10 w-full mb-4" />
            
            {/* Table Header */}
            <div className="grid grid-cols-9 gap-4 pb-2 border-b">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>

            {/* Table Rows */}
            {Array.from({ length: 6 }).map((_, row) => (
              <div
                key={row}
                className="grid grid-cols-9 gap-4 items-center py-3 border-b last:border-0"
              >
                {Array.from({ length: 9 }).map((_, col) => (
                  <Skeleton key={col} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default BookingsSkeleton;
