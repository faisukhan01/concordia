'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { ModuleHeader } from './students';
import {
  Bus, Navigation, MapPin, Phone, Gauge, Users, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, Route as RouteIcon,
  Play, Pause,
} from 'lucide-react';

type RouteStatus = 'on-time' | 'delayed' | 'en-route';

type ActiveRoute = {
  id: string;
  routeName: string;
  driverName: string;
  vehicleNo: string;
  etaMin: number; // minutes; 0 = arrived
  speed: number;
  occupancy: number;
  capacity: number;
  status: RouteStatus;
  pos: { x: number; y: number };
};

const INITIAL_ROUTES: ActiveRoute[] = [
  {
    id: 'R-A', routeName: 'Route A — Gulberg', driverName: 'Imran Yousaf',
    vehicleNo: 'LHR-1234', etaMin: 4, speed: 38, occupancy: 28, capacity: 36,
    status: 'en-route', pos: { x: 22, y: 30 },
  },
  {
    id: 'R-B', routeName: 'Route B — Model Town', driverName: 'Bashir Khan',
    vehicleNo: 'LHR-5678', etaMin: 12, speed: 24, occupancy: 22, capacity: 32,
    status: 'delayed', pos: { x: 58, y: 60 },
  },
  {
    id: 'R-C', routeName: 'Route C — DHA Phase 5', driverName: 'Naveed Ahmed',
    vehicleNo: 'LHR-9012', etaMin: 8, speed: 32, occupancy: 30, capacity: 30,
    status: 'on-time', pos: { x: 80, y: 24 },
  },
];

