import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Monitor, ShieldAlert, ExternalLink, Lock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardScreen() {
  const { user } = useAuth();

  const handleOpenWeb = () => {
    Linking.openURL('https://campus-events-phi.vercel.app/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Admin Console</Text>
        <Text style={styles.headerSub}>Moderation &amp; Governance Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Desktop Only Notice Card */}
        <View style={styles.noticeCard}>
          <View style={styles.iconCircle}>
            <Monitor color="#818cf8" size={36} />
          </View>

          <View style={styles.badge}>
            <Lock color="#818cf8" size={12} />
            <Text style={styles.badgeText}>Desktop Mode Only</Text>
          </View>

          <Text style={styles.title}>College Admin Portal 💻</Text>

          <Text style={styles.description}>
            The Campus Admin Console, event approval queue, content moderation tools, and governance reports are accessible exclusively on a <Text style={styles.boldText}>Desktop Web Browser</Text>.
          </Text>

          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>Access Full Admin Console At:</Text>
            <Text style={styles.urlText}>https://campus-events-phi.vercel.app/</Text>
          </View>

          <TouchableOpacity style={styles.openWebBtn} onPress={handleOpenWeb}>
            <ExternalLink color="#ffffff" size={16} />
            <Text style={styles.openWebBtnText}>Open Web Portal</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <ShieldAlert color="#64748b" size={14} />
            <Text style={styles.infoText}>
              Log in with your College Admin credentials on your PC or Mac for full moderation controls.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  header: { paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    flexGrow: 1,
    alignItems: 'center'
  },
  noticeCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#131924',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#3730a3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3730a3'
  },
  badgeText: { color: '#818cf8', fontSize: 11, fontWeight: '700' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center'
  },
  boldText: { color: '#ffffff', fontWeight: '700' },
  urlBox: {
    width: '100%',
    backgroundColor: '#0b0f17',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4
  },
  urlLabel: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  urlText: { color: '#818cf8', fontSize: 13, fontWeight: '800' },
  openWebBtn: {
    width: '100%',
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1'
  },
  openWebBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    width: '100%'
  },
  infoText: { color: '#64748b', fontSize: 11, flex: 1, lineHeight: 15 }
});
