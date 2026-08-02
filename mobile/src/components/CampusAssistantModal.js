import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Bot, Send, X, Sparkles, User } from 'lucide-react-native';
import api from '../services/api';

export default function CampusAssistantModal({ visible, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      sender: 'ai',
      text: 'Hello! I am your AI Campus Assistant. Ask me anything about upcoming events, exam schedules, or placement statistics!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const promptText = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for multi-turn context
      const history = messages
        .filter(m => m.role)
        .map(m => ({ role: m.role, content: m.text }))
        .slice(-10);

      const res = await api.post('/assistant/chat', { message: promptText, history });
      if (res.data.success) {
        const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', sender: 'ai', text: res.data.reply || res.data.answer || 'No response received.' };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errMsg = { id: (Date.now() + 1).toString(), sender: 'ai', text: res.data.message || 'Sorry, I ran into an error.' };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err) {
      const errMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I ran into a connection error. Please try again.'
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Bot color="#818cf8" size={18} />
              </View>
              <View>
                <Text style={styles.title}>Campus Assistant AI</Text>
                <Text style={styles.subtitle}>Powered by Groq LLM</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          {/* Messages Feed */}
          <ScrollView contentContainerStyle={styles.chatScroll}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.msgBubble,
                  m.sender === 'user' ? styles.userBubble : styles.aiBubble
                ]}
              >
                <Text style={[styles.msgText, m.sender === 'user' ? styles.userMsgText : styles.aiMsgText]}>
                  {m.text}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={[styles.msgBubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator color="#818cf8" size="small" />
                <Text style={styles.typingText}>AI is processing...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask AI anything..."
              placeholderTextColor="#64748b"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
              <Send color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#131924', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', borderWidth: 1, borderColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#818cf8', fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 4 },
  chatScroll: { padding: 16, gap: 10, flexGrow: 1 },
  msgBubble: { padding: 12, borderRadius: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: '#4f46e5', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: '#0b0f17', alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#1e293b' },
  msgText: { fontSize: 13, lineHeight: 18 },
  userMsgText: { color: '#ffffff' },
  aiMsgText: { color: '#cbd5e1' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { color: '#94a3b8', fontSize: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  input: { flex: 1, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  sendBtn: { backgroundColor: '#4f46e5', width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
