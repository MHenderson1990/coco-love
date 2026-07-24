import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { PALETTES, PALETTE_KEYS } from '../theme/palettes';

export default function ProfileScreen({ navigation }) {
  let { colors, palette, setPalette, mode, setMode } = useTheme();
  let { user, logout } = useAuth();

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: colors.ink }]}>Make it yours</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>{user?.name} · {user?.email}</Text>
       

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Appearance</Text>
          <View style={[styles.toggle, { borderColor: colors.line }]}>
            {['light', 'dark'].map((m) => (
              <Pressable
                key={m}
                style={[styles.toggleBtn, mode === m && { backgroundColor: colors.accent }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.toggleText, { color: mode === m ? colors.surface : colors.muted }]}>
                  {m === 'light' ? 'Light' : 'Dark'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Color</Text>
          <View style={styles.swatches}>
            {PALETTE_KEYS.map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.swatch,
                  { backgroundColor: PALETTES[key][mode].accent },
                  palette === key && { borderWidth: 3, borderColor: colors.ink },
                ]}
                onPress={() => setPalette(key)}
              />
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
          onPress={() => navigation.navigate('Journal')}
        >
          <Text style={[styles.label, { color: colors.ink }]}>Your journal</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
            Everything you've written
          </Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
          onPress={() => navigation.navigate('Announcements')}
        >
          <Text style={[styles.label, { color: colors.ink }]}>From Coco</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
            News and notes
          </Text>
        </Pressable>

        {user?.role === 'admin' && (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => navigation.navigate('Admin')}
          >
            <Text style={[styles.label, { color: colors.ink }]}>Your dashboard</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
              Members, messages, and announcements
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.signout, { borderColor: colors.line, backgroundColor: colors.surface }]}
          onPress={logout}
        >
          <Text style={[styles.signoutText, { color: colors.accent }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  body: { paddingHorizontal: 22, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: '500', marginTop: 18, letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 15, padding: 16, marginBottom: 10, gap: 14 },
  label: { fontSize: 13.5, fontWeight: '600' },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 100, overflow: 'hidden', alignSelf: 'flex-start' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  toggleText: { fontSize: 12, fontWeight: '700' },
  swatches: { flexDirection: 'row', gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  signout: { borderWidth: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  signoutText: { fontSize: 14, fontWeight: '700' },
});