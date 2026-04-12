'use client';

export default function LoadingCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="h-3 bg-gray-200 rounded w-20" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Rating */}
        <div className="h-3 bg-gray-200 rounded w-32" />

        {/* Price & Stock */}
        <div className="flex justify-between pt-2">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-8" />
        </div>
      </div>
    </div>
  );
}
