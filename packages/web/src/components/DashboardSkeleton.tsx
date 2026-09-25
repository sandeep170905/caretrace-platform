import React from 'react';

interface DashboardSkeletonProps {
  type?: 'DONOR' | 'INSTITUTION' | 'AGENT' | 'ADMIN' | 'TAB_CONTENT';
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ type = 'DONOR' }) => {
  if (type === 'TAB_CONTENT') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3 card-premium">
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 rounded-lg skeleton" />
                <div className="w-16 h-4 rounded-full skeleton" />
              </div>
              <div className="w-3/4 h-5 rounded-md skeleton" />
              <div className="w-full h-3 rounded-md skeleton" />
              <div className="w-1/2 h-3 rounded-md skeleton" />
              <div className="pt-2 flex justify-between items-center">
                <div className="w-20 h-6 rounded-lg skeleton" />
                <div className="w-24 h-6 rounded-lg skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-52 bg-surface-card rounded-3xl p-6 sm:p-8 relative overflow-hidden card-premium border border-surface-border">
        <div className="space-y-3 max-w-lg">
          <div className="w-32 h-5 rounded-full skeleton" />
          <div className="w-64 h-8 rounded-xl skeleton" />
          <div className="w-96 max-w-full h-4 rounded-lg skeleton" />
          <div className="w-80 max-w-full h-4 rounded-lg skeleton" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-surface-card rounded-2xl border border-surface-border p-4 space-y-2 card-premium">
            <div className="w-16 h-3 rounded-md skeleton" />
            <div className="w-24 h-6 rounded-lg skeleton" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface-card rounded-2xl border border-surface-border p-4 space-y-2 card-premium">
              <div className="flex justify-between">
                <div className="w-20 h-4 rounded-md skeleton" />
                <div className="w-12 h-4 rounded-full skeleton" />
              </div>
              <div className="w-32 h-5 rounded-md skeleton" />
              <div className="w-full h-2.5 rounded-full skeleton" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4 card-premium">
            <div className="flex justify-between items-center pb-4 border-b border-surface-border">
              <div className="w-40 h-5 rounded-lg skeleton" />
              <div className="w-24 h-5 rounded-full skeleton" />
            </div>
            <div className="w-full h-36 rounded-xl skeleton" />
            <div className="flex justify-between">
              <div className="w-28 h-4 rounded-md skeleton" />
              <div className="w-28 h-4 rounded-md skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

