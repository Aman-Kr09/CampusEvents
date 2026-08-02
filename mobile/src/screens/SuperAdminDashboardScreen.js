import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Building, Users, Check, X, Plus } from 'lucide-react-native';
import api from '../services/api';

export default function SuperAdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [approvalAlert, setApprovalAlert] = useState(null);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      const [resAnal, resCol] = await Promise.all([
        api.get('/superadmin/analytics'),
        api.get('/superadmin/colleges')
      ]);

      if (resAnal.data.success) setAnalytics(resAnal.data.analytics);
      if (resCol.data.success) setColleges(resCol.data.data || []);
    } catch (err) {
      console.error('SuperAdmin fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuperAdminData();
  };

  const handleUpdateStatus = async (collegeId, status) => {
    try {
      const res = await api.put(`/superadmin/colleges/${collegeId}/status`, { status });
      if (res.data.success) {
        Alert.alert('Status Updated', `College status changed to ${status}.`);
        if (res.data.adminCreated) {
          setApprovalAlert(res.data.adminCreated);
        }
        fetchSuperAdminData();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const pendingColleges = colleges.filter(c => c.status === 'Pending');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
        <Text style={styles.headerSub}>Global Platform Scaling &amp; Onboarding</Text>
      </View>

      {approvalAlert && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>✅ Admin Account Auto-Created</Text>
          <Text style={styles.alertText}>Email: {approvalAlert.email}</Text>
          <Text style={styles.alertText}>Temp Password: {approvalAlert.tempPassword}</Text>
        </View>
      )}

      {loading || !analytics ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
        >
          {/* Global Metrics Widgets */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Campuses</Text>
              <Text style={styles.metricVal}>{analytics.colleges.total}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Active Users</Text>
              <Text style={styles.metricVal}>{analytics.users.total}</Text>
            </View>
          </View>

          {/* Pending Onboarding Requests */}
          <Text style={styles.sectionTitle}>Campus Onboarding Queue ({pendingColleges.length})</Text>

          {pendingColleges.length === 0 ? (
            <Text style={styles.emptyText}>No pending onboarding requests.</Text>
          ) : (
            pendingColleges.map((col) => (
              <View key={col._id} style={styles.card}>
                <Text style={styles.cardTitle}>{col.name}</Text>
                <Text style={styles.cardSub}>{col.city}, {col.state}</Text>
                <Text style={styles.cardDesc}>Requested by: {col.requestedBy?.name || 'Representative'}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleUpdateStatus(col._id, 'Approved')}
                  >
                    <Check color="#ffffff" size={14} />
                    <Text style={styles.btnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleUpdateStatus(col._id, 'Rejected')}
                  >
                    <X color="#ffffff" size={14} />
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  alertBox: { backgroundColor: '#064e3b', padding: 14, margin: 16, borderRadius: 10, borderWidth: 1, borderColor: '#10b981' },
  alertTitle: { color: '#34d399', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  alertText: { color: '#ffffff', fontSize: 12 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, gap: 14 },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', padding: 14, borderRadius: 12 },
  metricLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricVal: { color: '#ffffff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14 },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: '#818cf8', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  cardDesc: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 6 },
  rejectBtn: { flex: 1, backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
