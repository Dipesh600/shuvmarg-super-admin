"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

const AgentDetailSkeleton = () => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-9 w-9 rounded-md" />

        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>

            {/* Name */}
            <div className="text-center space-y-2">
              <Skeleton className="h-5 w-40 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-4 w-28 mx-auto" />
            </div>

            {/* Info */}
            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>

            {/* Bank/PAN */}
            <div className="pt-4 border-t space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>

          <CardContent>
            {/* Stat boxes */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-muted/50 space-y-2 text-center"
                >
                  <Skeleton className="h-8 w-24 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>

              {/* Table */}
              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>

                {/* Rows */}
                {Array.from({ length: 4 }).map((_, row) => (
                  <div
                    key={row}
                    className="grid grid-cols-6 gap-4"
                  >
                    {Array.from({ length: 6 }).map((_, col) => (
                      <Skeleton key={col} className="h-4 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AgentDetailSkeleton;
