import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Calendar, X, Plus, Check } from 'lucide-react-native';
import api from '../services/api';

const CATEGORIES = [
  'Coding', 'Hackathons', 'AI/ML', 'Robotics', 'Workshop',
  'Cultural Events', 'Sports', 'Research', 'Design', 'Fest', 'Gaming'
];

export default function CreateEventModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Coding',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    venue: '',
    description: '',
    registrationLink: '',
    organizer: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.venue || !form.description) {
      Alert.alert('Validation Error', 'Please complete event name, venue, and description.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/events', form);
      if (res.data.success) {
        Alert.alert('Event Submitted', 'Your event proposal has been submitted for moderation review!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit event proposal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Submit Event Proposal</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flipkart GRiD 8.0"
              placeholderTextColor="#64748b"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />

            {/* Category Dropdown Pills */}
            <Text style={styles.label}>Event Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = form.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catPill, isSelected && styles.selectedCatPill]}
                    onPress={() => setForm({ ...form, category: cat })}
                  >
                    {isSelected && <Check color="#ffffff" size={12} />}
                    <Text style={[styles.catPillText, isSelected && styles.selectedCatPillText]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-09-15"
                  placeholderTextColor="#64748b"
                  value={form.date}
                  onChangeText={(t) => setForm({ ...form, date: t })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00 AM"
                  placeholderTextColor="#64748b"
                  value={form.time}
                  onChangeText={(t) => setForm({ ...form, time: t })}
                />
              </View>
            </View>

            <Text style={styles.label}>Venue / Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main Auditorium or Online"
              placeholderTextColor="#64748b"
              value={form.venue}
              onChangeText={(t) => setForm({ ...form, venue: t })}
            />

            <Text style={styles.label}>Registration Link / Form URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://unstop.com/... or https://forms.gle/..."
              placeholderTextColor="#64748b"
              value={form.registrationLink}
              onChangeText={(t) => setForm({ ...form, registrationLink: t })}
            />

            <Text style={styles.label}>Organizer / Club Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Coding Club / IEEE Chapter"
              placeholderTextColor="#64748b"
              value={form.organizer}
              onChangeText={(t) => setForm({ ...form, organizer: t })}
            />

            <Text style={styles.label}>Event Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide full event details, eligibility, cash prizes..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
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
                <Text style={styles.submitText}>Submit Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  content: { backgroundColor: '#131924', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  formScroll: { padding: 16 },
  row: { flexDirection: 'row', gap: 10 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  catScroll: { flexDirection: 'row', marginBottom: 14, flexGrow: 0 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', marginRight: 6 },
  selectedCatPill: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  catPillText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  selectedCatPillText: { color: '#ffffff', fontWeight: '700' },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
