import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

export default function MonthFilter({ value, onChange }) {
  let { colors } = useTheme();
  let [open, setOpen] = useState(false);
  let [temp, setTemp] = useState(value || new Date());

  function step(delta) {
    let base = value || new Date();
    onChange(new Date(base.getFullYear(), base.getMonth() + delta, 1));
  }

  let label = value
    ? value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'All time';

  return (
    <View style={[styles.bar, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <Pressable onPress={() => step(-1)} hitSlop={10} disabled={!value}>
        <Text style={[styles.chev, { color: colors.ink, opacity: value ? 1 : 0.3 }]}>‹</Text>
      </Pressable>

      <Pressable style={styles.center} onPress={() => { setTemp(value || new Date()); setOpen(true); }}>
        <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      </Pressable>

      <Pressable onPress={() => step(1)} hitSlop={10} disabled={!value}>
        <Text style={[styles.chev, { color: colors.ink, opacity: value ? 1 : 0.3 }]}>›</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Pressable onPress={() => { onChange(null); setOpen(false); }}>
              <Text style={[styles.action, { color: colors.muted }]}>All time</Text>
            </Pressable>
            <Pressable onPress={() => { onChange(new Date(temp.getFullYear(), temp.getMonth(), 1)); setOpen(false); }}>
              <Text style={[styles.action, { color: colors.accent }]}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={temp}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, sel) => { if (sel) setTemp(sel); }}
          />
        </View>
      </Modal>
    </View>
  );
}

let styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 14 },
  center: { flex: 1, alignItems: 'center' },
  chev: { fontSize: 22, fontWeight: '600', paddingHorizontal: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  action: { fontSize: 15, fontWeight: '700' },
});