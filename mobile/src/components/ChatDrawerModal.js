import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { X, Send, User, ShoppingBag, Car } from 'lucide-react-native';
import api from '../services/api';
import useSocket from '../hooks/useSocket';

export default function ChatDrawerModal({ visible, targetType, item, user, token, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const itemId = item?._id;

  // Real-time socket connection
  useSocket(token, {
    new_connect_message: (msg) => {
      if (msg.targetType === targetType && msg.targetId?.toString() === itemId?.toString()) {
        setMessages((prev) => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    }
  });

  const fetchMessages = async () => {
    if (!targetType || !itemId) return;
    try {
      setLoading(true);
      const res = await api.get(`/campus-connect/chat/${targetType}/${itemId}`);
      if (res.data.success) {
        setMessages(res.data.data || res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && itemId) {
      fetchMessages();
    }
  }, [visible, itemId, targetType]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    const textContent = inputText.trim();
    setInputText('');

    try {
      const res = await api.post(`/campus-connect/chat/${targetType}/${itemId}`, {
        text: textContent,
        content: textContent
      });
      if (res.data.success && res.data.data) {
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error('Failed to send message:', err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  if (!item) return null;

  const isRide = targetType === 'RideShare';
  const ownerName = isRide ? item.host?.name || item.creator?.name : item.seller?.name;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              {isRide ? <Car color="#34d399" size={18} /> : <ShoppingBag color="#38bdf8" size={18} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {isRide ? `${item.origin} ➔ ${item.destination}` : item.title}
                </Text>
                <Text style={styles.headerSub}>Chatting with {ownerName || 'Host/Seller'}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          </View>

          {/* Messages Feed */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#6366f1" size="large" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.chatScroll}>
              {messages.length === 0 ? (
                <Text style={styles.emptyText}>No messages yet. Send a greeting to start chatting!</Text>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender?._id?.toString() === user?._id?.toString() || m.sender === user?._id;
                  const body = m.text || m.content || '';
                  return (
                    <View
                      key={m._id || m.id || Math.random()}
                      style={[styles.msgBubble, isMine ? styles.myBubble : styles.otherBubble]}
                    >
                      <Text style={styles.senderName}>{isMine ? 'You' : m.sender?.name || 'Student'}</Text>
                      <Text style={[styles.msgText, isMine ? styles.myMsgText : styles.otherMsgText]}>
                        {body}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Input Container */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending}>
              {sending ? (
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
  content: { backgroundColor: '#131924', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', borderWidth: 1, borderColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 },
  headerTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  headerSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatScroll: { padding: 16, gap: 10, flexGrow: 1 },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 40 },
  msgBubble: { padding: 10, borderRadius: 12, maxWidth: '80%' },
  myBubble: { backgroundColor: '#4f46e5', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#0b0f17', alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#1e293b' },
  senderName: { color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 17 },
  myMsgText: { color: '#ffffff' },
  otherMsgText: { color: '#cbd5e1' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  input: { flex: 1, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  sendBtn: { backgroundColor: '#4f46e5', width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
