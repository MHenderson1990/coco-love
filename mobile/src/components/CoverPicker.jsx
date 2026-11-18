import { useState } from 'react';
import { View, Text, Pressable, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import client from '../api/client';

// kind: 'audio' | 'video'. Calls onChange(key) after an upload, or onChange(null) when removed.
export default function CoverPicker({ kind, coverUrl, colors, onChange }) {
  let [preview, setPreview] = useState(coverUrl || null);
  let [busy, setBusy] = useState(false);

  async function pick() {
    let perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo access in Settings to add a cover image.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    let uri = result.assets[0].uri;
    setBusy(true);
    try {
      let res = await client.post(`/${kind}/cover-url`);
      let { url, key } = res.data;
      let up = await FileSystem.uploadAsync(url, uri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      if (up.status < 200 || up.status >= 300) throw new Error('upload failed');
      setPreview(uri);
      onChange(key);
    } catch (err) {
      Alert.alert('Could not upload', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    setPreview(null);
    onChange(null);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={pick}
        disabled={busy}
        style={[styles.box, { borderColor: colors.line, backgroundColor: colors.bg }]}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={styles.img} />
        ) : (
          <Text style={{ color: colors.muted, fontSize: 12 }}>Add cover</Text>
        )}
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>Cover image</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
          Square. You pick which part of the photo to keep.
        </Text>
        {preview ? (
          <Pressable onPress={remove}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 6 }}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  box: { width: 72, height: 72, borderRadius: 12, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  busy: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
});