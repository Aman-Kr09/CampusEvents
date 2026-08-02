import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Image, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, HelpCircle, BarChart3, Megaphone, Search, Plus, MapPin, Check, Bot, Heart, Clock, Sparkles, ThumbsUp, MessageSquare, Award, Globe, ExternalLink, Users, Briefcase, Tag } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CampusAssistantModal from '../components/CampusAssistantModal';
import CreateEventModal from '../components/CreateEventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import AskQuestionModal from '../components/AskQuestionModal';
import QuestionDetailModal from '../components/QuestionDetailModal';

const CATEGORIES = ['All', 'Coding', 'Hackathons', 'AI/ML', 'Robotics', 'Workshop', 'Cultural Events', 'Sports', 'Research', 'Design', 'Fest', 'Gaming'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'qa' | 'placements' | 'announcements'
  const [placementSubTab, setPlacementSubTab] = useState('oncampus'); // 'oncampus' | 'offcampus'

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [recommended, setRecommended] = useState([]);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [offCampusJobs, setOffCampusJobs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resRec, resEv, resQ, resPl, resOff, resAnn] = await Promise.all([
        api.get('/events/recommended'),
        api.get('/events'),
        api.get('/qa/questions'),
        api.get('/placements'),
        api.get('/off-campus'),
        api.get('/announcements')
      ]);

      if (resRec.data.success) setRecommended(resRec.data.data || []);
      if (resEv.data.success) {
        const evList = resEv.data.data || [];
        setEvents(evList);

        // Sort upcoming timeline events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sorted = [...evList]
          .filter(e => new Date(e.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setTimeline(sorted);
      }
      if (resQ.data.success) setQuestions(resQ.data.data || []);
      if (resPl.data.success) setPlacements(resPl.data.data || []);
      if (resOff.data.success) setOffCampusJobs(resOff.data.data || []);
      if (resAnn.data.success) setAnnouncements(resAnn.data.data || []);
    } catch (err) {
      console.error('Failed to load mobile dashboard data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Registration failed:', err.message);
    }
  };

  const handleLikeEvent = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/like`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Like failed:', err.message);
    }
  };

  const handleUpvoteQuestion = async (questionId) => {
    try {
      const res = await api.post(`/qa/questions/${questionId}/upvote`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Question upvote failed:', err.message);
    }
  };

  const handleOpenUrl = (url) => {
    if (!url) return;
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    Linking.openURL(target).catch(() => {
      Alert.alert('Error', 'Unable to open application link.');
    });
  };

  const term = search.toLowerCase().trim();

  // Search Filtered Data for All Tabs
  const filteredEvents = events.filter((ev) => {
    const matchCat = selectedCategory === 'All' || ev.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch = !term || ev.name.toLowerCase().includes(term) || ev.venue.toLowerCase().includes(term) || ev.description?.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  const filteredQuestions = questions.filter((q) => {
    if (!term) return true;
    return q.title.toLowerCase().includes(term) || q.content.toLowerCase().includes(term) || q.user?.name?.toLowerCase().includes(term);
  });

  const filteredOnCampusRecruiters = placements
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .flatMap(pr =>
      (pr.companiesVisited?.filter(c => c.status === 'Approved') || [])
        .map(c => ({ ...c, _year: pr.year, _prId: pr._id }))
    )
    .filter((c) => {
      if (!term) return true;
      return c.name.toLowerCase().includes(term) || c.jobType?.toLowerCase().includes(term) || c.branchesEligible?.toLowerCase().includes(term);
    });

  const filteredOffCampusJobs = offCampusJobs.filter((job) => {
    if (!term) return true;
    return job.title.toLowerCase().includes(term) || job.company.toLowerCase().includes(term) || job.location?.toLowerCase().includes(term);
  });

  const filteredAnnouncements = announcements.filter((ann) => {
    if (!term) return true;
    return ann.title.toLowerCase().includes(term) || ann.content.toLowerCase().includes(term);
  });

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'qa', label: 'Q&A', icon: HelpCircle },
    { id: 'placements', label: 'Placements', icon: BarChart3 },
    { id: 'announcements', label: 'Bulletins', icon: Megaphone }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Dashboard Controls Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Campus Operations Hub</Text>
        <Text style={styles.headerSub}>{user?.college?.name || 'Your Campus'}</Text>
      </View>

      {/* 2. Main Navigation Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, isActive && styles.activeTabBtn]}
              onPress={() => setActiveTab(t.id)}
            >
              <Icon color={isActive ? '#818cf8' : '#64748b'} size={14} />
              <Text style={[styles.tabBtnText, isActive && styles.activeTabBtnText]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Action Controls Row BELOW Navbar */}
      <View style={styles.belowNavbarRow}>
        <View style={styles.searchBoxBelowNavbar}>
          <Search color="#64748b" size={14} />
          <TextInput
            style={styles.searchInputBelowNavbar}
            placeholder={
              activeTab === 'events' ? "Search events..." :
              activeTab === 'qa' ? "Search discussions..." :
              activeTab === 'placements' ? "Search recruiters..." : "Search bulletins..."
            }
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {activeTab === 'events' && (
          <TouchableOpacity style={styles.glassBtnPrimary} onPress={() => setShowCreateEvent(true)}>
            <Plus color="#ffffff" size={14} />
            <Text style={styles.glassBtnText}>Submit Event</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'qa' && (
          <TouchableOpacity style={styles.glassBtnPrimary} onPress={() => setShowAskQuestion(true)}>
            <Plus color="#ffffff" size={14} />
            <Text style={styles.glassBtnText}>Ask Question</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Scroll Area */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
        >
          {/* TAB 1: EVENTS HUB */}
          {activeTab === 'events' && (
            <View style={styles.section}>

              {/* 1. AI Recommended Events Carousel */}
              {recommended.length > 0 && (
                <View style={styles.recSection}>
                  <View style={styles.sectionTitleRow}>
                    <Sparkles color="#818cf8" size={16} />
                    <Text style={styles.sectionTitleText}>Recommended For You</Text>
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI Personalized</Text>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
                    {recommended.map((ev) => (
                      <TouchableOpacity
                        key={ev._id}
                        style={styles.recCard}
                        onPress={() => setSelectedEventDetails(ev)}
                      >
                        <View style={styles.recHeader}>
                          <Text style={styles.categoryBadge}>{ev.category}</Text>
                          <Text style={styles.dateText}>{new Date(ev.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.recTitle} numberOfLines={2}>{ev.name}</Text>
                        <Text style={styles.recVenue} numberOfLines={1}>📍 {ev.venue}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2. Category Filter Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, selectedCategory === cat && styles.activeCategoryChip]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, selectedCategory === cat && styles.activeCategoryChipText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 3. Event Cards Feed */}
              <Text style={styles.sectionHeading}>Campus Event Feed ({filteredEvents.length})</Text>

              {filteredEvents.length === 0 ? (
                <Text style={styles.emptyText}>No events match your search query.</Text>
              ) : (
                filteredEvents.map((ev) => {
                  const userIdStr = user?._id?.toString();
                  const isRegistered = ev.registrations?.some(id => (id?._id || id)?.toString() === userIdStr) || ev.registeredUsers?.includes(user?._id);
                  const isLiked = ev.likes?.some(id => (id?._id || id)?.toString() === userIdStr);

                  return (
                    <TouchableOpacity
                      key={ev._id}
                      style={styles.card}
                      onPress={() => setSelectedEventDetails(ev)}
                    >
                      {ev.banner ? (
                        <Image source={{ uri: ev.banner }} style={styles.cardBannerImg} />
                      ) : null}

                      <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.categoryBadge}>{ev.category}</Text>
                          <Text style={styles.dateText}>{new Date(ev.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{ev.name}</Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>{ev.description}</Text>

                        <View style={styles.cardMetaRow}>
                          <View style={styles.metaItem}>
                            <MapPin color="#64748b" size={12} />
                            <Text style={styles.metaText} numberOfLines={1}>{ev.venue}</Text>
                          </View>
                          {ev.time ? (
                            <View style={styles.metaItem}>
                              <Clock color="#64748b" size={12} />
                              <Text style={styles.metaText}>{ev.time}</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.cardFooter}>
                          <TouchableOpacity
                            style={[styles.likeIconBtn, isLiked && styles.likedIconBtn]}
                            onPress={() => handleLikeEvent(ev._id)}
                          >
                            <Heart color={isLiked ? '#f43f5e' : '#94a3b8'} size={16} fill={isLiked ? '#f43f5e' : 'transparent'} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, isRegistered && styles.actionBtnActive]}
                            onPress={() => handleRegisterEvent(ev._id)}
                          >
                            {isRegistered ? <Check color="#34d399" size={14} /> : null}
                            <Text style={[styles.actionBtnText, isRegistered && styles.actionBtnTextActive]}>
                              {isRegistered ? 'Registered' : 'Register / Join'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* 4. Timeline of Upcoming Events */}
              {timeline.length > 0 && (
                <View style={styles.timelineSection}>
                  <Text style={styles.sectionHeading}>Upcoming Events Timeline</Text>
                  {timeline.map((tEv) => (
                    <TouchableOpacity
                      key={tEv._id}
                      style={styles.timelineCard}
                      onPress={() => setSelectedEventDetails(tEv)}
                    >
                      <View style={styles.timelineBullet} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timelineTitle}>{tEv.name}</Text>
                        <Text style={styles.timelineSub}>{new Date(tEv.date).toLocaleDateString()} • {tEv.venue}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            </View>
          )}

          {/* TAB 2: STUDENT Q&A BOARD */}
          {activeTab === 'qa' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeading}>Student Q&amp;A Board ({filteredQuestions.length})</Text>
                  <Text style={styles.sectionSubHeading}>Engage with peer students and get support on academics.</Text>
                </View>
              </View>

              {filteredQuestions.length === 0 ? (
                <Text style={styles.emptyText}>No Q&amp;A discussions match your search query.</Text>
              ) : (
                filteredQuestions.map((q) => {
                  const isUpvoted = q.upvotes?.includes(user?._id);
                  return (
                    <TouchableOpacity
                      key={q._id}
                      style={styles.qaCard}
                      onPress={() => setSelectedQuestionId(q._id)}
                    >
                      <Text style={styles.qaTitle}>{q.title}</Text>
                      <Text style={styles.qaContent} numberOfLines={3}>{q.content}</Text>

                      <View style={styles.qaMetaRow}>
                        <Text style={styles.qaAuthor}>Asked by {q.user?.name || 'Student'} • {new Date(q.createdAt).toLocaleDateString()}</Text>
                      </View>

                      {/* Card Action Buttons */}
                      <View style={styles.qaActionRow}>
                        <TouchableOpacity
                          style={[styles.qaActionBtn, isUpvoted && styles.qaActionBtnActive]}
                          onPress={() => handleUpvoteQuestion(q._id)}
                        >
                          <ThumbsUp color={isUpvoted ? '#818cf8' : '#94a3b8'} size={14} />
                          <Text style={[styles.qaActionText, isUpvoted && styles.qaActionTextActive]}>
                            {q.upvotes?.length || 0} Upvotes
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.qaActionBtn}
                          onPress={() => setSelectedQuestionId(q._id)}
                        >
                          <MessageSquare color="#38bdf8" size={14} />
                          <Text style={styles.qaActionText}>
                            {q.answersCount || 0} Answers / Comments
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: PLACEMENTS & OFF-CAMPUS JOBS */}
          {activeTab === 'placements' && (
            <View style={styles.section}>
              {/* Placement Sub-Tab Selector */}
              <View style={styles.placementSubTabContainer}>
                <TouchableOpacity
                  style={[styles.placementSubTabBtn, placementSubTab === 'oncampus' && styles.activePlacementSubTabBtn]}
                  onPress={() => setPlacementSubTab('oncampus')}
                >
                  <Award color={placementSubTab === 'oncampus' ? '#818cf8' : '#64748b'} size={14} />
                  <Text style={[styles.placementSubTabText, placementSubTab === 'oncampus' && styles.activePlacementSubTabText]}>On-Campus ({filteredOnCampusRecruiters.length})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.placementSubTabBtn, placementSubTab === 'offcampus' && styles.activePlacementSubTabBtn]}
                  onPress={() => setPlacementSubTab('offcampus')}
                >
                  <Globe color={placementSubTab === 'offcampus' ? '#34d399' : '#64748b'} size={14} />
                  <Text style={[styles.placementSubTabText, placementSubTab === 'offcampus' && styles.activePlacementSubTabText]}>Off-Campus ({filteredOffCampusJobs.length})</Text>
                </TouchableOpacity>
              </View>

              {/* SUB-PANEL 1: ON-CAMPUS */}
              {placementSubTab === 'oncampus' && (
                <View style={styles.subPanel}>
                  {/* T&P Head Card */}
                  <View style={styles.tpCard}>
                    <Users color="#818cf8" size={18} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tpSub}>Training &amp; Placement Head</Text>
                      <Text style={styles.tpName}>Harsh Sudhakar</Text>
                    </View>
                    <View style={styles.tpBadge}>
                      <Text style={styles.tpBadgeText}>T&amp;P Contact Point</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionHeading}>On-Campus Recruiters &amp; Drives</Text>

                  {filteredOnCampusRecruiters.length === 0 ? (
                    <Text style={styles.emptyText}>No on-campus recruiters match your search query.</Text>
                  ) : (
                    filteredOnCampusRecruiters.map((c) => (
                      <View key={`${c._prId}-${c._id || c.name}`} style={styles.card}>
                        <View style={styles.cardBody}>
                          <View style={styles.cardHeader}>
                            <View style={styles.ayBadge}>
                              <Text style={styles.ayBadgeText}>AY {c._year}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <View style={[styles.typeBadge, c.type === 'Blocking' && styles.typeBadgeBlocking]}>
                                <Text style={[styles.typeBadgeText, c.type === 'Blocking' && styles.typeBadgeTextBlocking]}>{c.type || 'Non-Blocking'}</Text>
                              </View>
                              <View style={styles.fteBadge}>
                                <Text style={styles.fteBadgeText}>{c.jobType || 'FTE'}</Text>
                              </View>
                            </View>
                          </View>

                          <Text style={styles.cardTitle}>{c.name}</Text>

                          <View style={styles.recruiterGrid}>
                            <View>
                              <Text style={styles.gridLabel}>CGPA Cutoff</Text>
                              <Text style={styles.gridVal}>{c.cpaRequired != null ? c.cpaRequired : '—'}</Text>
                            </View>
                            <View>
                              <Text style={styles.gridLabel}>Package</Text>
                              <Text style={[styles.gridVal, { color: '#34d399' }]}>{c.package != null ? c.package : '—'}</Text>
                            </View>
                          </View>

                          {c.branchesEligible ? (
                            <Text style={styles.eligibleText}>Branches: {c.branchesEligible}</Text>
                          ) : null}

                          {c.googleFormLink ? (
                            <TouchableOpacity
                              style={styles.applyLinkBtn}
                              onPress={() => handleOpenUrl(c.googleFormLink)}
                            >
                              <ExternalLink color="#818cf8" size={14} />
                              <Text style={styles.applyLinkBtnText}>Apply via Form</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* SUB-PANEL 2: OFF-CAMPUS */}
              {placementSubTab === 'offcampus' && (
                <View style={styles.subPanel}>
                  <View style={styles.liveHeaderRow}>
                    <Text style={styles.sectionHeading}>Off-Campus Job Opportunities</Text>
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>🟢 Live Feed</Text>
                    </View>
                  </View>

                  {filteredOffCampusJobs.length === 0 ? (
                    <Text style={styles.emptyText}>No off-campus job postings match your search query.</Text>
                  ) : (
                    filteredOffCampusJobs.map((job) => (
                      <View key={job._id} style={styles.card}>
                        <View style={styles.cardBody}>
                          <View style={styles.cardHeader}>
                            <View style={styles.empBadge}>
                              <Text style={styles.empBadgeText}>{job.employmentType || 'Full-Time'}</Text>
                            </View>
                            <Text style={styles.companyText}>{job.company}</Text>
                          </View>

                          <Text style={styles.cardTitle}>{job.title}</Text>

                          {job.description ? (
                            <Text style={styles.cardDesc} numberOfLines={2}>{job.description}</Text>
                          ) : null}

                          <View style={styles.jobMetaRow}>
                            {job.location ? (
                              <View style={styles.metaItem}>
                                <MapPin color="#64748b" size={12} />
                                <Text style={styles.metaText}>{job.location}</Text>
                              </View>
                            ) : null}

                            {job.salary ? (
                              <View style={styles.metaItem}>
                                <Text style={[styles.metaText, { color: '#34d399', fontWeight: '700' }]}>{job.salary}</Text>
                              </View>
                            ) : null}
                          </View>

                          {job.skills && job.skills.length > 0 ? (
                            <View style={styles.tagContainer}>
                              {job.skills.slice(0, 4).map((sk, idx) => (
                                <View key={idx} style={styles.skillTag}>
                                  <Text style={styles.skillTagText}>{sk}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}

                          {job.applyUrl ? (
                            <TouchableOpacity
                              style={styles.applyLinkBtnOffCampus}
                              onPress={() => handleOpenUrl(job.applyUrl)}
                            >
                              <ExternalLink color="#ffffff" size={14} />
                              <Text style={styles.applyLinkBtnTextOffCampus}>Apply Now</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <View style={styles.section}>
              {filteredAnnouncements.length === 0 ? (
                <Text style={styles.emptyText}>No bulletins match your search query.</Text>
              ) : (
                filteredAnnouncements.map((ann) => (
                  <View key={ann._id} style={styles.card}>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{ann.title}</Text>
                      <Text style={styles.cardDesc}>{ann.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating AI Assistant FAB */}
      <TouchableOpacity style={styles.fabAi} onPress={() => setShowAiModal(true)}>
        <Bot color="#ffffff" size={20} />
      </TouchableOpacity>

      {/* Modals */}
      <CampusAssistantModal visible={showAiModal} onClose={() => setShowAiModal(false)} />

      <CreateEventModal
        visible={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <EventDetailsModal
        visible={!!selectedEventDetails}
        event={selectedEventDetails}
        user={user}
        onClose={() => setSelectedEventDetails(null)}
        onRegister={handleRegisterEvent}
        onLike={handleLikeEvent}
      />

      <AskQuestionModal
        visible={showAskQuestion}
        onClose={() => setShowAskQuestion(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <QuestionDetailModal
        visible={!!selectedQuestionId}
        questionId={selectedQuestionId}
        user={user}
        onClose={() => setSelectedQuestionId(null)}
        onRefreshQuestions={() => fetchDashboardData()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  topHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 6 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#131924' },
  activeTabBtn: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3' },
  tabBtnText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activeTabBtnText: { color: '#818cf8' },
  belowNavbarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  searchBoxBelowNavbar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchInputBelowNavbar: { flex: 1, color: '#ffffff', fontSize: 12 },
  glassBtnPrimary: { backgroundColor: '#4f46e5', borderWidth: 1, borderColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  glassBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentScroll: { padding: 16 },
  section: { gap: 14 },
  recSection: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitleText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  aiBadge: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  aiBadgeText: { color: '#818cf8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  carouselScroll: { flexDirection: 'row' },
  recCard: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12, width: 220, marginRight: 10 },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  recVenue: { color: '#64748b', fontSize: 11 },
  categoryBar: { flexDirection: 'row', marginBottom: 10, flexGrow: 0 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', marginRight: 6 },
  activeCategoryChip: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  categoryChipText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activeCategoryChipText: { color: '#ffffff' },
  sectionHeading: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sectionSubHeading: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  sectionHeaderBar: { marginBottom: 4 },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  cardBannerImg: { width: '100%', height: 120, resizeMode: 'cover' },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryBadge: { color: '#818cf8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dateText: { color: '#64748b', fontSize: 10 },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginBottom: 10 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#64748b', fontSize: 11 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeIconBtn: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  likedIconBtn: { borderColor: '#f43f5e' },
  actionBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  actionBtnActive: { backgroundColor: '#064e3b' },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  actionBtnTextActive: { color: '#34d399' },
  placementSubTabContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  placementSubTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b' },
  activePlacementSubTabBtn: { backgroundColor: '#1e1b4b', borderColor: '#3730a3' },
  placementSubTabText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  activePlacementSubTabText: { color: '#ffffff', fontWeight: '700' },
  subPanel: { gap: 10 },
  tpCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12 },
  tpSub: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  tpName: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  tpBadge: { backgroundColor: '#1e1b4b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tpBadgeText: { color: '#818cf8', fontSize: 10, fontWeight: '600' },
  ayBadge: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  ayBadgeText: { color: '#818cf8', fontSize: 10, fontWeight: '700' },
  typeBadge: { backgroundColor: '#083344', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeBadgeBlocking: { backgroundColor: '#450a0a' },
  typeBadgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '700' },
  typeBadgeTextBlocking: { color: '#fca5a5' },
  fteBadge: { backgroundColor: '#2e1065', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  fteBadgeText: { color: '#c084fc', fontSize: 10, fontWeight: '700' },
  recruiterGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0b0f17', padding: 10, borderRadius: 8, marginVertical: 8 },
  gridLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  gridVal: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  eligibleText: { color: '#cbd5e1', fontSize: 11, marginBottom: 8 },
  applyLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  applyLinkBtnText: { color: '#818cf8', fontSize: 12, fontWeight: '700' },
  liveHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveBadge: { backgroundColor: '#064e3b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  liveBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  empBadge: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  empBadgeText: { color: '#93c5fd', fontSize: 10, fontWeight: '700' },
  companyText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  jobMetaRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillTag: { backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  skillTagText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  applyLinkBtnOffCampus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#059669', paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  applyLinkBtnTextOffCampus: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  timelineSection: { gap: 8, marginTop: 12 },
  timelineCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 10 },
  timelineBullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },
  timelineTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  timelineSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  qaCard: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  qaTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  qaContent: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginBottom: 10 },
  qaMetaRow: { marginBottom: 12 },
  qaAuthor: { color: '#64748b', fontSize: 11 },
  qaActionRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  qaActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  qaActionBtnActive: { backgroundColor: '#1e1b4b', borderColor: '#3730a3' },
  qaActionText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  qaActionTextActive: { color: '#818cf8' },
  fabAi: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#4f46e5', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