const statusMeta: Record<RouteStatus, { label: string; cls: string; dot: string; ring: string }> = {
  'on-time': { label: 'On Time', cls: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', ring: 'from-emerald-500 to-teal-600' },
  'en-route': { label: 'En Route', cls: 'text-cyan-700 bg-cyan-500/10 border-cyan-500/20', dot: 'bg-cyan-500', ring: 'from-cyan-500 to-teal-600' },
  'delayed': { label: 'Delayed', cls: 'text-amber-700 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500', ring: 'from-amber-500 to-orange-600' },
};

function etaLabel(min: number) {
  if (min <= 0) return 'Arrived';
  if (min === 1) return '1 min';
  return `${min} min`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randStep(prev: number, range: number, min: number, max: number) {
  const next = prev + (Math.random() * 2 - 1) * range;
  return clamp(next, min, max);
}

// Lahore bounding box used to normalise (lat, lng) into the 0-100% map space.
const LHR_LAT_MIN = 31.45;
const LHR_LAT_MAX = 31.55;
const LHR_LNG_MIN = 74.30;
const LHR_LNG_MAX = 74.42;
const MAP_X_MIN = 6;
const MAP_X_MAX = 92;
const MAP_Y_MIN = 10;
const MAP_Y_MAX = 86;

function latLngToPos(lat: number, lng: number): { x: number; y: number } {
  const x = clamp(((lng - LHR_LNG_MIN) / (LHR_LNG_MAX - LHR_LNG_MIN)) * 100, MAP_X_MIN, MAP_X_MAX);
  // Higher latitude = further north = lower y on screen, so invert.
  const y = clamp(((LHR_LAT_MAX - lat) / (LHR_LAT_MAX - LHR_LAT_MIN)) * 100, MAP_Y_MIN, MAP_Y_MAX);
  return { x, y };
}

export default function LiveTransportModule() {
  const [routes, setRoutes] = useState<ActiveRoute[]>(INITIAL_ROUTES);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('R-A');
  const [live, setLive] = useState(true);
  const moveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const etaTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch live transport routes from the API on mount. Falls back to
  // INITIAL_ROUTES on error so the map is never empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRoutesLoading(true);
      try {
        const resp = await api.getTransportLive();
        if (cancelled) return;
        if (resp.routes && resp.routes.length > 0) {
          const mapped: ActiveRoute[] = resp.routes.map((r) => ({
            id: r.id,
            routeName: r.routeName,
            driverName: r.driver,
            vehicleNo: r.vehicleNo,
            etaMin: r.etaMinutes,
            speed: r.speed,
            occupancy: r.occupancy,
            capacity: r.capacity,
            status: r.status,
            pos: latLngToPos(r.currentLat, r.currentLng),
          }));
          setRoutes(mapped);
          setSelectedId(mapped[0]?.id ?? 'R-A');
        }
      } catch {
        // keep INITIAL_ROUTES fallback
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2-second interval: nudge bus positions + small speed fluctuation.
  useEffect(() => {
    if (!live) return;
    moveTimer.current = setInterval(() => {
      setRoutes((prev) =>
        prev.map((r) =>
          r.etaMin <= 0
            ? r // already arrived — hold position
            : {
                ...r,
                pos: {
                  x: randStep(r.pos.x, 4, 6, 92),
                  y: randStep(r.pos.y, 4, 10, 86),
                },
                speed: Math.round(randStep(r.speed, 6, 0, 60)),
              },
        ),
      );
    }, 2000);
    return () => {
      if (moveTimer.current) clearInterval(moveTimer.current);
    };
  }, [live]);

  // 5-second interval: decrement ETA; when 0 reached, reset to a fresh value
  // (simulating a new pickup loop).
  useEffect(() => {
    if (!live) return;
    etaTimer.current = setInterval(() => {
      setRoutes((prev) =>
        prev.map((r) => {
          if (r.etaMin <= 0) {
            const fresh = 4 + Math.floor(Math.random() * 14);
            return { ...r, etaMin: fresh, status: fresh > 10 ? 'delayed' : 'en-route' as RouteStatus };
          }
          const next = r.etaMin - 1;
          return {
            ...r,
            etaMin: next,
            status: next <= 0 ? 'on-time' : next > 10 ? 'delayed' : r.status,
          };
        }),
      );
    }, 5000);
    return () => {
      if (etaTimer.current) clearInterval(etaTimer.current);
    };
  }, [live]);

  const selected = routes.find((r) => r.id === selectedId) ?? routes[0];

  const stats = [
    { label: 'Active Routes', value: routes.length, icon: RouteIcon, tint: 'from-emerald-500 to-teal-600' },
    { label: 'Students Onboard', value: routes.reduce((a, r) => a + r.occupancy, 0), icon: Users, tint: 'from-amber-500 to-yellow-600' },
    { label: 'On-Time Today', value: '94%', icon: TrendingUp, tint: 'from-emerald-500 to-emerald-700' },
    { label: 'Alerts', value: routes.filter((r) => r.status === 'delayed').length, icon: AlertTriangle, tint: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Live Transport Tracking"
        subtitle="Real-time GPS tracking of campus buses — see where your child is, right now"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={live ? 'default' : 'outline'}
              onClick={() => setLive((v) => !v)}
              className={live ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {live ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
              {live ? 'Pause Live' : 'Resume Live'}
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Navigation className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 relative overflow-hidden">
                <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.tint} opacity-10 blur-2xl`} />
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.tint} grid place-items-center mb-3`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-extrabold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Map */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-sm">Live Map · Lahore Campus</span>
            </div>
            <Badge variant="outline" className="text-rose-700 border-rose-500/30 bg-rose-500/10">
              <span className="relative mr-1.5 flex h-2 w-2">
                {live && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              Live
            </Badge>
          </div>
          <div className="relative h-[420px] bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-40 dark:opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, oklch(0.5 0.15 160 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0.15 160 / 0.15) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            {/* Animated dashed route lines */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polyline
                points="5,80 22,30 45,50 70,40 90,18"
                fill="none"
                stroke="oklch(0.6 0.15 160)"
                strokeWidth="0.6"
                strokeDasharray="2 1.5"
                opacity="0.55"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="1.2s" repeatCount="indefinite" />
              </polyline>
              <polyline
                points="10,90 30,75 58,60 75,80 92,55"
                fill="none"
                stroke="oklch(0.7 0.18 30)"
                strokeWidth="0.6"
                strokeDasharray="2 1.5"
                opacity="0.55"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="1.5s" repeatCount="indefinite" />
              </polyline>
              <polyline
                points="15,15 35,30 60,22 80,24"
                fill="none"
                stroke="oklch(0.7 0.15 200)"
                strokeWidth="0.6"
                strokeDasharray="2 1.5"
                opacity="0.55"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="1.8s" repeatCount="indefinite" />
              </polyline>
            </svg>
            {/* Campus pin */}
            <div className="absolute top-[18%] right-[8%] -translate-y-1/2">
              <div className="h-10 w-10 rounded-full bg-primary grid place-items-center shadow-lg ring-4 ring-primary/20">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="mt-1 text-[10px] font-semibold text-primary whitespace-nowrap">Campus</div>
            </div>
            {/* Bus markers */}
            <AnimatePresence>
              {routes.map((r) => {
                const meta = statusMeta[r.status];
                const isSelected = r.id === selectedId;
                return (
                  <Tooltip key={r.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        layout
                        onClick={() => setSelectedId(r.id)}
                        animate={{ left: `${r.pos.x}%`, top: `${r.pos.y}%` }}
                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                      >
                        <div
                          className={`h-9 w-9 rounded-full grid place-items-center shadow-lg ring-4 transition ${
                            isSelected
                              ? 'bg-primary ring-primary/30 scale-110'
                              : `bg-gradient-to-br ${meta.ring} ring-emerald-500/20`
                          }`}
                        >
                          <Bus className="h-4 w-4 text-white" />
                        </div>
                        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-white ${meta.dot}`} />
                        <div className="mt-1 text-[10px] font-semibold bg-card/90 backdrop-blur px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                          {r.id}
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-semibold">{r.routeName}</div>
                      <div className="text-primary-foreground/80">{r.driverName} · {r.vehicleNo}</div>
                      <div className="text-primary-foreground/80">ETA: {etaLabel(r.etaMin)} · {r.speed} km/h</div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </AnimatePresence>
            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur border border-border rounded-lg p-2.5 text-[10px] space-y-1 shadow-sm">
              <div className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Legend</div>
              {(['en-route', 'on-time', 'delayed'] as RouteStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusMeta[s].dot}`} />
                  <span>{statusMeta[s].label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Active routes list */}
        <Card className="p-3">
          <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active Routes
          </div>
          <div className="space-y-2.5">
            {routesLoading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-12 rounded-lg" />
                      <Skeleton className="h-12 rounded-lg" />
                      <Skeleton className="h-12 rounded-lg" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
            routes.map((r) => {
              const meta = statusMeta[r.status];
              const occPct = Math.round((r.occupancy / r.capacity) * 100);
              const isSelected = r.id === selectedId;
              const initials = r.driverName.split(' ').map((n) => n[0]).join('').slice(0, 2);
              return (
                <motion.button
                  layout
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    isSelected
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`bg-gradient-to-br ${meta.ring} text-white text-xs`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">{r.routeName}</span>
                        <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {r.driverName} · {r.vehicleNo}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Gauge className="h-3 w-3" /> Speed</div>
                      <div className="font-semibold mt-0.5 tabular-nums">{r.speed} km/h</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Clock className="h-3 w-3" /> ETA</div>
                      <div className="font-semibold mt-0.5 tabular-nums">{etaLabel(r.etaMin)}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Users className="h-3 w-3" /> Seats</div>
                      <div className="font-semibold mt-0.5 tabular-nums">{r.occupancy}/{r.capacity}</div>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Occupancy</span>
                      <span>{occPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          occPct >= 90 ? 'bg-rose-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        animate={{ width: `${occPct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8">
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Driver
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8">
                      {r.etaMin <= 0 ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <Navigation className="h-3.5 w-3.5 mr-1.5" />}
                      {r.etaMin <= 0 ? 'Drop Done' : 'Track'}
                    </Button>
                  </div>
                </motion.button>
              );
            })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
