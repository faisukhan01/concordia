'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Keyboard,
  Info,
  type LucideIcon,
} from 'lucide-react';

// ---- Types ----------------------------------------------------------------

export type CommandPaletteModule = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export type CommandPaletteGroup = {
  group: string;
  items: CommandPaletteModule[];
};

export type CommandPaletteUser = {
  name?: string;
  role?: string;
  roleLabel?: string;
} | null;

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CommandPaletteUser;
  modules: CommandPaletteGroup[];
  onNavigate: (moduleId: string) => void;
};

// ---- Component ------------------------------------------------------------

/**
 * Global Cmd+K / Ctrl+K command palette.
 *
 * Three groups:
 *   - Modules        → every sidebar module for the user's role (fuzzy-filtered by cmdk)
 *   - Quick Actions  → Dashboard, Settings, Log out
 *   - Help           → Keyboard shortcuts, About Concordia College (toasts)
 *
 * Selecting a module item calls onNavigate(id) and closes the palette.
 * "Log out" calls api.logout() (clears sessionStorage) then hard-redirects to "/".
 */
export function CommandPalette({
  open,
  onOpenChange,
  user,
  modules,
  onNavigate,
}: CommandPaletteProps) {
  const firstModuleId = modules[0]?.items[0]?.id;

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleNavigate = React.useCallback(
    (id: string) => {
      close();
      // Defer navigation until after the dialog unmounts to avoid focus-restore
      // racing with the route change inside the portal.
      requestAnimationFrame(() => onNavigate(id));
    },
    [close, onNavigate]
  );

  const handleDashboard = React.useCallback(() => {
    if (firstModuleId) handleNavigate(firstModuleId);
    else close();
  }, [firstModuleId, handleNavigate, close]);

  const handleSettings = React.useCallback(() => {
    handleNavigate('settings');
  }, [handleNavigate]);

  const handleLogout = React.useCallback(async () => {
    close();
    try {
      await api.logout();
    } catch {
      // best-effort — proceed to redirect regardless
    }
    window.location.href = '/';
  }, [close]);

  const showShortcutsToast = React.useCallback(() => {
    close();
    toast({
      title: 'Keyboard shortcuts',
      description: 'Press Ctrl+K (or ⌘K on Mac) to open search anytime.',
    });
  }, [close]);

  const showAboutToast = React.useCallback(() => {
    close();
    toast({
      title: 'About Concordia College',
      description:
        'Concordia College · College Management Portal — by Cyber Advance Solutions (Pvt.) Ltd.',
    });
  }, [close]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search modules, actions, or type a command…"
      className="max-w-xl backdrop-blur-sm"
    >
      <CommandInput placeholder="Search modules, actions, or type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Modules — every sidebar item for this role */}
        <CommandGroup heading="Modules">
          {modules.flatMap((g) =>
            g.items.map((m) => {
              const Icon = m.icon;
              return (
                <CommandItem
                  key={`${g.group}:${m.id}`}
                  value={`${m.name} ${g.group}`}
                  onSelect={() => handleNavigate(m.id)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{m.name}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {g.group}
                  </span>
                </CommandItem>
              );
            })
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="go to dashboard home start"
            onSelect={handleDashboard}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem
            value="settings preferences account"
            onSelect={handleSettings}
          >
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem
            value="log out sign out"
            onSelect={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Log out</span>
            <span className="ml-auto text-[10px] text-muted-foreground/70">
              {user?.roleLabel || user?.role || ''}
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Help */}
        <CommandGroup heading="Help">
          <CommandItem
            value="keyboard shortcuts help"
            onSelect={showShortcutsToast}
          >
            <Keyboard className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Keyboard shortcuts</span>
          </CommandItem>
          <CommandItem
            value="about concordia college version info"
            onSelect={showAboutToast}
          >
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>About Concordia College</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
