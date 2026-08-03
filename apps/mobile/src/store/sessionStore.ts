import { create } from 'zustand';

// This app is the field (Sales Representative + Distributor) mobile app.
// Super Admin/Organization Admin/Sales Manager are Web-only roles per the
// BRD — any other role must be denied access here.
export const ALLOWED_ROLES = ['Sales Representative', 'Distributor'] as const;
export type AllowedRole = typeof ALLOWED_ROLES[number];

export interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  role: string;
  distributorId?: string;
  [key: string]: any;
}

interface SessionState {
  user: SessionUser | null;
  isInitializing: boolean;
  setUser: (user: SessionUser | null) => void;
  setInitializing: (v: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isInitializing: true,
  setUser: (user) => set({ user }),
  setInitializing: (v) => set({ isInitializing: v }),
}));

export function isAllowedRole(role?: string): role is AllowedRole {
  return !!role && (ALLOWED_ROLES as readonly string[]).includes(role);
}
