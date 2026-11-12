import { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as adminApi from '../api/admin';
import RichText from '../components/RichText';

let TIERS = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

function fmt(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MembersScreen({ navigation }) {
  let { colors } = useTheme();
  let [members, setMembers] = useState([]);
  let [total, setTotal] = useState(0);
  let [page, setPage] = useState(1);
  let [pages, setPages] = useState(1);
  let [loading, setLoading] = useState(true);
  let [loadingMore, setLoadingMore] = useState(false);
  let [search, setSearch] = useState('');
  let [tier, setTier] = useState('all');
  let [openId, setOpenId] = useState(null);
  let [favs, setFavs] = useState({}); // { [userId]: array | 'loading' }
  let reqId = useRef(0);

  async function fetchPage(p, replace, s, t) {
    let id = ++reqId.current;
    try {
      let data = await adminApi.listMembers({
        search: s,
        tier: t === 'all' ? undefined : t,
        page: p,
      });
      if (id !== reqId.current) return;
      setMembers((prev) => (replace ? data.members : [...prev, ...data.members]));
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      if (id === reqId.current && replace) setMembers([]);
    } finally {
      if (id === reqId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  // reload from page 1 whenever the search or filter changes (search waits a moment while typing)
  useEffect(() => {
    setLoading(true);
    let handle = setTimeout(() => fetchPage(1, true, search.trim(), tier), 300);
    return () => clearTimeout(handle);
  }, [search, tier]);

  function loadMore() {
    if (loading || loadingMore || page >= pages) return;
    setLoadingMore(true);
    fetchPage(page + 1, false, search.trim(), tier);
  }

  async function toggle(member) {
    if (openId === member._id) {
      setOpenId(null);
      return;
    }
    setOpenId(member._id);
    if (favs[member._id]) return;
    setFavs((prev) => ({ ...prev, [member._id]: 'loading' }));
    try {
      let liked = await adminApi.getUserFavorites(member._id);
      setFavs((prev) => ({ ...prev, [member._id]: liked }));
    } catch (err) {
      setFavs((prev) => ({ ...prev, [member._id]: [] }));
    }
  }

  function renderMember({ item }) {
    let open = openId === item._id;
    let saved = favs[item._id];
    let isPaid = item.tier === 'paid';
    return (
      <Pressable
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
        onPress={() => toggle(item)}
      >
        <View style={styles.rowTop}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: isPaid ? colors.accent : colors.accentSoft }]}>
            <Text style={{ color: isPaid ? colors.surface : colors.muted, fontSize: 10.5, fontWeight: '700' }}>
              {item.role === 'admin' ? 'ADMIN' : isPaid ? 'PAID' : 'FREE'}
            </Text>
          </View>
        </View>
        <Text style={[styles.email, { color: colors.muted }]} numberOfLines={1}>{item.email}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Joined {fmt(item.createdAt) || '—'}
          {item.currentStreak ? `  ·  ${item.currentStreak} day streak` : ''}
          {item.lastOpenedDate ? `  ·  Last active ${fmt(item.lastOpenedDate)}` : ''}
        </Text>

        {open ? (
          <View style={[styles.saved, { borderTopColor: colors.line }]}>
            <Text style={[styles.savedLabel, { color: colors.muted }]}>SAVED MESSAGES</Text>
            {saved === 'loading' || !saved ? (
              <ActivityIndicator color={colors.accent} style={{ alignSelf: 'flex-start' }} />
            ) : saved.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 13 }}>Nothing saved yet.</Text>
            ) : (
              saved.slice(0, 10).map((a) => (
                <RichText
                  key={a.affirmationId}
                  style={{ color: colors.ink, fontSize: 13, lineHeight: 19, marginBottom: 8 }}
                  text={a.text}
                />
              ))
            )}
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.ink }]}>Members</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        {total} {total === 1 ? 'member' : 'members'}{search || tier !== 'all' ? ' match' : ''}. Tap one to see what they've saved.
      </Text>

      <TextInput
        style={[styles.search, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
        placeholder="Search by name or email"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={[styles.toggle, { borderColor: colors.line }]}>
        {TIERS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.toggleBtn, tier === t.key && { backgroundColor: colors.accent }]}
            onPress={() => setTier(t.key)}
          >
            <Text style={{ color: tier === t.key ? colors.surface : colors.muted, fontSize: 12, fontWeight: '700' }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>No members found.</Text>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 14, lineHeight: 19 },
  search: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 10 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 100, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 14 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  list: { gap: 9, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, padding: 15 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  email: { fontSize: 13, marginTop: 3 },
  meta: { fontSize: 11.5, marginTop: 8, lineHeight: 17 },
  saved: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  savedLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});