import React from 'react';

interface DashboardSkeletonProps {
  type?: 'DONOR' | 'INSTITUTION' | 'AGENT' | 'ADMIN' | 'TAB_CONTENT';
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ type = 'DONOR' }) => {
  if (type === 'TAB_CONTENT') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100/90 rounded-2xl border border-slate-200/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 bg-slate-200 rounded-lg" />
                <div className="w-16 h-4 bg-slate-200 rounded-full" />
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded-md" />
              <div className="w-full h-3 bg-slate-200/80 rounded-md" />
              <div className="w-1/2 h-3 bg-slate-200/80 rounded-md" />
              <div className="pt-2 flex justify-between items-center">
                <div className="w-20 h-6 bg-slate-200 rounded-lg" />
                <div className="w-24 h-6 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-52 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="space-y-3 max-w-lg">
          <div className="w-32 h-5 bg-slate-300/80 rounded-full" />
          <div className="w-64 h-8 bg-slate-300 rounded-xl" />
          <div className="w-96 max-w-full h-4 bg-slate-300/70 rounded-lg" />
          <div className="w-80 max-w-full h-4 bg-slate-300/70 rounded-lg" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200/70 p-4 space-y-2 shadow-2xs">
            <div className="w-16 h-3 bg-slate-200 rounded-md" />
            <div className="w-24 h-6 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/70 p-4 space-y-2 shadow-2xs">
              <div className="flex justify-between">
                <div className="w-20 h-4 bg-slate-200 rounded-md" />
                <div className="w-12 h-4 bg-slate-200 rounded-full" />
              </div>
              <div className="w-32 h-5 bg-slate-200 rounded-md" />
              <div className="w-full h-2.5 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="w-40 h-5 bg-slate-200 rounded-lg" />
              <div className="w-24 h-5 bg-slate-200 rounded-full" />
            </div>
            <div className="w-full h-36 bg-slate-100 rounded-xl" />
            <div className="flex justify-between">
              <div className="w-28 h-4 bg-slate-200 rounded-md" />
              <div className="w-28 h-4 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

