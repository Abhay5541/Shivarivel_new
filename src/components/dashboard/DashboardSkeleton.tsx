export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Introduction Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2DDD5]/60">
        <div className="space-y-2">
          <div className="w-56 h-7 bg-[#EFECE6] rounded-sm" />
          <div className="w-72 h-4 bg-[#EFECE6] rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-9 bg-[#EFECE6] rounded-md" />
          <div className="w-28 h-9 bg-[#EFECE6] rounded-md" />
        </div>
      </div>

      {/* Attention Skeleton */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 space-y-3">
        <div className="w-40 h-4 bg-[#EFECE6] rounded-sm" />
        <div className="space-y-2">
          <div className="h-14 bg-[#F7F5F0] rounded-lg" />
          <div className="h-14 bg-[#F7F5F0] rounded-lg" />
        </div>
      </div>

      {/* 4-Pillar Money Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-[#E2DDD5] rounded-xl p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-28 h-3.5 bg-[#EFECE6] rounded-sm" />
              <div className="w-8 h-8 rounded-lg bg-[#EFECE6]" />
            </div>
            <div className="w-36 h-7 bg-[#EFECE6] rounded-sm" />
            <div className="w-24 h-3 bg-[#EFECE6] rounded-sm" />
          </div>
        ))}
      </div>

      {/* Projects & Operations Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E2DDD5] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="w-44 h-5 bg-[#EFECE6] rounded-sm" />
            <div className="w-24 h-4 bg-[#EFECE6] rounded-sm" />
          </div>
          <div className="space-y-3">
            <div className="h-20 bg-[#F7F5F0] rounded-lg" />
            <div className="h-20 bg-[#F7F5F0] rounded-lg" />
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 space-y-4">
          <div className="w-36 h-5 bg-[#EFECE6] rounded-sm" />
          <div className="space-y-3">
            <div className="h-12 bg-[#F7F5F0] rounded-lg" />
            <div className="h-12 bg-[#F7F5F0] rounded-lg" />
            <div className="h-12 bg-[#F7F5F0] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
