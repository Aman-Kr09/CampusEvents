import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { BookOpen, X, Check } from 'lucide-react-native';
import api from '../services/api';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7];
const EXAM_TYPES = ['Mid Semester', 'End Semester', 'Quiz', 'Assignment'];
const ACADEMIC_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];
const DEPARTMENTS = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'AIDS', 'VLSI'];

export default function UploadPyqModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    subjectName: '',
    courseCode: '',
    semester: '1',
    department: 'CSE',
    academicYear: '2023-24',
    examType: 'End Semester',
    fileUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.subjectName || !form.courseCode || !form.fileUrl) {
      Alert.alert('Validation Error', 'Please enter subject name, course code, and document URL.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/pyq', {
        subjectName: form.subjectName.trim(),
        courseCode: form.courseCode.trim().toUpperCase(),
        semester: parseInt(form.semester) || 1,
        department: form.department || 'CSE',
        academicYear: form.academicYear || '2023-24',
        examType: form.examType || 'End Semester',
        fileUrl: form.fileUrl.trim()
      });

      if (res.data.success) {
        Alert.alert('Success', 'Previous Year Question paper uploaded successfully!');
        onSuccess(res.data.pyq);
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload paper.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Upload Previous Year Paper 📚</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <Text style={styles.label}>Subject Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Data Structures & Algorithms"
              placeholderTextColor="#64748b"
              value={form.subjectName}
              onChangeText={(t) => setForm({ ...form, subjectName: t })}
            />

            <Text style={styles.label}>Course Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CSL201"
              placeholderTextColor="#64748b"
              value={form.courseCode}
              onChangeText={(t) => setForm({ ...form, courseCode: t })}
            />

            {/* Semester Select Pills */}
            <Text style={styles.label}>Semester *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {SEMESTERS.map((sem) => {
                const isSelected = parseInt(form.semester) === sem;
                return (
                  <TouchableOpacity
                    key={sem}
                    style={[styles.catPill, isSelected && styles.selectedCatPill]}
                    onPress={() => setForm({ ...form, semester: String(sem) })}
                  >
                    {isSelected && <Check color="#ffffff" size={12} />}
                    <Text style={[styles.catPillText, isSelected && styles.selectedCatPillText]}>Sem {sem}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exam Type Select Pills */}
            <Text style={styles.label}>Exam Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {EXAM_TYPES.map((type) => {
                const isSelected = form.examType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.catPill, isSelected && styles.selectedCatPill]}
                    onPress={() => setForm({ ...form, examType: type })}
                  >
                    {isSelected && <Check color="#ffffff" size={12} />}
                    <Text style={[styles.catPillText, isSelected && styles.selectedCatPillText]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Department Pills */}
            <Text style={styles.label}>Department / Branch *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = form.department === dept;
                return (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.catPill, isSelected && styles.selectedCatPill]}
                    onPress={() => setForm({ ...form, department: dept })}
                  >
                    {isSelected && <Check color="#ffffff" size={12} />}
                    <Text style={[styles.catPillText, isSelected && styles.selectedCatPillText]}>{dept}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Academic Year Pills */}
            <Text style={styles.label}>Academic Year *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {ACADEMIC_YEARS.map((yr) => {
                const isSelected = form.academicYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.catPill, isSelected && styles.selectedCatPill]}
                    onPress={() => setForm({ ...form, academicYear: yr })}
                  >
                    {isSelected && <Check color="#ffffff" size={12} />}
                    <Text style={[styles.catPillText, isSelected && styles.selectedCatPillText]}>{yr}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>PDF / Image Document URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://drive.google.com/... or Cloudinary URL"
              placeholderTextColor="#64748b"
              value={form.fileUrl}
              onChangeText={(t) => setForm({ ...form, fileUrl: t })}
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
                <Text style={styles.submitText}>Upload PYQ</Text>
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
  selectedCatPill: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  catPillText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  selectedCatPillText: { color: '#ffffff', fontWeight: '700' },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
