import React, { useState, useEffect } from 'react';
import { Donation, TransitTelemetry } from '@caretrace/shared';
import { Truck, MapPin, Navigation, Gauge, Clock, ChevronRight, Play, RefreshCw, CheckCircle } from 'lucide-react';
import { fetchTransitTelemetry, stepTransitSimulation } from '../api/client';

interface LiveTransitMapProps {
  donation: Donation;
  initialTelemetry?: TransitTelemetry;
  onStatusAdvanced?: () => void;
}

export const LiveTransitMap: React.FC<LiveTransitMapProps> = ({
  donation,
  initialTelemetry,
  onStatusAdvanced
}) => {
  const [telemetry, setTelemetry] = useState<TransitTelemetry | null>(initialTelemetry || null);
  const [waypoints, setWaypoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const data = await fetchTransitTelemetry(donation.id);
      if (data.success) {
        setTelemetry(data.telemetry);
        setWaypoints(data.waypoints || []);
      }
    } catch (e) {
      console.error('Failed to load transit telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [donation.id]);

  const handleStep = async () => {
    setIsAdvancing(true);
    try {
      const res = await stepTransitSimulation(donation.id, 20);
      if (res.success) {
        setTelemetry(res.telemetry);
        if (onStatusAdvanced) onStatusAdvanced();
      }
    } catch (e) {
      console.error('Failed to step transit simulation:', e);
    } finally {
      setIsAdvancing(false);
    }
  };

  const progress = telemetry?.progressPercentage || (donation.status === 'CONFIRMED' ? 100 : 50);

  // SVG route calculation
  // We represent the route on an SVG coordinate space (e.g. 500 x 180)
  const svgWidth = 500;
  const svgHeight = 160;
  const startX = 50;
  const startY = 80;
  const endX = 450;
  const endY = 80;

  // Generate gentle road curve path
  const pathD = `M ${startX} ${startY} C 160 30, 240 130, 350 40 S 420 100, ${endX} ${endY}`;

  // Vehicle coordinate along progress (t: 0 to 1)
  const t = progress / 100;
  const vehicleX = startX + (endX - startX) * t;
  // Approximate curve height modulation
  const curveOffset = Math.sin(t * Math.PI) * -30 + Math.sin(t * Math.PI * 2) * 15;
  const vehicleY = startY + curveOffset;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-teal-700" />
            <span>Live Simulated Transit Corridor</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {progress >= 100 ? 'Arrived' : `${progress}% Complete`}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Interpolated route telemetry between origin hub and recipient childcare sanctuary
          </p>
        </div>

        {/* Advance Simulation Step Button */}
        {progress < 100 && donation.status !== 'CONFIRMED' && (
          <button
            onClick={handleStep}
            disabled={isAdvancing}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Play className={`w-3 h-3 fill-current ${isAdvancing ? 'animate-spin' : ''}`} />
            <span>Step Courier Forward (+20%)</span>
          </button>
        )}
      </div>

      {/* Simulated Route Visualization Canvas */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-4 sm:p-6 overflow-hidden shadow-inner border border-slate-700">
        {/* Ambient Grid overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #2dd4bf 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Route SVG Map */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 sm:h-44">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Route Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#334155"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="8 6"
          />

          {/* Completed / Active Traveled Path */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glow)"
            strokeDasharray="500"
            strokeDashoffset={500 * (1 - progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />

          {/* Waypoint Nodes along route */}
          {[0.25, 0.5, 0.75].map((fraction, i) => {
            const x = startX + (endX - startX) * fraction;
            const y = startY + (Math.sin(fraction * Math.PI) * -30 + Math.sin(fraction * Math.PI * 2) * 15);
            const passed = progress / 100 >= fraction;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={passed ? '#14B8A6' : '#475569'}
                stroke="#0F172A"
                strokeWidth="2"
              />
            );
          })}

          {/* Origin Marker */}
          <g transform={`translate(${startX}, ${startY})`}>
            <circle r="12" fill="#0F766E" stroke="#2DD4BF" strokeWidth="2" />
            <circle r="4" fill="#FFFFFF" />
          </g>

          {/* Destination Marker */}
          <g transform={`translate(${endX}, ${endY})`}>
            <circle r="14" fill="#059669" stroke="#34D399" strokeWidth="2" />
            <circle r="6" fill="#FFFFFF" />
          </g>

          {/* Animated Courier Van Position */}
          <g
            transform={`translate(${vehicleX}, ${vehicleY})`}
            style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Pulsing Radar Ring */}
            <circle r="20" fill="none" stroke="#F59E0B" strokeWidth="1.5" className="animate-ping opacity-50" />
            <circle r="14" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" filter="url(#glow)" />
            <g transform="translate(-7, -7) scale(0.65)">
              <Truck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </g>
          </g>
        </svg>

        {/* Origin & Destination Labels */}
        <div className="flex justify-between items-center text-xs text-white/90 pt-2 border-t border-slate-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <div>
              <p className="font-semibold text-[11px] text-teal-300">ORIGIN PICKUP</p>
              <p className="text-xs font-mono text-slate-200 truncate max-w-[150px] sm:max-w-none">
                {donation.pickupAddress.split(',')[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-right">
            <div>
              <p className="font-semibold text-[11px] text-emerald-300">DESTINATION SANCTUARY</p>
              <p className="text-xs font-mono text-slate-200 truncate max-w-[150px] sm:max-w-none">
                {donation.institutionName}
              </p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
            <Gauge className="w-3.5 h-3.5 text-teal-600" />
            <span>Courier Speed</span>
          </span>
          <p className="text-base font-bold text-slate-900 mt-1 font-mono">
            {progress >= 100 ? '0' : telemetry?.speedKmh || 44} <span className="text-xs font-normal text-slate-500">km/h</span>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>ETA Remaining</span>
          </span>
          <p className="text-base font-bold text-slate-900 mt-1 font-mono">
            {progress >= 100 ? 'Delivered' : `${telemetry?.estimatedArrivalMinutes || 12} mins`}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
            <Navigation className="w-3.5 h-3.5 text-purple-600" />
            <span>Corridor Progress</span>
          </span>
          <p className="text-base font-bold text-slate-900 mt-1 font-mono">
            {progress}%
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Current Sector</span>
          </span>
          <p className="text-xs font-medium text-slate-800 mt-1.5 truncate" title={telemetry?.currentAddress}>
            {telemetry?.currentAddress || 'Corridor Route 7'}
          </p>
        </div>
      </div>
    </div>
  );
};

