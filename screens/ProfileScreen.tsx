import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, Platform, Alert, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiService';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useNavigation, useFocusEffect, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  
  const [profile, setProfile] = useState<{ name: string; username: string; id: string } | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [photos, setPhotos] = useState<Array<{ id: string; imageUrl: string; description?: string; isPublic?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Array<{ id: string; imageUrl: string; description?: string; isPublic?: boolean }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Thêm các state mới để quản lý animation
  const [activeTab, setActiveTab] = useState('grid');
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  
  // Hàm xử lý chuyển tab với animation
  const handleTabChange = (newTab: 'grid' | 'bookmark' | 'heart') => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setActiveTab(newTab);
      
      // Reset slide position cho tab mới
      slideAnim.setValue(newTab === 'grid' ? 0 : newTab === 'bookmark' ? 1 : 2);
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Kiểm tra xem có authentication 
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('No access token found');
          navigation.navigate('Login');
          return;
        }
        
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          console.log('No user data found');
          navigation.navigate('Login');
          return;
        }
        
        const user = JSON.parse(userData);
        const userId = user._id ?? user.id;
        setProfile({ name: user.name, username: '@'+user.email.split('@')[0], id: userId });
        // Fetch user's photos
        fetchPhotos();
      } catch (err) {
        console.error('Error loading profile:', err);
        Alert.alert('Error', 'Could not load profile. Please login again.');
        navigation.navigate('Login');
      }
    };
    loadProfile();
  }, [navigation]);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      
      // Lấy token xác thực
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Sử dụng endpoint chính xác với pagination
      const response = await axios.get(`${API_URL}/v1/photos/my-photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          limit: 20 // Adjust based on your needs
        }
      });
      
      console.log('Photos response status:', response.status);
      console.log('Photos response data:', response.data);
      
      if (!response.data || !response.data.photos || !Array.isArray(response.data.photos)) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      // Transform the data to match your expected format
      const transformedPhotos = response.data.photos.map((photo: { 
        _id: string;
        imageUrl: string;
        description?: string;
        isPublic?: boolean;
      }) => ({
        id: photo._id,  // Map MongoDB's _id to your expected id field
        imageUrl: photo.imageUrl,
        description: photo.description,
        isPublic: photo.isPublic
      }));
      
      setPhotos(transformedPhotos);
      setPostsCount(transformedPhotos.length); // Update post count
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      
      // Hiển thị thông tin lỗi chi tiết hơn
      if (error.response) {
        // Lỗi server trả về
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
          handleLogout();
          return;
        }
      }
      
      Alert.alert('Error', 'Could not load your photos. Please try again later.');
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function after fetchPhotos
  const [likedPhotosLoading, setLikedPhotosLoading] = useState(false);

  const fetchLikedPhotos = async () => {
    try {
      setLikedPhotosLoading(true); // Use a separate loading state
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get all photos (will include public photos + own photos)
      const response = await axios.get(`${API_URL}/v1/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          limit: 50 // Higher limit to get more photos
        }
      });
      
      if (!response.data || !response.data.photos || !Array.isArray(response.data.photos)) {
        throw new Error('Invalid response format from server');
      }
      
      // Filter only photos that the current user has liked
      const liked = response.data.photos.filter((photo: {
        _id: string; 
        imageUrl: string;
        description?: string;
        isPublic?: boolean;
        likedBy?: string[];
      }) => 
        photo.likedBy && profile && photo.likedBy.includes(profile.id)
      );
      
      const transformedPhotos = liked.map((photo: {
        _id: string;
        imageUrl: string;
        description?: string;
        isPublic?: boolean;
        likedBy?: string[];
      }) => ({
        id: photo._id,
        imageUrl: photo.imageUrl,
        description: photo.description,
        isPublic: photo.isPublic
      }));
      
      setLikedPhotos(transformedPhotos);
    } catch (error) {
      console.error('Error fetching liked photos:', error);
      Alert.alert('Error', 'Could not load your liked photos');
      setLikedPhotos([]);
    } finally {
      setLikedPhotosLoading(false); // Update separate loading state
    }
  };

  // Add this useEffect to handle fetching liked photos when the tab changes
  useEffect(() => {
    if (activeTab === 'heart') {
      fetchLikedPhotos();
    }
  }, [activeTab]);

  // Navigation already declared at the top

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await api.delete(`/v1/users/logout`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const showSettingsMenu = () => {
    Alert.alert(
      'Settings',
      '',
      [
        { text: 'Profile Settings', onPress: () => {} },
        { text: 'Help & Support', onPress: () => {} },
        { text: 'Logout', style: 'destructive', onPress: handleLogout },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const toggleVisibility = async (id: string) => {
    try {
      const target = photos.find(p => p.id === id);
      if (!target) return;
      const res = await api.patch(`/v1/photos/${id}/visibility`, { isPublic: !target.isPublic });
      const updated = res.data.photo;
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, isPublic: updated.isPublic } : p));
      Alert.alert('Success', 'Cập nhật quyền riêng tư thành công');
    } catch (err) {
      console.error('Toggle visibility error:', err);
      Alert.alert('Error', 'Không thể cập nhật quyền riêng tư');
    }
  };

  const handlePhotoLongPress = (photo: { id: string; isPublic?: boolean }) => {
    Alert.alert(
      'Photo Options',
      'What would you like to do with this photo?',
      [
        {
          text: photo.isPublic ? 'Make Private' : 'Make Public',
          onPress: () => toggleVisibility(photo.id)
        },
        {
          text: 'Delete Photo',
          style: 'destructive',
          onPress: () => {
            // Show confirmation dialog before deleting
            Alert.alert(
              'Confirm Delete',
              'Are you sure you want to delete this photo? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(photo.id) }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const deletePhoto = async (id: string) => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Call the delete API endpoint
      await axios.delete(`${API_URL}/v1/photos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Remove the deleted photo from state
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== id));
      // Update posts count
      setPostsCount(prevCount => prevCount - 1);
      
      Alert.alert('Success', 'Photo deleted successfully');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
          handleLogout();
          return;
        }
      }
      
      Alert.alert('Error', 'Could not delete the photo. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Skip if we're already loading or don't have a profile yet
      if (!isLoading && profile) {
        fetchPhotos();
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [profile]) // Depend on profile to avoid unnecessary fetches
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPhotos().then(() => {
      setRefreshing(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={showSettingsMenu}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading your photos...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor={'#2196F3'}
          />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{profile?.name.charAt(0) ?? ''}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name}</Text>
              <Text style={styles.profileUsername}>{profile?.username}</Text>
              <TouchableOpacity style={styles.editProfileButton}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postsCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
            onPress={() => handleTabChange('grid')}
          >
            <Ionicons name="grid-outline" size={22} color={activeTab === 'grid' ? "#2196F3" : "#999"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bookmark' && styles.activeTab]}
            onPress={() => handleTabChange('bookmark')}
          >
            <Ionicons name="bookmark-outline" size={22} color={activeTab === 'bookmark' ? "#2196F3" : "#999"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'heart' && styles.activeTab]}
            onPress={() => handleTabChange('heart')}
          >
            <Ionicons name="heart-outline" size={22} color={activeTab === 'heart' ? "#2196F3" : "#999"} />
          </TouchableOpacity>
          
          {/* Animated indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: ['0%', '100%', '200%']
                    })
                  }
                ]
              }
            ]}
          />
        </View>

        <Animated.View style={[styles.photosGrid, { opacity: fadeAnim }]}>
          {activeTab === 'grid' && photos.map((photo) => (
            <TouchableOpacity 
              key={photo.id} 
              style={styles.photoItem}
              onLongPress={() => handlePhotoLongPress(photo)}
              onPress={() => navigation.navigate('PhotoDetail', { 
                photoId: photo.id,
                photo: {
                  _id: photo.id,
                  imageUrl: photo.imageUrl,
                  description: photo.description || "",
                  isPublic: photo.isPublic || false,
                  // Thêm các thuộc tính cần thiết như ở Heart Tab
                  user: {
                    _id: profile?.id || "",
                    name: profile?.name || "",
                    email: profile?.username?.substring(1) || "" // Loại bỏ @ từ username
                  },
                  likes: 0,
                  keywords: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              })}
            >
              <View style={styles.photoCard}>
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <View style={styles.photoInfo}>
                  {/* Toggle visibility badge */}
                  <TouchableOpacity onPress={() => toggleVisibility(photo.id)}>
                    <View style={[
                      styles.visibilityBadge,
                      photo.isPublic ? styles.publicBadge : styles.privateBadge
                    ]}>
                      <Text style={styles.visibilityText}>
                        {photo.isPublic ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {activeTab === 'heart' && (
            likedPhotosLoading ? (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading liked photos...</Text>
              </View>
            ) : (
              likedPhotos.map((photo) => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoItem}
                  onPress={() => navigation.navigate('PhotoDetail', { 
                    photoId: photo.id,
                    photo: {
                      _id: photo.id,
                      imageUrl: photo.imageUrl,
                      description: photo.description || "",
                      isPublic: photo.isPublic || false,
                      // Add these required properties
                      user: {
                        _id: profile?.id || "",
                        name: profile?.name || "",
                        email: profile?.username?.substring(1) || "" // Remove @ from username
                      },
                      likes: 0,
                      keywords: [],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }
                  })}
                >
                  <View style={styles.photoCard}>
                    <Image
                      source={{ uri: photo.imageUrl }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoInfo}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.photoDescription}>{photo.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}
          
          {activeTab === 'bookmark' && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="bookmark" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No bookmarked photos yet</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 60, 
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  editProfileButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontWeight: '500',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    position: 'relative', // For absolute positioning of the indicator
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '33.33%', // Width of each tab (3 tabs)
    height: 2,
    backgroundColor: '#2196F3',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 0, // Bỏ padding cho container
  },
  photoItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2, // Giảm padding xuống còn 2
    marginBottom: 4, // Giảm margin
  },
  photoCard: {
    flex: 1,
    borderRadius: 0, // Bỏ bo tròn để tận dụng tối đa không gian
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,  // Bỏ shadow để tránh việc lấy thêm không gian
    shadowRadius: 0,
    elevation: 1, // Giảm elevation
  },
  photoImage: {
    width: '100%',
    height: '82%', // Tăng chiều cao ảnh
    backgroundColor: '#f1f1f1',
  },
  photoInfo: {
    padding: 2, // Giảm padding
    height: '18%',
    justifyContent: 'center',
  },
  photoDescription: {
    fontSize: 12, // Giảm kích thước chữ xuống
    color: '#333',
    marginBottom: 2,
  },
  visibilityBadge: {
    alignSelf: 'flex-start', // Căn lề bên trái
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  publicBadge: {
    backgroundColor: '#4CAF50',
  },
  privateBadge: {
    backgroundColor: '#F44336',
  },
  visibilityText: {
    fontSize: 10, // Giảm kích thước chữ xuống
    color: '#fff',
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
    width: '100%',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default ProfileScreen;
