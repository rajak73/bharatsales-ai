// Native: expo-secure-store (encrypted, OS-keychain-backed). The sibling
// secureStore.web.ts is picked by Metro only for the web preview build.
export { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
