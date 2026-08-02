import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, GraduationCap, Calendar, LogOut, Edit2, X, Check } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, updateProfile, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    branch: user?.branch || '',
    year: user?.year || 1
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    if (res.success) {
      Alert.alert('Profile Updated', 'Your account credentials have been saved!');
      setShowEditModal(false);
    } else {
      Alert.alert('Error', res.message || 'Failed to update profile.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
            <Edit2 color="#818cf8" size={14} />
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase()}</Text>
          </View>

          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role || 'Student'}</Text>

          <View style={styles.infoRow}>
            <GraduationCap color="#818cf8" size={14} />
            <Text style={styles.infoText}>{user?.branch || 'General Studies'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar color="#38bdf8" size={14} />
            <Text style={styles.infoText}>Year {user?.year || 1} Student</Text>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Interests Calibration</Text>
          <View style={styles.tagContainer}>
            {user?.interests && user.interests.length > 0 ? (
              user.interests.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No interest tags selected.</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut color="#ef4444" size={16} />
          <Text style={styles.logoutBtnText}>Sign Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Credentials</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X color="#94a3b8" size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />

              <Text style={styles.label}>Academic Branch</Text>
              <TextInput
                style={styles.input}
                value={form.branch}
                onChangeText={(t) => setForm({ ...form, branch: t })}
              />

              <Text style={styles.label}>Academic Year (1 - 4)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.year.toString()}
                onChangeText={(t) => setForm({ ...form, year: parseInt(t) || 1 })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  scrollContent: { padding: 16, gap: 16 },
  profileCard: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center', position: 'relative' },
  editBtn: { position: 'absolute', top: 14, right: 14, padding: 6, backgroundColor: '#1e1b4b', borderRadius: 8 },
  avatar: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#818cf8', fontSize: 22, fontWeight: '800' },
  userName: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  userRole: { color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { color: '#94a3b8', fontSize: 13 },
  sectionCard: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 16 },
  sectionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagText: { color: '#818cf8', fontSize: 11, fontWeight: '600' },
  emptyText: { color: '#64748b', fontSize: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#450a0a', borderWidth: 1, borderColor: '#991b1b', paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  logoutBtnText: { color: '#fca5a5', fontWeight: '700', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  content: { backgroundColor: '#131924', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  formContent: { padding: 16 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  saveBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
