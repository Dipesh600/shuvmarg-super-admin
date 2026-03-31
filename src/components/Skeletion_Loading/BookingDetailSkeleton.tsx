import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const BookingDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Status Card Skeleton */}
        <Card className="md:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Separator />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Card Skeleton */}
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Route Info Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Separator />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bus Info Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingDetailSkeleton;
