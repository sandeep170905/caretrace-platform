import React, { useState, useEffect } from 'react';
import { Announcement, formatRelativeTime } from '@caretrace/shared';
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
    <div className={`space-y-3 mb-6 animate-fade-up stagger-1 ${className}`}>
      {visibleAnnouncements.map((ann) => {
        const isUrgent = ann.urgency === 'URGENT';

        return (
          <div
            key={ann.id}
            className={`relative rounded-2xl p-4 sm:p-5 shadow-elevated border transition-all card-premium ${
              isUrgent
                ? 'bg-rose-950 text-white border-rose-500/60 ring-1 ring-rose-500/30'
                : 'gradient-accent text-white border-amber-500/40 shadow-glow-amber'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isUrgent
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 animate-pulse-soft'
                      : 'bg-white/20 text-amber-50 border border-white/30'
                  }`}
                >
                  {isUrgent ? (
                    <ShieldAlert className="w-5 h-5 text-rose-300" />
                  ) : (
                    <Megaphone className="w-5 h-5 text-amber-50" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1 break-words">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-sans font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isUrgent
                          ? 'bg-rose-500/40 text-rose-100 border-rose-300/50'
                          : 'bg-white/20 text-amber-100 border-white/30'
                      }`}
                    >
                      {isUrgent ? 'Urgent Relief Appeal' : 'Platform Notice'}
                    </span>

                    <span className="inline-flex items-center space-x-1 text-[10px] font-sans font-medium text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                      <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse-soft" />
                      <span>Live Broadcast</span>
                    </span>

                    {ann.expiresAt && (
                      <span className="text-[10px] text-white/80 font-sans font-medium flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Valid until {formatRelativeTime(ann.expiresAt)}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight break-words pt-1">
                    {ann.title}
                  </h4>

                  <p className="text-sm sm:text-base font-sans text-white/90 leading-relaxed max-w-4xl break-words">
                    {ann.message}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/60 font-mono">
                    <span>Broadcast by: {ann.createdBy || 'Platform Admin'}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(ann.createdAt, { includeTime: true })}</span>
                  </div>
                </div>
              </div>

              {/* Local Dismiss Button */}
              <button
                type="button"
                onClick={() => handleDismissLocal(ann.id)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 press-effect"
                title="Hide notice for this session"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

