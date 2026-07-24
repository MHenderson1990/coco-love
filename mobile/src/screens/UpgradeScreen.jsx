import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

let PERKS = [
  'Every session in the library',
  'New videos as Coco adds them',
  'Support the work directly',
];

export default function UpgradeScreen({ navigation }) {
  let { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.ink }]}>Go deeper</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          The daily message is always free. Membership opens the full library.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perk}>
              <Text style={[styles.check, { color: colors.accent }]}>✓</Text>
              <Text style={[styles.perkText, { color: colors.ink }]}>{perk}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.btn, { backgroundColor: colors.accent }]}
          onPress={() => Alert.alert('Almost there', 'Memberships open soon.')}
        >
          <Text style={[styles.btnText, { color: colors.surface }]}>Become a member</Text>
        </Pressable>

        <Text style={[styles.fine, { color: colors.muted }]}>
          Pricing coming soon.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  body: { paddingHorizontal: 22, paddingBottom: 40 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '500', letterSpacing: -0.5 },
  sub: { fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 22 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 14, marginBottom: 20 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  check: { fontSize: 15, fontWeight: '700' },
  perkText: { fontSize: 14.5, flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 14.5, fontWeight: '700' },
  fine: { fontSize: 12, textAlign: 'center', marginTop: 14 },
});