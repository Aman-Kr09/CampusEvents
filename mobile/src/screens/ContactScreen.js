import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Phone, MapPin, Clock, ChevronDown, ChevronUp, Send, MessageSquare } from 'lucide-react-native';
import api from '../services/api';

const FAQS = [
  {
    q: 'How do I get my college added to CampusEvents?',
    a: 'Submit an onboarding request from the Landing screen. Our verification team will review and approve your institution within 2-3 business days.'
  },
  {
    q: 'How much does it cost to onboard a college?',
    a: 'College onboarding is priced at ₹1,200 per month per institution covering hosting, moderation dashboards, and system support.'
  },
  {
    q: 'Who can I contact for technical issues or bugs?',
    a: 'You can submit a inquiry directly from this page or email support at u5813051@gmail.com.'
  },
  {
    q: 'Can students moderate content themselves?',
    a: 'Content moderation is handled by assigned College Admins. Students can flag content for review.'
  },
  {
    q: 'Is our college data kept private from other institutions?',
    a: 'Yes — every college operates in a fully isolated namespace. Events, discussions, and PYQs are strictly scoped.'
  }
];

export default function ContactScreen() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert('Validation Error', 'Please complete your name, email, and message.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/contact', form);
      if (res.data.success) {
        Alert.alert(
          'Message Sent ✅',
          res.data.message || 'Thank you! Your inquiry has been submitted. Our support team will get back to you within 24 hours.'
        );
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        Alert.alert('Error', res.data.message || 'Failed to send message.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send message. Please check your network connection.';
      Alert.alert('Submission Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support &amp; Inquiries</Text>
        <Text style={styles.headerSub}>Contact CampusEvents Support Desk</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Support Info Grid */}
        <View style={styles.infoGrid}>
          <TouchableOpacity style={styles.infoCard} onPress={() => Linking.openURL('mailto:u5813051@gmail.com')}>
            <Mail color="#818cf8" size={18} />
            <Text style={styles.infoCardTitle}>Email Support</Text>
            <Text style={styles.infoCardVal}>u5813051@gmail.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={() => Linking.openURL('tel:+917042017583')}>
            <Phone color="#34d399" size={18} />
            <Text style={styles.infoCardTitle}>Phone / WhatsApp</Text>
            <Text style={styles.infoCardVal}>+91 7042017583</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Send a Message</Text>
          <Text style={styles.sectionSub}>We respond within 24 hours</Text>

          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#64748b"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />

          <Text style={styles.label}>Your Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="john@college.edu.in"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Inquiry / Technical Bug"
            placeholderTextColor="#64748b"
            value={form.subject}
            onChangeText={(t) => setForm({ ...form, subject: t })}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your question or feedback..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            value={form.message}
            onChangeText={(t) => setForm({ ...form, message: t })}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Send Message</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ Accordions */}
        <Text style={styles.faqHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, i) => {
            const isExpanded = expandedFaq === i;
            return (
              <View key={i} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setExpandedFaq(isExpanded ? null : i)}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  {isExpanded ? <ChevronUp color="#818cf8" size={16} /> : <ChevronDown color="#64748b" size={16} />}
                </TouchableOpacity>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  scrollContent: { padding: 16, gap: 16 },
  infoGrid: { flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12 },
  infoCardTitle: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 6 },
  infoCardVal: { color: '#ffffff', fontSize: 12, fontWeight: '700', marginTop: 2 },
  formCard: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', padding: 16, borderRadius: 16 },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  sectionSub: { color: '#64748b', fontSize: 12, marginBottom: 14 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  input: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  faqHeading: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginTop: 8 },
  faqList: { gap: 10 },
  faqCard: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '700', paddingRight: 8 },
  faqAnswer: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
});
