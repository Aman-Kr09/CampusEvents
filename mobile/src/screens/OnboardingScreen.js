import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const INTERESTS = [
  'Coding', 'AI/ML', 'Data Science', 'Robotics', 'Sports', 'Design',
  'Startups', 'Research', 'Placements', 'Hackathons', 'Music',
  'Photography', 'Cultural Events', 'Entrepreneurship', 'Gaming'
];

export default function OnboardingScreen({ navigation }) {
  const { updateProfile } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (item) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    await updateProfile({ interests: selectedInterests });
    setSaving(false);
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Calibrate AI Recommendations</Text>
        <Text style={styles.subtitle}>Select topics you are interested in to receive tailored campus updates.</Text>

        <View style={styles.grid}>
          {INTERESTS.map((item) => {
            const isSelected = selectedInterests.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.badge, isSelected && styles.selectedBadge]}
                onPress={() => toggleInterest(item)}
              >
                <Text style={[styles.badgeText, isSelected && styles.selectedBadgeText]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleFinish} disabled={saving}>
          <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Complete Calibration'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  scrollContent: { padding: 20 },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  badge: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  selectedBadge: { backgroundColor: '#1e1b4b', borderColor: '#6366f1' },
  badgeText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  selectedBadgeText: { color: '#818cf8' },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
