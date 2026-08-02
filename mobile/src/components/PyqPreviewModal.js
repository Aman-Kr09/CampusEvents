import React from 'react';
import {
  StyleSheet, Text, View, Modal, TouchableOpacity,
  Image, ActivityIndicator, Linking, Alert
} from 'react-native';
import { X, Download, Eye, FileText, ExternalLink } from 'lucide-react-native';

export default function PyqPreviewModal({ visible, pyq, token, onClose, onDownload }) {
  if (!pyq) return null;

  const isPDF = pyq.fileType === 'pdf';
  const fileUrl = pyq.fileUrl || '';

  const handleOpenExternal = () => {
    if (!fileUrl) return;
    let target = fileUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    Linking.openURL(target).catch(() => {
      Alert.alert('Error', 'Unable to open document URL.');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.title} numberOfLines={1}>{pyq.subjectName}</Text>
              <Text style={styles.sub}>{pyq.courseCode} • {pyq.department} • Sem {pyq.semester}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          {/* Body Preview */}
          <View style={styles.body}>
            {!isPDF && fileUrl ? (
              <Image source={{ uri: fileUrl }} style={styles.previewImg} resizeMode="contain" />
            ) : (
              <View style={styles.pdfBox}>
                <FileText color="#818cf8" size={48} />
                <Text style={styles.pdfText}>{pyq.subjectName}</Text>
                <Text style={styles.pdfSub}>PDF Question Paper • {pyq.examType} ({pyq.academicYear})</Text>

                <TouchableOpacity style={styles.openExternalBtn} onPress={handleOpenExternal}>
                  <ExternalLink color="#ffffff" size={14} />
                  <Text style={styles.openExternalBtnText}>Open Document</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.downloadBtn} onPress={() => onDownload(pyq)}>
              <Download color="#ffffff" size={14} />
              <Text style={styles.downloadBtnText}>Download Paper</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  content: { backgroundColor: '#131924', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', height: '80%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  sub: { color: '#818cf8', fontSize: 11, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { flex: 1, backgroundColor: '#0b0f17', justifyContent: 'center', alignItems: 'center', padding: 16 },
  previewImg: { width: '100%', height: '100%' },
  pdfBox: { alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  pdfText: { color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  pdfSub: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  openExternalBtn: { backgroundColor: '#4f46e5', borderWidth: 1, borderColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  openExternalBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b', flexDirection: 'row', justifyContent: 'flex-end' },
  downloadBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  downloadBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
