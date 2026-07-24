'use client';

import { useSyncExternalStore } from 'react';
import { useApp } from '@/lib/store';
import { LoginPage } from '@/components/auth/login-page';
import { RolePortal } from '@/components/portal/role-portal';

// useSyncExternalStore returns the client snapshot during hydration/render
// and the server snapshot during SSR. This gives us a hydration-safe
// "isMounted" flag without setting state inside an effect (which would
// trigger react-hooks/set-state-in-effect).
const emptySubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

export default function Home() {
  const view = useApp(s => s.view);
  const mounted = useSyncExternalStore(emptySubscribe, isClient, isServer);

  if (!mounted) {
    // Minimal, branded loading shell — no layout shift, no flash of wrong view.
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading Concordia College…</p>
        </div>
      </div>
    );
  }

  // No landing page — go straight to login or portal.
  if (view === 'portal') return <RolePortal />;
  return <LoginPage />;
}
