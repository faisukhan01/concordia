'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MODULES } from '@/lib/modules';
import { ModuleHeader } from './students';
import {
  Building2, Boxes, Network, Settings, ShieldCheck, Palette, Compass,
  CheckCircle2, Sparkles, ArrowRight, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Building2, Boxes, Network, Settings, ShieldCheck, Palette, Compass,
};

export function GenericModule({ id, name, icon }: { id: string; name: string; icon: string }) {
  const mod = MODULES.find(m => m.id === id);
  const Icon = iconMap[icon] || Building2;
  const features = mod?.features || [];

  // Module-specific sample content
  const sampleData: Record<string, { count: number; sub: string }[]> = {
    hostel: [
      { count: 4, sub: 'Floors' },
      { count: 48, sub: 'Rooms' },
      { count: 186, sub: 'Residents' },
      { count: 12, sub: 'Staff' },
    ],
    assets: [
      { count: '4,820', sub: 'Total Items' },
      { count: '3,144', sub: 'Available' },
      { count: '1,286', sub: 'Issued' },
      { count: '390', sub: 'Consumables' },
    ],
    franchise: [
      { count: 7, sub: 'Franchises' },
      { count: '$24K', sub: 'Royalty Due' },
      { count: '$182K', sub: 'Collected YTD' },
      { count: 3, sub: 'Methods' },
    ],
    config: [
      { count: 4, sub: 'Campuses' },
      { count: 14, sub: 'Classes' },
      { count: 28, sub: 'Sections' },
      { count: 3, sub: 'Sessions' },
    ],
    users: [
      { count: 96, sub: 'Active Users' },
      { count: 12, sub: 'Roles' },
      { count: 8, sub: 'Online Now' },
      { count: 4, sub: 'Deactivated' },
    ],
    branding: [
      { count: 6, sub: 'Campaigns' },
      { count: 14, sub: 'Assets' },
      { count: '94%', sub: 'App Sync' },
      { count: 3, sub: 'Branding Types' },
    ],
    consultancy: [
      { count: 42, sub: 'Universities' },
      { count: 128, sub: 'Programs' },
      { count: 312, sub: 'Students Guided' },
      { count: 18, sub: 'Countries' },
    ],
  };

  const data = sampleData[id] || sampleData.config;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={name}
        subtitle={mod?.tagline || 'Bespoke solutions with Concordia'}
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Configure</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((d, i) => (
          <motion.div key={d.sub} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-10 blur-2xl" />
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center mb-3">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{d.count}</div>
              <div className="text-xs text-muted-foreground">{d.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Key Features</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-25" />
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-white/10 grid place-items-center mb-4">
              <Icon className="h-6 w-6 text-amber-300" />
            </div>
            <h3 className="font-display font-bold text-lg">{name}</h3>
            <p className="text-sm text-emerald-50/80 mt-1">{mod?.tagline}</p>
            <p className="text-xs text-emerald-100/60 mt-4">
              This module is part of the Concordia College suite. The full configuration interface
              is available in the complete deployment.
            </p>
            <Button className="mt-5 bg-white text-emerald-800 hover:bg-emerald-50 w-full" size="sm">
              Open Configuration <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
