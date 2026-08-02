import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingBag, Car, Search, Plus, Bookmark, BookmarkCheck,
  MessageSquare, Trash2, CheckCircle2, Clock, MapPin, Tag, User,
  Calendar, Check, ArrowRight
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostMarketplaceModal from '../components/PostMarketplaceModal';
import PostRideModal from '../components/PostRideModal';
import ChatDrawerModal from '../components/ChatDrawerModal';

const MARKETPLACE_CATEGORIES = ['All', 'Books', 'Calculators', 'Lab Coats', 'Cycles', 'Hostel Essentials', 'Electronics', 'Clothing', 'Other'];
const RIDE_TRIP_TYPES = ['All', 'Airport', 'Railway Station', 'Metro Station', 'Home', 'Internship', 'Hackathon', 'Other'];

export default function CampusConnectScreen({ navigation }) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'rides'

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Marketplace State
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [giveawayOnly, setGiveawayOnly] = useState(false);
  const [showPostMarketModal, setShowPostMarketModal] = useState(false);

  // Ride Share State
  const [rideShares, setRideShares] = useState([]);
  const [selectedTripType, setSelectedTripType] = useState('All');
  const [showPostRideModal, setShowPostRideModal] = useState(false);

  const [search, setSearch] = useState('');

  // Chat State
  const [chatTarget, setChatTarget] = useState(null); // { targetType, item }

  const fetchConnectData = async () => {
    try {
      setLoading(true);
      const [resMkt, resRides] = await Promise.all([
        api.get('/campus-connect/marketplace'),
        api.get('/campus-connect/rides')
      ]);

      if (resMkt.data.success) {
        setMarketplaceItems(resMkt.data.items || resMkt.data.data || []);
      }
      if (resRides.data.success) {
        setRideShares(resRides.data.rides || resRides.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load connect data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConnectData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConnectData();
  };

  const handleToggleSaveItem = async (itemId) => {
    try {
      const res = await api.post(`/campus-connect/marketplace/${itemId}/save`);
      if (res.data.success) {
        fetchConnectData();
      }
    } catch (err) {
      console.error('Failed to save item:', err.message);
    }
  };

  const handleToggleRide = async (rideId, isPassenger) => {
    try {
      const endpoint = isPassenger
        ? `/campus-connect/rides/${rideId}/leave`
        : `/campus-connect/rides/${rideId}/join`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        Alert.alert(
          isPassenger ? 'Left Ride' : 'Joined Ride',
          isPassenger ? 'You have left this ride share offer.' : 'You have joined this ride share offer!'
        );
        fetchConnectData();
      }
    } catch (err) {
      Alert.alert('Notice', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDeleteMarketplaceItem = (itemId) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this marketplace item listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/campus-connect/marketplace/${itemId}`);
              if (res.data.success) {
                Alert.alert('Deleted', 'Marketplace listing deleted successfully.');
                fetchConnectData();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete listing.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteRideShare = (rideId) => {
    Alert.alert(
      'Delete Ride Offer',
      'Are you sure you want to delete this ride share offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/campus-connect/rides/${rideId}`);
              if (res.data.success) {
                Alert.alert('Deleted', 'Ride offer deleted successfully.');
                fetchConnectData();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete ride offer.');
            }
          }
        }
      ]
    );
  };

  const term = search.toLowerCase().trim();
  const userIdStr = user?._id?.toString();
  const isAdminUser = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  // Filtered Marketplace Items
  const filteredMarketplace = marketplaceItems.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchGiveaway = !giveawayOnly || item.isGiveaway || item.price === 0;
    const matchSearch = !term || item.title?.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term);
    return matchCat && matchGiveaway && matchSearch;
  });

  // Filtered Ride Shares
  const filteredRides = rideShares.filter((ride) => {
    const matchTrip = selectedTripType === 'All' || ride.tripType?.toLowerCase() === selectedTripType.toLowerCase();
    const matchSearch = !term || ride.origin?.toLowerCase().includes(term) || ride.destination?.toLowerCase().includes(term);
    return matchTrip && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Campus Connect</Text>
        <Text style={styles.headerSub}>Peer-to-peer student marketplace &amp; travel sharing</Text>
      </View>

      {/* Main Tabs (Marketplace vs Ride Sharing) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'marketplace' && styles.activeTabBtn]}
          onPress={() => setActiveTab('marketplace')}
        >
          <ShoppingBag color={activeTab === 'marketplace' ? '#818cf8' : '#64748b'} size={14} />
          <Text style={[styles.tabBtnText, activeTab === 'marketplace' && styles.activeTabBtnText]}>Marketplace</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'rides' && styles.activeTabBtn]}
          onPress={() => setActiveTab('rides')}
        >
          <Car color={activeTab === 'rides' ? '#34d399' : '#64748b'} size={14} />
          <Text style={[styles.tabBtnText, activeTab === 'rides' && styles.activeTabBtnText]}>Ride Sharing</Text>
        </TouchableOpacity>
      </View>

      {/* Controls Bar BELOW Navbar */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Search color="#64748b" size={14} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'marketplace' ? "Search books, cycles..." : "Search origin, destination..."}
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {activeTab === 'marketplace' && (
          <TouchableOpacity
            style={[styles.filterChip, giveawayOnly && styles.activeFilterChip]}
            onPress={() => setGiveawayOnly(!giveawayOnly)}
          >
            <Text style={[styles.filterChipText, giveawayOnly && styles.activeFilterChipText]}>🎁 Free</Text>
          </TouchableOpacity>
        )}

        {/* Dynamic Web-App Action Button Below Navbar */}
        {activeTab === 'marketplace' ? (
          <TouchableOpacity
            style={styles.postBtnMarketplace}
            onPress={() => setShowPostMarketModal(true)}
          >
            <Plus color="#ffffff" size={14} />
            <Text style={styles.postBtnText}>Post Listing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.postBtnRide}
            onPress={() => setShowPostRideModal(true)}
          >
            <Car color="#ffffff" size={14} />
            <Text style={styles.postBtnText}>Offer / Post Ride</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
        >
          {/* ─── MARKETPLACE TAB ───────────────────────────────────────────── */}
          {activeTab === 'marketplace' && (
            <View style={styles.section}>
              {/* Category Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, selectedCategory === cat && styles.activeCategoryChip]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, selectedCategory === cat && styles.activeCategoryChipText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredMarketplace.length === 0 ? (
                <Text style={styles.emptyText}>No marketplace listings found.</Text>
              ) : (
                filteredMarketplace.map((item) => {
                  const isSaved = item.savedBy?.some(id => (id?._id || id)?.toString() === userIdStr);
                  const isSeller = (item.seller?._id || item.seller)?.toString() === userIdStr;
                  const canDelete = isSeller || isAdminUser;

                  return (
                    <View key={item._id} style={styles.card}>
                      <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                          <View style={styles.badgeRow}>
                            <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
                            <Text style={styles.conditionBadge}>{item.condition || 'Used'}</Text>
                            {isSeller && (
                              <View style={styles.ownerBadge}>
                                <Text style={styles.ownerBadgeText}>Your Item</Text>
                              </View>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            {canDelete && (
                              <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => handleDeleteMarketplaceItem(item._id)}
                              >
                                <Trash2 color="#ef4444" size={16} />
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.saveBtn}
                              onPress={() => handleToggleSaveItem(item._id)}
                            >
                              {isSaved ? <BookmarkCheck color="#818cf8" size={16} /> : <Bookmark color="#64748b" size={16} />}
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                        <View style={styles.cardFooter}>
                          <Text style={styles.priceText}>
                            {item.isGiveaway || item.price === 0 ? '🎁 FREE GIVEAWAY' : `₹${item.price}`}
                          </Text>

                          <TouchableOpacity
                            style={styles.chatBtn}
                            onPress={() => setChatTarget({ targetType: 'MarketplaceItem', item })}
                          >
                            <MessageSquare color="#ffffff" size={14} />
                            <Text style={styles.chatBtnText}>{isSeller ? 'Open Chat' : 'Chat Seller'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ─── RIDE SHARING TAB ───────────────────────────────────────────── */}
          {activeTab === 'rides' && (
            <View style={styles.section}>
              {/* Trip Type Filter Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
                {RIDE_TRIP_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.categoryChip, selectedTripType === type && styles.activeCategoryChipRide]}
                    onPress={() => setSelectedTripType(type)}
                  >
                    <Text style={[styles.categoryChipText, selectedTripType === type && styles.activeCategoryChipText]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredRides.length === 0 ? (
                <Text style={styles.emptyText}>No ride sharing offers found.</Text>
              ) : (
                filteredRides.map((ride) => {
                  const creatorIdStr = (ride.creator?._id || ride.creator)?.toString();
                  const isHost = creatorIdStr === userIdStr;
                  const canDelete = isHost || isAdminUser;

                  const isPassenger = ride.passengers?.some(p => (p?.user?._id || p?.user || p)?.toString() === userIdStr);
                  const seatsLeft = ride.availableSeats != null ? ride.availableSeats : ((ride.totalSeats || 3) - (ride.passengers?.length || 0));

                  return (
                    <View key={ride._id} style={styles.card}>
                      <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                          <View style={styles.badgeRow}>
                            <Text style={styles.rideBadge}>{ride.tripType || 'Travel'}</Text>
                            <Text style={styles.seatsBadge}>{seatsLeft > 0 ? `${seatsLeft} Seats Left` : 'FULL'}</Text>
                            {isHost && (
                              <View style={styles.ownerBadge}>
                                <Text style={styles.ownerBadgeText}>Host</Text>
                              </View>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            {canDelete && (
                              <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => handleDeleteRideShare(ride._id)}
                              >
                                <Trash2 color="#ef4444" size={16} />
                              </TouchableOpacity>
                            )}
                            <Text style={styles.dateText}>
                              {ride.departureTime ? new Date(ride.departureTime).toLocaleDateString() : 'Today'}
                            </Text>
                          </View>
                        </View>

                        {/* Origin -> Destination */}
                        <View style={styles.routeRow}>
                          <Text style={styles.routeText}>{ride.origin}</Text>
                          <ArrowRight color="#34d399" size={14} />
                          <Text style={styles.routeText}>{ride.destination}</Text>
                        </View>

                        {ride.notes ? (
                          <Text style={styles.cardDesc} numberOfLines={2}>{ride.notes}</Text>
                        ) : null}

                        <View style={styles.cardFooter}>
                          <Text style={styles.priceText}>₹{ride.costPerSeat || ride.estimatedCost || 0} / seat</Text>

                          <View style={styles.actionGroup}>
                            <TouchableOpacity
                              style={styles.chatBtn}
                              onPress={() => setChatTarget({ targetType: 'RideShare', item: ride })}
                            >
                              <MessageSquare color="#ffffff" size={14} />
                            </TouchableOpacity>

                            {!isHost && (
                              <TouchableOpacity
                                style={[styles.joinBtn, isPassenger && styles.joinedBtn, seatsLeft <= 0 && !isPassenger && styles.fullBtn]}
                                onPress={() => handleToggleRide(ride._id, isPassenger)}
                                disabled={seatsLeft <= 0 && !isPassenger}
                              >
                                {isPassenger ? <Check color="#34d399" size={12} /> : null}
                                <Text style={[styles.joinBtnText, isPassenger && styles.joinedBtnText]}>
                                  {isPassenger ? 'Joined' : seatsLeft <= 0 ? 'Full' : 'Join Ride'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <PostMarketplaceModal
        visible={showPostMarketModal}
        onClose={() => setShowPostMarketModal(false)}
        onSuccess={() => fetchConnectData()}
      />

      <PostRideModal
        visible={showPostRideModal}
        onClose={() => setShowPostRideModal(false)}
        onSuccess={() => fetchConnectData()}
      />

      <ChatDrawerModal
        visible={!!chatTarget}
        targetType={chatTarget?.targetType}
        item={chatTarget?.item}
        user={user}
        token={token}
        onClose={() => setChatTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  topHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 6 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: '#131924' },
  activeTabBtn: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3' },
  tabBtnText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  activeTabBtnText: { color: '#ffffff', fontWeight: '700' },
  controlsBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b' },
  activeFilterChip: { backgroundColor: '#064e3b', borderColor: '#10b981' },
  filterChipText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activeFilterChipText: { color: '#34d399', fontWeight: '700' },
  postBtnMarketplace: { backgroundColor: '#4f46e5', borderWidth: 1, borderColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  postBtnRide: { backgroundColor: '#059669', borderWidth: 1, borderColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  postBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentScroll: { padding: 16 },
  section: { gap: 12 },
  categoryBar: { flexDirection: 'row', marginBottom: 6, flexGrow: 0 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', marginRight: 6 },
  activeCategoryChip: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  activeCategoryChipRide: { backgroundColor: '#059669', borderColor: '#10b981' },
  categoryChipText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activeCategoryChipText: { color: '#ffffff', fontWeight: '700' },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#131924', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  categoryBadge: { color: '#38bdf8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  conditionBadge: { color: '#818cf8', fontSize: 10, fontWeight: '600', backgroundColor: '#1e1b4b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rideBadge: { color: '#34d399', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  seatsBadge: { color: '#f59e0b', fontSize: 10, fontWeight: '700', backgroundColor: '#451a03', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dateText: { color: '#64748b', fontSize: 10 },
  saveBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0b0f17', padding: 8, borderRadius: 8, marginBottom: 8 },
  routeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  priceText: { color: '#34d399', fontSize: 14, fontWeight: '800' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  chatBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  actionGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  joinBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  joinedBtn: { backgroundColor: '#064e3b', borderWidth: 1, borderColor: '#10b981' },
  fullBtn: { backgroundColor: '#1e293b' },
  joinBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  joinedBtnText: { color: '#34d399' },
  ownerBadge: { backgroundColor: '#1e1b4b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  ownerBadgeText: { color: '#818cf8', fontSize: 10, fontWeight: '700' },
});
