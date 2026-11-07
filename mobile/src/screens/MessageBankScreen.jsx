import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable,
  TextInput, Alert, Switch, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as fallbackApi from '../api/fallback';

export default function MessageBankScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [draft, setDraft] = useState('');
  let [busy, setBusy] = useState(false);

  let load = useCallback(() => {
    let active = true;
    fallbackApi.listMessages()
      .then((data) => { if (active) setItems(data); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(load);

  async function add() {
    let texts = draft.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!texts.length) {
      Alert.alert('Nothing to add', 'Type or paste at least one message.');
      return;
    }
    setBusy(true);
    try {
      let created = await fallbackApi.addMessages(texts);
      setItems((prev) => [...created, ...prev]);
      setDraft('');
    } catch (err) {
      Alert.alert('Could not add', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item, value) {
    setItems((prev) => prev.map((m) => (m._id === item._id ? { ...m, active: value } : m)));
    try {
      await fallbackApi.updateMessage(item._id, { active: value });
    } catch (err) {
      setItems((prev) => prev.map((m) => (m._id === item._id ? { ...m, active: !value } : m)));
      Alert.alert('Could not update', 'Try again in a moment.');
    }
  }

  function confirmDelete(item) {
    Alert.alert('Delete this message?', 'It will be removed from the bank.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fallbackApi.deleteMessage(item._id);
            setItems((prev) => prev.filter((m) => m._id !== item._id));
          } catch (err) {
            Alert.alert('Could not delete', 'Try again in a moment.');
          }
        },
      },
    ]);
  }

  let activeCount = items.filter((m) => m.active).length;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.ink }]}>Message bank</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Used automatically on any day without a scheduled message. {activeCount} active.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={{ marginBottom: 6 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                  placeholder={'Add messages. One per line, paste as many as you like.'}
                  placeholderTextColor={colors.muted}
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                />
                <Pressable
                  style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
                  onPress={add}
                  disabled={busy}
                >
                  <Text style={[styles.btnText, { color: colors.surface }]}>
                    {busy ? 'Adding…' : 'Add to bank'}
                  </Text>
                </Pressable>
              </View>
            }
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.muted }]}>No messages in the bank yet.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line, opacity: item.active ? 1 : 0.55 }]}
                onLongPress={() => confirmDelete(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowText, { color: colors.ink }]}>{item.text}</Text>
                  <Text style={[styles.rowMeta, { color: colors.muted }]}>
                    {item.useCount ? `Used ${item.useCount}×` : 'Not used yet'}
                  </Text>
                </View>
                <Switch value={item.active} onValueChange={(v) => toggle(item, v)} />
              </Pressable>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 16, lineHeight: 19 },
  list: { gap: 9, paddingBottom: 24 },
  input: { borderWidth: 1, borderRadius: 13, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 10 },
  btn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  btnText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 15, padding: 15 },
  rowText: { fontSize: 14, lineHeight: 20 },
  rowMeta: { fontSize: 11.5, marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 30, fontSize: 14 },
});