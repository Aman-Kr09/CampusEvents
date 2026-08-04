import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen({ navigation }) {
  const { colleges } = useAuth();
  const [search, setSearch] = useState('');

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const getInitials = (name) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const avatarColors = ['#6366f1', '#0891b2', '#7c3aed', '#059669', '#d97706'];
  const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07090f" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO SECTION ──────────────────────────────────── */}
        <View style={styles.heroSection}>
          {/* Brand pill — no dot */}
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>CampusEvents</Text>
          </View>

          <Text style={styles.heroHeadline}>
            Stay Connected{'\n'}to Your Campus
          </Text>
          <Text style={styles.heroSubtext}>
            Discover events, share resources, and engage{'\n'}with your college community.
          </Text>
        </View>

        {/* ── SEARCH BAR ────────────────────────────────────── */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search institution or city..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── COLLEGE LIST ──────────────────────────────────── */}
        <View style={styles.collegeList}>
          {filteredColleges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏫</Text>
              <Text style={styles.emptyTitle}>No campuses found</Text>
              <Text style={styles.emptySubtext}>Try a different name or city</Text>
            </View>
          ) : (
            filteredColleges.map((col, index) => (
              <TouchableOpacity
                key={col._id}
                style={styles.collegeCard}
                onPress={() => navigation.navigate('Login', { selectedCollege: col._id })}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.collegeAvatar,
                  { backgroundColor: getAvatarColor(index) + '22', borderColor: getAvatarColor(index) + '55' }
                ]}>
                  <Text style={[styles.collegeAvatarText, { color: getAvatarColor(index) }]}>
                    {getInitials(col.name)}
                  </Text>
                </View>

                <View style={styles.collegeInfo}>
                  <Text style={styles.collegeName} numberOfLines={2}>{col.name}</Text>
                  <Text style={styles.collegeLocation}>
                    {col.city ? `${col.city}, ` : ''}{col.state || 'India'}
                  </Text>
                </View>

                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.contactLinkText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090f',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },

  // ── HERO ────────────────────────────────────────────────
  heroSection: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  brandPill: {
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4338ca',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 22,
  },
  brandPillText: {
    color: '#a5b4fc',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  heroHeadline: {
    color: '#f1f5f9',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtext: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
  },

  // ── SEARCH ──────────────────────────────────────────────
  searchWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1520',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
    gap: 10,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '400',
    padding: 0,
  },
  clearBtn: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  // ── COLLEGE LIST ────────────────────────────────────────
  collegeList: {
    width: '100%',
    gap: 10,
    marginBottom: 32,
  },
  collegeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  collegeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  collegeAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  collegeInfo: {
    flex: 1,
    gap: 3,
  },
  collegeName: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 19,
  },
  collegeLocation: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  cardArrow: {
    color: '#334155',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 26,
  },

  // ── EMPTY STATE ─────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: '#94a3b8', fontWeight: '700', fontSize: 15 },
  emptySubtext: { color: '#475569', fontSize: 13 },

  // ── FOOTER ──────────────────────────────────────────────
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f1520',
  },
  contactLinkText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});
