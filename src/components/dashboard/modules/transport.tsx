'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import { Bus, Route, Users, DollarSign, MapPin, Phone, Plus, Navigation } from 'lucide-react';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function TransportModule() {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => { api.routes().then(setRoutes).catch(()=>{}); }, []);

  const totalStudents = routes.reduce((a,r) => a + r.students, 0);
  const totalRevenue = routes.reduce((a,r) => a + r.students * r.fare, 0);

  const cards = [
    { label: 'Total Routes', value: routes.length, icon: Route, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Vehicles', value: routes.length, icon: Bus, color: 'from-teal-500 to-cyan-600' },
    { label: 'Students Served', value: totalStudents, icon: Users, color: 'from-amber-500 to-yellow-600' },
    { label: 'Monthly Revenue', value: fmtMoney(totalRevenue), icon: DollarSign, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Transport Management"
        subtitle="Smartly track, seamlessly manage — vehicles, routes, drivers & payments"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> Add Route</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center mb-3`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center shadow-md">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="font-mono text-[11px]">{r.id}</Badge>
              </div>
              <h3 className="font-bold text-base mt-3 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-600" /> {r.name}</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <Badge variant="secondary" className="font-mono">{r.vehicle}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Navigation className="h-3.5 w-3.5" /> Driver</span>
                  <span className="font-medium">{r.driver}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Students</span>
                  <span className="font-medium">{r.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Fare/mo</span>
                  <span className="font-bold text-emerald-600">{fmtMoney(r.fare)}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Track</Button>
                <Button size="sm" variant="outline" className="flex-1">Payment</Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
