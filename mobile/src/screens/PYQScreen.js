import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen, Search, Download, Bookmark, BookmarkCheck,
  Eye, Plus, Layers, Tag, Calendar, GraduationCap, Clock, Trash2, Cpu
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UploadPyqModal from '../components/UploadPyqModal';
import PyqPreviewModal from '../components/PyqPreviewModal';

const SEMESTERS = ['All', 1, 2, 3, 4, 5, 6, 7];
const BRANCHES = ['All', 'CSE', 'ECE', 'EE', 'ME', 'CE', 'AIDS', 'VLSI'];
const EXAM_TYPES = ['All', 'Mid Semester', 'End Semester', 'Quiz', 'Assignment'];

export default function PYQScreen() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pyqs, setPyqs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSem, setSelectedSem] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedExamType, setSelectedExamType] = useState('All');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPreviewPyq, setSelectedPreviewPyq] = useState(null);

  const fetchPYQs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSem !== 'All') params.semester = selectedSem;
      if (selectedBranch !== 'All') params.department = selectedBranch;
      if (selectedExamType !== 'All') params.examType = selectedExamType;

      const res = await api.get('/pyq', { params });
      if (res.data.success) {
        setPyqs(res.data.pyqs || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load PYQs:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPYQs();
  }, [selectedSem, selectedBranch, selectedExamType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPYQs();
  };

  const handleToggleBookmark = async (pyqId) => {
    try {
      const res = await api.put(`/pyq/${pyqId}/bookmark`);
      if (res.data.success) {
        fetchPYQs();
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err.message);
    }
  };

  const handleDeletePyq = (pyqId) => {
    Alert.alert(
      'Delete Question Paper',
      'Are you sure you want to delete this PYQ document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/pyq/${pyqId}`);
              if (res.data.success) {
                Alert.alert('Deleted', 'Question paper deleted successfully.');
                fetchPYQs();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete paper.');
            }
          }
        }
      ]
    );
  };

  const handleDownload = (pyq) => {
    if (!pyq) return;
    const downloadUrl = `${api.defaults.baseURL}/pyq/${pyq._id}/download?token=${token}`;
    Linking.openURL(downloadUrl).catch(() => {
      if (pyq.fileUrl) {
        Linking.openURL(pyq.fileUrl);
      }
    });
  };

  const term = search.toLowerCase().trim();
  const userIdStr = user?._id?.toString();
  const isAdminUser = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const filteredPYQs = pyqs.filter(p => {
    const isBookmarked = p.bookmarkedBy?.some(id => (id?._id || id)?.toString() === userIdStr);
    const matchBookmark = !bookmarkedOnly || isBookmarked;
    const matchSearch = !term ||
      p.subjectName?.toLowerCase().includes(term) ||
      p.courseCode?.toLowerCase().includes(term) ||
      p.department?.toLowerCase().includes(term);
    return matchBookmark && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header matching Web App */}
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.headerTitle}>PYQ Vault</Text>
          <Text style={styles.headerSub}>Explore and download previous year question papers uploaded by verified students.</Text>
        </View>
      </View>

      {/* 2. Sub-Navbar Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Search color="#64748b" size={14} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subject, course code, branch..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={[styles.filterChip, bookmarkedOnly && styles.activeFilterChip]}
          onPress={() => setBookmarkedOnly(!bookmarkedOnly)}
        >
          {bookmarkedOnly ? <BookmarkCheck color="#fbbf24" size={14} /> : <Bookmark color="#64748b" size={14} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBtn} onPress={() => setShowUploadModal(true)}>
          <Plus color="#ffffff" size={14} />
          <Text style={styles.uploadBtnText}>Upload Paper</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Multi Filter Bars (Branches, Semesters, Exam Types) */}
      <View style={styles.filterBarsContainer}>
        {/* Branches / Departments Bar */}
        <View style={styles.barLabelRow}>
          <Cpu color="#38bdf8" size={12} />
          <Text style={styles.barLabelText}>Branches / Departments</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsBar}>
          {BRANCHES.map(branch => (
            <TouchableOpacity
              key={branch}
              style={[styles.pillChip, selectedBranch === branch && styles.activePillChipBranch]}
              onPress={() => setSelectedBranch(branch)}
            >
              <Text style={[styles.pillChipText, selectedBranch === branch && styles.activePillChipText]}>
                {branch === 'All' ? 'All Branches' : branch}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Semesters Bar */}
        <View style={[styles.barLabelRow, { marginTop: 6 }]}>
          <Layers color="#818cf8" size={12} />
          <Text style={styles.barLabelText}>Semester</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsBar}>
          {SEMESTERS.map(s => (
            <TouchableOpacity
              key={String(s)}
              style={[styles.pillChip, selectedSem === s && styles.activePillChip]}
              onPress={() => setSelectedSem(s)}
            >
              <Text style={[styles.pillChipText, selectedSem === s && styles.activePillChipText]}>
                {s === 'All' ? 'All Semesters' : `Sem ${s}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exam Types Bar */}
        <View style={[styles.barLabelRow, { marginTop: 6 }]}>
          <Tag color="#fbbf24" size={12} />
          <Text style={styles.barLabelText}>Exam Category</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsBar}>
          {EXAM_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.pillChip, selectedExamType === type && styles.activePillChipExam]}
              onPress={() => setSelectedExamType(type)}
            >
              <Text style={[styles.pillChipText, selectedExamType === type && styles.activePillChipText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. PYQ Cards Feed */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
        >
          {filteredPYQs.length === 0 ? (
            <Text style={styles.emptyText}>No question papers found matching your filters.</Text>
          ) : (
            filteredPYQs.map((item) => {
              const isBookmarked = item.bookmarkedBy?.some(id => (id?._id || id)?.toString() === userIdStr);
              const isUploader = (item.uploadedBy?._id || item.uploadedBy)?.toString() === userIdStr;
              const canDelete = isUploader || isAdminUser;

              return (
                <View key={item._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.deptBadge}>{item.department || 'CSE'}</Text>
                      <Text style={styles.semBadge}>Sem {item.semester}</Text>
                      <Text style={styles.examBadge}>{item.examType}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      {canDelete && (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleDeletePyq(item._id)}
                        >
                          <Trash2 color="#ef4444" size={16} />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleToggleBookmark(item._id)}
                      >
                        {isBookmarked ? <BookmarkCheck color="#fbbf24" size={16} /> : <Bookmark color="#64748b" size={16} />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.subjectName}>{item.subjectName}</Text>
                  <Text style={styles.courseCode}>{item.courseCode} • {item.department} ({item.academicYear})</Text>

                  <View style={styles.metaRow}>
                    <GraduationCap color="#64748b" size={12} />
                    <Text style={styles.metaText}>By {item.uploadedBy?.name || 'Student'}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Clock color="#64748b" size={12} />
                    <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>

                  {/* Card Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.previewBtn}
                      onPress={() => setSelectedPreviewPyq(item)}
                    >
                      <Eye color="#818cf8" size={14} />
                      <Text style={styles.previewBtnText}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={() => handleDownload(item)}
                    >
                      <Download color="#ffffff" size={14} />
                      <Text style={styles.downloadBtnText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <UploadPyqModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => fetchPYQs()}
      />

      <PyqPreviewModal
        visible={!!selectedPreviewPyq}
        pyq={selectedPreviewPyq}
        token={token}
        onClose={() => setSelectedPreviewPyq(null)}
        onDownload={handleDownload}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  titleBox: { flex: 1 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#64748b', fontSize: 11, marginTop: 2, leadingHeight: 15 },
  controlsBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b' },
  activeFilterChip: { backgroundColor: '#451a03', borderColor: '#f59e0b' },
  uploadBtn: { backgroundColor: '#4f46e5', borderWidth: 1, borderColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  filterBarsContainer: { borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 6 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, marginBottom: 2 },
  barLabelText: { color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  pillsBar: { paddingHorizontal: 16, marginVertical: 2, flexGrow: 0 },
  pillChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', marginRight: 6 },
  activePillChipBranch: { backgroundColor: '#083344', borderColor: '#0891b2' },
  activePillChip: { backgroundColor: '#1e1b4b', borderColor: '#3730a3' },
  activePillChipExam: { backgroundColor: '#451a03', borderColor: '#b45309' },
  pillChipText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activePillChipText: { color: '#ffffff', fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, gap: 12 },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deptBadge: { color: '#38bdf8', fontSize: 10, fontWeight: '700', backgroundColor: '#083344', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  semBadge: { color: '#818cf8', fontSize: 10, fontWeight: '700', backgroundColor: '#1e1b4b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  examBadge: { color: '#fbbf24', fontSize: 10, fontWeight: '700', backgroundColor: '#451a03', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  actionIconBtn: { padding: 4 },
  subjectName: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  courseCode: { color: '#818cf8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  metaText: { color: '#64748b', fontSize: 11 },
  dot: { color: '#64748b', fontSize: 11 },
  cardActionsRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', paddingVertical: 8, borderRadius: 8 },
  previewBtnText: { color: '#818cf8', fontSize: 12, fontWeight: '700' },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#059669', paddingVertical: 8, borderRadius: 8 },
  downloadBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
