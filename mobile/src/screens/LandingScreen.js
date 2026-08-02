import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Search, Building, MessageSquare, Monitor } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen({ navigation }) {
  const { colleges } = useAuth();
  const [search, setSearch] = useState('');

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddCollegePress = () => {
    Alert.alert(
      'Desktop Web Feature 💻',
      'Campus onboarding and adding a new college can only be accessed from a Computer / Desktop Web Browser.\n\nPlease open https://campus-events-phi.vercel.app/ on your computer browser to submit a campus onboarding request.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Logo Left & Sign In Right */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Calendar color="#818cf8" size={16} />
            <Text style={styles.logoText} numberOfLines={1}>CampusEvents</Text>
          </View>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Centered Search & Directory Header */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionTitle}>Select Your Campus</Text>
          <TouchableOpacity style={styles.addCollegeBtn} onPress={handleAddCollegePress}>
            <Monitor color="#818cf8" size={12} />
            <Text style={styles.addCollegeText}>+ Add College (Desktop Only)</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search color="#64748b" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search institution or city..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* College Directory List */}
        <View style={styles.collegeList}>
          {filteredColleges.map((col) => (
            <TouchableOpacity
              key={col._id}
              style={styles.collegeCard}
              onPress={() => navigation.navigate('Login', { selectedCollege: col._id })}
            >
              <View style={styles.collegeIcon}>
                <Building color="#818cf8" size={20} />
              </View>
              <View style={styles.collegeInfo}>
                <Text style={styles.collegeName}>{col.name}</Text>
                <Text style={styles.collegeLocation}>{col.city || 'Campus'}, {col.state || 'India'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Centered Footer Links */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.footerLinkBtn}
            onPress={() => navigation.navigate('Contact')}
          >
            <MessageSquare color="#818cf8" size={13} />
            <Text style={styles.footerLinkText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'center',
    flexGrow: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center'
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3730a3'
  },
  logoText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  signInBtn: {
    marginLeft: 'auto',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  signInBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  sectionHeaderBox: { width: '100%', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  addCollegeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e1b4b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#3730a3' },
  addCollegeText: { color: '#818cf8', fontSize: 11, fontWeight: '700' },
  searchBox: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  collegeList: { width: '100%', gap: 10 },
  collegeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 16 },
  collegeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3730a3' },
  collegeInfo: { flex: 1 },
  collegeName: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  collegeLocation: { color: '#64748b', fontSize: 12, marginTop: 2 },
  footerRow: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  footerLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8 },
  footerLinkText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  footerDot: { color: '#475569', fontSize: 12 },
});
