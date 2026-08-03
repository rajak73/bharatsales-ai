import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

interface AvatarProps {
  uri?: string | null;
  initials: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

// Shared by both the user avatar (Profile/Home headers) and the org logo
// (OrgHeader) — same fallback rule either way: show the image if present,
// otherwise a colored circle with initials.
export function Avatar({ uri, initials, size = 44, backgroundColor = colors.primaryLight, textColor = colors.primary }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimension]} />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor }]}>
      <Text style={[styles.initials, { color: textColor, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800' },
});
