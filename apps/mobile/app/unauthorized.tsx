import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSessionStore } from '../src/store/sessionStore';
import { useAuth } from '../src/lib/useAuth';

export default function UnauthorizedScreen() {
  const user = useSessionStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Use the Web Dashboard</Text>
      <Text style={styles.body}>
        This mobile app is only for Sales Representatives and Distributors.{'\n'}
        {user?.role ? `Your role (${user.role})` : 'Your role'} should sign in at the BharatSales AI web dashboard instead.
      </Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  button: { backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
