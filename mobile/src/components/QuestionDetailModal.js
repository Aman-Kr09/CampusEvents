import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Modal, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { X, ThumbsUp, MessageSquare, Send, User } from 'lucide-react-native';
import api from '../services/api';

export default function QuestionDetailModal({ visible, questionId, user, onClose, onRefreshQuestions }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchDetails = async () => {
    if (!questionId) return;
    try {
      setLoading(true);
      const res = await api.get(`/qa/questions/${questionId}`);
      if (res.data.success && res.data.data) {
        setQuestion(res.data.data.question);
        setAnswers(res.data.data.answers || []);
      }
    } catch (err) {
      console.error('Failed to fetch question details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && questionId) {
      fetchDetails();
    }
  }, [visible, questionId]);

  const handleUpvote = async () => {
    if (!questionId) return;
    try {
      const res = await api.post(`/qa/questions/${questionId}/upvote`);
      if (res.data.success) {
        fetchDetails();
        if (onRefreshQuestions) onRefreshQuestions();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upvote question.');
    }
  };

  const handlePostAnswer = async () => {
    if (!newAnswer.trim() || posting) return;

    setPosting(true);
    try {
      const res = await api.post(`/qa/questions/${questionId}/answers`, { content: newAnswer.trim() });
      if (res.data.success) {
        setNewAnswer('');
        fetchDetails();
        if (onRefreshQuestions) onRefreshQuestions();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post answer.');
    } finally {
      setPosting(false);
    }
  };

  if (!questionId) return null;

  const isUpvoted = question?.upvotes?.includes(user?._id);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Question Discussion</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#6366f1" size="large" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.bodyScroll}>
              {/* Question Box */}
              <View style={styles.questionBox}>
                <Text style={styles.qTitle}>{question?.title}</Text>
                <Text style={styles.qContent}>{question?.content}</Text>

                <View style={styles.authorRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(question?.user?.name || 'S')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{question?.user?.name || 'Student'}</Text>
                    <Text style={styles.authorSub}>{question?.user?.branch || 'General'} • {new Date(question?.createdAt || Date.now()).toLocaleDateString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.upvoteBtn, isUpvoted && styles.upvotedBtn]}
                    onPress={handleUpvote}
                  >
                    <ThumbsUp color={isUpvoted ? '#818cf8' : '#94a3b8'} size={14} />
                    <Text style={[styles.upvoteText, isUpvoted && styles.upvotedText]}>
                      {question?.upvotes?.length || 0} Upvotes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Answers Header */}
              <View style={styles.answersHeader}>
                <MessageSquare color="#818cf8" size={16} />
                <Text style={styles.answersTitle}>Student Answers &amp; Comments ({answers.length})</Text>
              </View>

              {/* Answers List */}
              {answers.length === 0 ? (
                <Text style={styles.emptyText}>No answers posted yet. Be the first student to reply!</Text>
              ) : (
                answers.map((ans) => (
                  <View key={ans._id} style={styles.answerCard}>
                    <View style={styles.ansAuthorRow}>
                      <User color="#818cf8" size={14} />
                      <Text style={styles.ansAuthorName}>{ans.user?.name || 'Peer Student'}</Text>
                      <Text style={styles.ansDate}>{new Date(ans.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.ansContent}>{ans.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* Answer Input Box */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write a clear answer or comment..."
              placeholderTextColor="#64748b"
              value={newAnswer}
              onChangeText={setNewAnswer}
              onSubmitEditing={handlePostAnswer}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handlePostAnswer} disabled={posting}>
              {posting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Send color="#ffffff" size={16} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#131924', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', borderWidth: 1, borderColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bodyScroll: { padding: 16, gap: 14 },
  questionBox: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', padding: 14, borderRadius: 12 },
  qTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  qContent: { color: '#cbd5e1', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  avatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#818cf8', fontSize: 14, fontWeight: '700' },
  authorName: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  authorSub: { color: '#64748b', fontSize: 10 },
  upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  upvotedBtn: { backgroundColor: '#1e1b4b', borderColor: '#3730a3' },
  upvoteText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  upvotedText: { color: '#818cf8' },
  answersHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  answersTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginVertical: 20 },
  answerCard: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 10, gap: 6 },
  ansAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ansAuthorName: { color: '#818cf8', fontSize: 11, fontWeight: '700', flex: 1 },
  ansDate: { color: '#64748b', fontSize: 10 },
  ansContent: { color: '#cbd5e1', fontSize: 12, lineHeight: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  input: { flex: 1, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  sendBtn: { backgroundColor: '#4f46e5', width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
