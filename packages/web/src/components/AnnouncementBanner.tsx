import React, { useState, useEffect } from 'react';
import { Announcement } from '@caretrace/shared';
import { fetchActiveAnnouncements } from '../api/client';
import { AlertCircle, Megaphone, X, Clock, ShieldAlert, Radio } from 'lucide-react';

interface AnnouncementBannerProps {
  refreshKey?: number;
  className?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  refreshKey,
  className = ''
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedLocally, setDismissedLocally] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const list = await fetchActiveAnnouncements();
        if (isMounted) {
          setAnnouncements(list);
        }
      } catch (err) {
        console.error('Failed to load active announcements:', err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleDismissLocal = (id: string) => {
    setDismissedLocally(prev => new Set(prev).add(id));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedLocally.has(a.id));

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 mb-6 animate-fade-in ${className}`}>
      {visibleAnnouncements.map((ann) => {
        const isUrgent = ann.urgency === 'URGENT';

        return (
          <div
            key={ann.id}
            className={`relative rounded-2xl p-4 sm:p-5 shadow-lg border transition-all ${
              isUrgent
                ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white border-rose-500/60 ring-1 ring-rose-500/30'
                : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 text-white border-indigo-500/40 ring-1 ring-indigo-500/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isUrgent
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 animate-pulse'
                      : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                  }`}
                >
                  {isUrgent ? (
                    <ShieldAlert className="w-5 h-5 text-rose-300" />
                  ) : (
                    <Megaphone className="w-5 h-5 text-teal-300" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isUrgent
                          ? 'bg-rose-500/40 text-rose-100 border-rose-300/50'
                          : 'bg-indigo-500/30 text-indigo-200 border-indigo-300/30'
                      }`}
                    >
                      {isUrgent ? 'Urgent Relief Appeal' : 'Platform Notice'}
                    </span>

                    <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                      <Radio className="w-2.5 h-2.5 text-teal-400 animate-ping" />
                      <span>Live Broadcast</span>
                    </span>

                    {ann.expiresAt && (
                      <span className="text-[10px] text-amber-200/90 font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Valid until {new Date(ann.expiresAt).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {ann.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-4xl">
                    {ann.message}
                  </p>

                  <div className="pt-1 flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                    <span>Broadcast by: {ann.createdBy || 'Platform Admin'}</span>
                    <span>•</span>
                    <span>
                      {new Date(ann.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local Dismiss Button */}
              <button
                type="button"
                onClick={() => handleDismissLocal(ann.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                title="Hide notice for this session"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

