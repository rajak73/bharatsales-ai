import { Linking, Platform } from 'react-native';

export function callPhone(mobile: string): void {
  if (!mobile) return;
  Linking.openURL(`tel:${mobile}`).catch(() => {});
}

export function openWhatsApp(mobile: string, message?: string): void {
  if (!mobile) return;
  const digits = mobile.replace(/[^\d+]/g, '');
  const url = `https://wa.me/${digits.replace('+', '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  Linking.openURL(url).catch(() => {});
}

// Opens the platform's native maps app for turn-by-turn navigation to a
// lat/lng — Apple Maps on iOS, Google Maps on Android, matching the spec's
// "Google Navigation" requirement without bundling a maps SDK just for this.
export function navigateToLocation(lat: number, lng: number, label?: string): void {
  const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
  const url = Platform.select({
    ios: `maps:0,0?q=${query}@${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  });
  Linking.openURL(url!).catch(() => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
  });
}
