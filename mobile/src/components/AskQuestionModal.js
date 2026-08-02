import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { HelpCircle, X } from 'lucide-react-native';
import api from '../services/api';

export default function AskQuestionModal({ visible, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please complete both the question title and content body.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/qa/questions', { title: title.trim(), content: content.trim() });
      if (res.data.success) {
        Alert.alert('Question Posted', 'Your question has been published to the student Q&A board!');
        setTitle('');
        setContent('');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <HelpCircle color="#818cf8" size={18} />
              <Text style={styles.title}>Ask a Student Question</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <Text style={styles.label}>Question Subject / Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Best resources to prepare for OS End-Sem?"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Question Details &amp; Context *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide complete context, course codes, or specific doubts..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={5}
              value={content}
              onChangeText={setContent}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitText}>Publish Question</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  content: { backgroundColor: '#131924', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  formScroll: { padding: 16 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 14 },
  textArea: { height: 100, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
