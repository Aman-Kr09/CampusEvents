import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Car, X, Check } from 'lucide-react-native';
import api from '../services/api';

const TRIP_TYPES = ['Airport', 'Railway Station', 'Metro Station', 'Home', 'Internship', 'Hackathon', 'Other'];

export default function PostRideModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '08:00 AM',
    totalSeats: '3',
    costPerSeat: '150',
    tripType: 'Railway Station',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.origin || !form.destination || !form.costPerSeat) {
      Alert.alert('Validation Error', 'Please complete origin, destination, and cost per seat.');
      return;
    }

    setLoading(true);
    try {
      // Build valid Date ISO string
      let fullDateTime = new Date();
      if (form.departureDate) {
        const parsed = new Date(form.departureDate);
        if (!isNaN(parsed.getTime())) {
          fullDateTime = parsed;
        }
      }

      const res = await api.post('/campus-connect/rides', {
        origin: form.origin,
        destination: form.destination,
        tripType: form.tripType,
        departureTime: fullDateTime.toISOString(),
        totalSeats: parseInt(form.totalSeats) || 3,
        costPerSeat: parseFloat(form.costPerSeat) || 150,
        vehicleType: 'Cab / Auto',
        notes: form.notes
      });

      if (res.data.success) {
        Alert.alert('Success', 'Ride share offer posted on CampusConnect!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post ride offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Offer a Ride Share 🚗</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <Text style={styles.label}>Origin / Pickup Point *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main Hostel Gate"
              placeholderTextColor="#64748b"
              value={form.origin}
              onChangeText={(t) => setForm({ ...form, origin: t })}
            />

            <Text style={styles.label}>Destination *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. New Delhi Railway Station"
              placeholderTextColor="#64748b"
              value={form.destination}
              onChangeText={(t) => setForm({ ...form, destination: t })}
            />

            <Text style={styles.label}>Trip Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {TRIP_TYPES.map((type) => {
                const isSelected = form.tripType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.catPill, isSelected && styles.selectedCatPill]}
                    onPress={() => setForm({ ...form, tripType: type })}
                  >
                    {isSelected && <Check color="#ffffff" size={12} />}
                    <Text style={[styles.catPillText, isSelected && styles.selectedCatPillText]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-09-15"
                  placeholderTextColor="#64748b"
                  value={form.departureDate}
                  onChangeText={(t) => setForm({ ...form, departureDate: t })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="08:00 AM"
                  placeholderTextColor="#64748b"
                  value={form.departureTime}
                  onChangeText={(t) => setForm({ ...form, departureTime: t })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Available Seats</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={form.totalSeats}
                  onChangeText={(t) => setForm({ ...form, totalSeats: t })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cost Per Seat (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="150"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={form.costPerSeat}
                  onChangeText={(t) => setForm({ ...form, costPerSeat: t })}
                />
              </View>
            </View>

            <Text style={styles.label}>Ride Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Uber/Cab split, 1 bag per person..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={form.notes}
              onChangeText={(t) => setForm({ ...form, notes: t })}
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
                <Text style={styles.submitText}>Publish Ride Offer</Text>
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
  selectedCatPill: { backgroundColor: '#059669', borderColor: '#10b981' },
  catPillText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  selectedCatPillText: { color: '#ffffff', fontWeight: '700' },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 12 },
  textArea: { height: 70, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
