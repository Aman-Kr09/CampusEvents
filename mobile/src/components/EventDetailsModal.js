import React from 'react';
import {
  StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity,
  Image, Linking, Alert
} from 'react-native';
import { X, Calendar, MapPin, Clock, Heart, Check, ArrowRight, ExternalLink, Eye } from 'lucide-react-native';

export default function EventDetailsModal({ visible, event, user, onClose, onRegister, onLike }) {
  if (!event) return null;

  const userIdStr = user?._id?.toString();
  const isRegistered = event.registrations?.some(id => (id?._id || id)?.toString() === userIdStr) || event.registeredUsers?.includes(user?._id);
  const isLiked = event.likes?.some(id => (id?._id || id)?.toString() === userIdStr);

  const regUrl = event.registrationLink || event.link || event.url || '';

  const handleOpenLink = () => {
    if (!regUrl) return;
    let target = regUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    Linking.openURL(target).catch(() => {
      Alert.alert('Error', 'Unable to open registration link.');
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Event Banner */}
          <View style={styles.bannerContainer}>
            {event.banner ? (
              <Image source={{ uri: event.banner }} style={styles.bannerImg} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Calendar color="#818cf8" size={40} />
              </View>
            )}

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category || 'General'}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>

          {/* Event Details Body */}
          <ScrollView style={styles.bodyScroll} contentContainerStyle={{ gap: 14 }}>
            <Text style={styles.title}>{event.name}</Text>

            {/* Meta Row: Time, Venue, Date */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar color="#818cf8" size={13} />
                <Text style={styles.metaText}>{new Date(event.date).toLocaleDateString()}</Text>
              </View>

              {event.time ? (
                <View style={styles.metaItem}>
                  <Clock color="#818cf8" size={13} />
                  <Text style={styles.metaText}>{event.time}</Text>
                </View>
              ) : null}

              <View style={styles.metaItem}>
                <MapPin color="#818cf8" size={13} />
                <Text style={styles.metaText}>{event.venue}</Text>
              </View>
            </View>

            {/* About Event */}
            <View style={styles.aboutBox}>
              <Text style={styles.sectionHeader}>ABOUT THE EVENT</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>

            {/* Registration / Form Link */}
            {regUrl ? (
              <View style={styles.linkSection}>
                <Text style={styles.sectionHeader}>REGISTRATION / FORM LINK</Text>
                <TouchableOpacity style={styles.linkCard} onPress={handleOpenLink}>
                  <Text style={styles.linkCardUrl} numberOfLines={1}>{regUrl}</Text>
                  <ArrowRight color="#818cf8" size={16} />
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <View style={styles.footerMeta}>
              <Eye color="#64748b" size={12} />
              <Text style={styles.footerMetaText}>Views: {event.views || 1}</Text>
              <Text style={styles.dot}>•</Text>
              <Heart color="#64748b" size={12} />
              <Text style={styles.footerMetaText}>Likes: {event.likes?.length || 0}</Text>
            </View>

            <View style={styles.footerActionBtns}>
              <TouchableOpacity
                style={[styles.likeBtn, isLiked && styles.likedBtn]}
                onPress={() => onLike(event._id)}
              >
                <Heart color={isLiked ? '#f43f5e' : '#94a3b8'} size={18} fill={isLiked ? '#f43f5e' : 'transparent'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rsvpBtn, isRegistered && styles.registeredBtn]}
                onPress={() => onRegister(event._id)}
              >
                {isRegistered ? <Check color="#34d399" size={16} /> : null}
                <Text style={[styles.rsvpBtnText, isRegistered && styles.registeredBtnText]}>
                  {isRegistered ? 'Registered' : 'Register / Join'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  content: { backgroundColor: '#131924', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', maxHeight: '90%', overflow: 'hidden' },
  bannerContainer: { height: 160, backgroundColor: '#0b0f17', position: 'relative' },
  bannerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1b4b' },
  closeBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(11, 15, 23, 0.9)', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  categoryText: { color: '#818cf8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  bodyScroll: { padding: 16 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800', leadingHeight: 24 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  aboutBox: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', padding: 14, borderRadius: 12 },
  sectionHeader: { color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  description: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  linkSection: { gap: 6 },
  linkCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  linkCardUrl: { color: '#818cf8', fontSize: 13, fontWeight: '700', flex: 1, paddingRight: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12 },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerMetaText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  dot: { color: '#64748b', fontSize: 11 },
  footerActionBtns: { flexDirection: 'row', gap: 10 },
  likeBtn: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  likedBtn: { borderColor: '#f43f5e' },
  rsvpBtn: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12 },
  registeredBtn: { backgroundColor: '#064e3b', borderWidth: 1, borderColor: '#10b981' },
  rsvpBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  registeredBtnText: { color: '#34d399' },
});
