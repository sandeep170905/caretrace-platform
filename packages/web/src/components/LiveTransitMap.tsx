import React, { useState, useEffect, useRef } from 'react';
import { Donation, TransitTelemetry } from '@caretrace/shared';
import { Truck, MapPin, Navigation, Gauge, Clock, ChevronRight, Play, RefreshCw, CheckCircle2, ShieldCheck, Building2, Info } from 'lucide-react';
import { fetchTransitTelemetry, stepTransitSimulation } from '../api/client';
import L from 'leaflet';

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
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const initialProgress = initialTelemetry?.progressPercentage || (donation.status === 'CONFIRMED' ? 100 : 50);
  const [displayedProgress, setDisplayedProgress] = useState<number>(initialProgress);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const traveledLineRef = useRef<L.Polyline | null>(null);

  const progress = displayedProgress;

  const loadData = async () => {
    try {
      const data = await fetchTransitTelemetry(donation.id);
      if (data.success && data.telemetry) {
        setTelemetry(data.telemetry);
        setWaypoints(data.waypoints || []);
        setDisplayedProgress(data.telemetry.progressPercentage);
      }
    } catch (e) {
      console.error('Failed to load transit telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [donation.id]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const pickupCoord: [number, number] = [
      donation.pickupCoordinates?.latitude || 13.0418,
      donation.pickupCoordinates?.longitude || 80.2341
    ];
    const destCoord: [number, number] = [
      donation.destinationCoordinates?.latitude || 12.9249,
      donation.destinationCoordinates?.longitude || 80.1000
    ];

    // If map not yet created, create it
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [
          (pickupCoord[0] + destCoord[0]) / 2,
          (pickupCoord[1] + destCoord[1]) / 2
        ],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false
      });

      // CartoDB Voyager modern high-contrast tiles (OpenStreetMap data)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Custom icon generators
      const originIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="
            background: #0F766E;
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(15,118,110,0.4);
            font-size: 14px;
          ">
            📦
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const destIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="
            background: #059669;
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(5,150,105,0.4);
            font-size: 14px;
          ">
            🏛️
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const vehicleIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: rgba(245, 158, 11, 0.4);
              animation: pulse-ring 2s infinite ease-out;
            "></div>
            <div style="
              position: relative;
              background: #F59E0B;
              color: white;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 4px 16px rgba(245,158,11,0.5);
              font-size: 16px;
            ">
              🚚
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Add Origin & Destination markers
      const originMarker = L.marker(pickupCoord, { icon: originIcon }).addTo(map);
      originMarker.bindPopup(`<b>Pickup Depot</b><br/>${donation.pickupAddress}`);

      const destMarker = L.marker(destCoord, { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`<b>Destination Facility</b><br/>${donation.institutionName}<br/>${donation.destinationAddress}`);

      // Add vehicle marker at initial position
      const vehiclePos: [number, number] = telemetry
        ? [telemetry.latitude, telemetry.longitude]
        : pickupCoord;
      const vehicleMarker = L.marker(vehiclePos, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
      vehicleMarker.bindPopup(`<b>Courier Van CT-EXPRESS</b><br/>Progress: ${progress}%`);
      vehicleMarkerRef.current = vehicleMarker;

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Build route coordinates array
    const routePoints: [number, number][] = waypoints.length > 0
      ? waypoints.map(w => [w.latitude, w.longitude])
      : [pickupCoord, destCoord];

    // Remove existing polylines
    if (routeLineRef.current) map.removeLayer(routeLineRef.current);
    if (traveledLineRef.current) map.removeLayer(traveledLineRef.current);

    // Draw planned route polyline
    const routeLine = L.polyline(routePoints, {
      color: '#94A3B8',
      weight: 5,
      opacity: 0.6,
      dashArray: '8, 8'
    }).addTo(map);
    routeLineRef.current = routeLine;

    // Draw completed / active traveled route
    const traveledCount = Math.max(1, Math.round((progress / 100) * routePoints.length));
    const traveledPoints = routePoints.slice(0, traveledCount);
    const traveledLine = L.polyline(traveledPoints, {
      color: '#0F766E',
      weight: 6,
      opacity: 0.95
    }).addTo(map);
    traveledLineRef.current = traveledLine;

    // Update vehicle marker position
    if (vehicleMarkerRef.current) {
      const curLat = telemetry?.latitude || routePoints[Math.min(traveledCount - 1, routePoints.length - 1)][0];
      const curLng = telemetry?.longitude || routePoints[Math.min(traveledCount - 1, routePoints.length - 1)][1];
      vehicleMarkerRef.current.setLatLng([curLat, curLng]);
      vehicleMarkerRef.current.setPopupContent(`<b>Courier Van (CT-EXPRESS)</b><br/>Sector: ${telemetry?.currentAddress || 'Chennai Metro'}<br/>Progress: ${progress}%`);
    }

    // Auto-fit route bounds on first load
    try {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (err) {}

  }, [donation.id, waypoints, telemetry?.latitude, telemetry?.longitude, progress]);

  // Teardown map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleStep = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      const res = await stepTransitSimulation(donation.id, 20);
      if (res.success && res.telemetry) {
        setTelemetry(res.telemetry);
        setDisplayedProgress(res.telemetry.progressPercentage);
        if (onStatusAdvanced) onStatusAdvanced();
      }
    } catch (e) {
      console.error('Failed to step transit simulation:', e);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="bg-surface-card rounded-3xl p-6 sm:p-7 border border-surface-border shadow-sm card-premium">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 flex items-center space-x-2.5">
            <Navigation className="w-5 h-5 text-teal-700" />
            <span>Interactive Chennai Transit Corridor</span>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm border ${
              progress >= 100
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {progress >= 100 ? 'Arrived at Dock' : `${progress}% Complete`}
            </span>
          </h3>
          <p className="text-xs font-sans text-slate-500 mt-1">
            Real-time interactive Leaflet.js + OpenStreetMap routing between Chennai depots
          </p>
        </div>

        {/* Advance Simulation Step Button */}
        {progress < 100 && donation.status !== 'CONFIRMED' && (
          <button
            onClick={handleStep}
            disabled={isAdvancing}
            className="flex items-center space-x-2 px-4 py-2.5 gradient-primary hover-lift text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal transition-all disabled:opacity-50 press-effect shrink-0"
          >
            {isAdvancing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Advancing Vehicle...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Advance Transit (+20%)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Real Interactive Leaflet OpenStreetMap Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border border-surface-border">
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-84 md:h-96 z-10"
          style={{ minHeight: '300px' }}
        />

        {/* Floating Origin & Destination Legend overlay */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-surface-border shadow-glass text-xs font-sans max-w-sm">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
              <span>Pickup: {donation.pickupAddress.split(',')[0]}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Delivery: {donation.institutionName}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Simulated Telemetry Disclosure Caption */}
      <div className="mt-3 flex items-start space-x-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs font-sans text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-bold">Simulated Telemetry (Phase 1 Evaluation):</strong> Vehicle position and transit metrics along Chennai corridors are computed via deterministic route interpolation. Production rollout interfaces with courier OBD-II GPS hardware or third-party logistics APIs.
        </p>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <Gauge className="w-3.5 h-3.5 text-teal-600" />
            <span>Courier Speed</span>
          </span>
          <p className="text-lg font-display font-bold text-slate-900 mt-1 font-mono">
            {progress >= 100 ? '0' : telemetry?.speedKmh || 42} <span className="text-xs font-sans font-normal text-slate-500">km/h</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>ETA Remaining</span>
          </span>
          <p className="text-lg font-display font-bold text-slate-900 mt-1 font-mono">
            {progress >= 100 ? 'Docked' : `${telemetry?.estimatedArrivalMinutes || 12} mins`}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <Navigation className="w-3.5 h-3.5 text-teal-700" />
            <span>Corridor Progress</span>
          </span>
          <p className="text-lg font-display font-bold text-teal-800 mt-1 font-mono">
            {progress}%
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Current Sector</span>
          </span>
          <p className="text-xs font-sans font-bold text-slate-800 mt-1.5 truncate" title={telemetry?.currentAddress}>
            {telemetry?.currentAddress || 'Kathipara Corridor, Chennai'}
          </p>
        </div>
      </div>
    </div>
  );
};


