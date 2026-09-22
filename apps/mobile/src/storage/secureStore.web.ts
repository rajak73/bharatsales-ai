// Web-only fallback used when the app is previewed through react-native-web
// (expo-secure-store has no web implementation). Never bundled into the
// Android/iOS app — Metro resolves secureStore.ts for native platforms.
function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  return store()?.getItem(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  store()?.setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  store()?.removeItem(key);
}
