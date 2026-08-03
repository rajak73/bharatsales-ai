import { create } from 'zustand';
import { SettingsService } from '@bharatsales/api-client';

interface OrgState {
  name: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  isLoaded: boolean;
  loadOrgBranding: () => Promise<void>;
  reset: () => void;
}

// Org identity (name/logo/brand color) is fetched once after login via the
// additive, self-service GET /settings/branding endpoint — best-effort, same
// as registerForPushNotifications: a failure here should never block the
// app, it just falls back to the static theme primary color and an
// initials avatar (handled by consuming components, not here).
export const useOrgStore = create<OrgState>((set) => ({
  name: null,
  logoUrl: null,
  primaryColor: null,
  isLoaded: false,
  loadOrgBranding: async () => {
    try {
      const { name, branding } = await SettingsService.getBranding();
      set({ name, logoUrl: branding?.logoUrl || null, primaryColor: branding?.primaryColor || null, isLoaded: true });
    } catch (err) {
      console.warn('[Org] Failed to load org branding', err);
      set({ isLoaded: true });
    }
  },
  reset: () => set({ name: null, logoUrl: null, primaryColor: null, isLoaded: false }),
}));
