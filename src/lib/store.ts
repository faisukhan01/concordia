import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type View = 'landing' | 'login' | 'portal';

export type Role = 'super-admin' | 'institute-admin' | 'branch-manager' | 'teacher' | 'student';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  title: string;
  status: string;
  mustChangePassword?: boolean;
  blocked?: boolean;
  blockedMessage?: string;
  instituteId?: string | null;
  instituteName?: string | null;
  instituteShort?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  campus: string;
  subjects?: string[];
  classes?: string[];
  class?: string;
  section?: string;
  rollNo?: string;
} | null;

type AppState = {
  view: View;
  user: AuthUser;
  token: string | null;
  activeModule: string;
  setView: (v: View) => void;
  setUser: (u: AuthUser) => void;
  setToken: (t: string | null) => void;
  setActiveModule: (m: string) => void;
  logout: () => void;
};

// Use sessionStorage so each browser tab has its own independent session.
// This prevents the "multiple tab" issue where signing in as a different user
// in one tab would overwrite the session in other tabs.
const sessionStorageAdapter = {
  getItem: (name: string) => {
    try {
      return sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      sessionStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name: string) => {
    try {
      sessionStorage.removeItem(name);
    } catch {}
  },
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      view: 'landing',
      user: null,
      token: null,
      activeModule: 'dashboard',
      setView: (v) => set({ view: v }),
      setUser: (u) => set({ user: u, activeModule: 'dashboard' }),
      setToken: (t) => set({ token: t }),
      setActiveModule: (m) => set({ activeModule: m }),
      logout: () => set({ view: 'landing', user: null, token: null, activeModule: 'dashboard' }),
    }),
    {
      name: 'esm-app',
      storage: createJSONStorage(() => sessionStorageAdapter),
    }
  )
);
