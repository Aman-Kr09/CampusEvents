import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Switch
} from 'react-native';
import { ShoppingBag, X, Check } from 'lucide-react-native';
import api from '../services/api';

const CATEGORIES = ['Books', 'Calculators', 'Lab Coats', 'Cycles', 'Hostel Essentials', 'Electronics', 'Clothing', 'Other'];
const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];

export default function PostMarketplaceModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    category: 'Books',
    condition: 'Like New',
    price: '250',
    isGiveaway: false,
    pickupLocation: 'Main Hostel Gate',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      Alert.alert('Validation Error', 'Please enter title and item description.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/campus-connect/marketplace', {
        title: form.title,
        description: form.description,
        category: form.category,
        condition: form.condition,
        price: form.isGiveaway ? 0 : parseFloat(form.price) || 0,
        isGiveaway: form.isGiveaway,
        pickupLocation: form.pickupLocation || 'Main Campus Gate'
      });
      if (res.data.success) {
        Alert.alert('Success', 'Listing posted successfully on CampusConnect!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Post Item Listing 🛍️</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <Text style={styles.label}>Item Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Casio fx-991EX Scientific Calculator"
              placeholderTextColor="#64748b"
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
            />

            <Text style={styles.label}>Item Category *</Text>
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

            <Text style={styles.label}>Condition *</Text>
            <View style={styles.condRow}>
              {CONDITIONS.map((cond) => {
                const isSelected = form.condition === cond;
                return (
                  <TouchableOpacity
                    key={cond}
                    style={[styles.condChip, isSelected && styles.selectedCondChip]}
                    onPress={() => setForm({ ...form, condition: cond })}
                  >
                    <Text style={[styles.condChipText, isSelected && styles.selectedCondChipText]}>{cond}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Pickup Location on Campus *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main Hostel Gate / Block B"
              placeholderTextColor="#64748b"
              value={form.pickupLocation}
              onChangeText={(t) => setForm({ ...form, pickupLocation: t })}
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Mark as Free Giveaway 🎁</Text>
              <Switch
                value={form.isGiveaway}
                onValueChange={(v) => setForm({ ...form, isGiveaway: v })}
                trackColor={{ false: '#1e293b', true: '#059669' }}
              />
            </View>

            {!form.isGiveaway && (
              <>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="250"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(t) => setForm({ ...form, price: t })}
                />
              </>
            )}

            <Text style={styles.label}>Item Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe condition, pickup location on campus..."
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
                <Text style={styles.submitText}>Post Listing</Text>
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
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  catScroll: { flexDirection: 'row', marginBottom: 14, flexGrow: 0 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', marginRight: 6 },
  selectedCatPill: { backgroundColor: '#38bdf8', borderColor: '#0284c7' },
  catPillText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  selectedCatPillText: { color: '#ffffff', fontWeight: '700' },
  condRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  condChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b' },
  selectedCondChip: { backgroundColor: '#1e1b4b', borderColor: '#3730a3' },
  condChipText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  selectedCondChipText: { color: '#818cf8', fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 12 },
  textArea: { height: 70, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
