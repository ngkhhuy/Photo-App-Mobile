// screens/UserProfileScreen.tsx
import React, { useState, useEffect } from 'react'; // Thêm useEffect
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,     // Thêm FlatList để hiển thị grid ảnh
  Dimensions,   // Thêm Dimensions để tính toán kích thước
  ScrollView    // Thêm ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  UserProfile: { user: { name: string; email: string; _id?: string; id?: string } };
  Chat: { 
    recipient?: string; 
    email?: string; 
    userId?: string;
    chatId?: string;
    user?: { name: string; email: string; _id?: string; id?: string }
  };
  Login: {}; // Add the Login screen to the type definition
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = route.params;
  const [loading, setLoading] = useState(false);
  
  // Thêm state để lưu trữ ảnh và loading state cho ảnh
  const [photos, setPhotos] = useState<Array<{ id: string; imageUrl: string; description?: string }>>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  
  // Sửa đổi hàm fetchUserPublicPhotos
  const fetchUserPublicPhotos = async () => {
    try {
      setPhotosLoading(true);
      
      // Lấy access token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      
      // Lấy user ID
      const userId = user._id || user.id;
      if (!userId) {
        throw new Error('Không tìm thấy ID người dùng');
      }
      
      console.log('Fetching photos for user ID:', userId);
      
      // Cách dùng endpoint chính xác cho user khác
      try {
        const response = await axios.get(`${API_URL}/v1/photos/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            isPublic: true  // Chỉ lấy ảnh công khai
          }
        });
        
        console.log('API response:', response.data);
        
        if (response.data && response.data.photos && Array.isArray(response.data.photos)) {
          const transformedPhotos = response.data.photos.map((photo: any) => ({
            id: photo._id || photo.id,
            imageUrl: photo.imageUrl,
            description: photo.description
          }));
          
          // ĐÂY LÀ PHẦN QUAN TRỌNG: Đặt state photos
          setPhotos(transformedPhotos);
          return; // Thoát nếu API thứ nhất thành công
        }
      } catch (specificApiError) {
        console.log('Specific endpoint failed, trying alternative:', specificApiError);
      }
      
      // Cách dùng endpoint từ ProfileScreen (điều chỉnh cho user khác)
      const response = await axios.get(`${API_URL}/v1/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          // Thử nhiều tham số khác nhau vì có thể backend chấp nhận các tên khác nhau
          userId: userId,
          ownerId: userId,
          authorId: userId,
          // Quan trọng: chỉ lấy ảnh công khai
          isPublic: true
        }
      });
      
      if (response.data && response.data.photos && Array.isArray(response.data.photos)) {
        // Lọc thêm ở phía client để đảm bảo chỉ lấy ảnh của người dùng đang xem
        const filteredPhotos = response.data.photos.filter(
          (photo: any) => (photo.user?._id === userId || photo.user?.id === userId || photo.userId === userId || photo.ownerId === userId)
        );
        
        const transformedPhotos = filteredPhotos.map((photo: any) => ({
          id: photo._id || photo.id,
          imageUrl: photo.imageUrl,
          description: photo.description
        }));
        
        setPhotos(transformedPhotos);
      } else {
        setPhotos([]); // Đặt mảng rỗng nếu không có dữ liệu
      }
    } catch (error) {
      console.error('Lỗi khi lấy ảnh người dùng:', error);
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };
  
  // Gọi fetch ảnh khi component mount
  useEffect(() => {
    fetchUserPublicPhotos();
  }, [user]);
  
  // Tính toán kích thước thumbnail cho grid
  const { width } = Dimensions.get('window');
  const imageSize = (width - 48) / 3; // 3 ảnh mỗi hàng, padding 16px ở mỗi bên và gap 8px

  const handleChatPress = async () => {
    try {
      setLoading(true);
      
      // Thêm key 'accessToken' vào danh sách kiểm tra
      let userToken = await AsyncStorage.getItem('accessToken');
      console.log("Token từ accessToken:", userToken ? "Tìm thấy" : "Không tìm thấy");
      
      // Kiểm tra các key khác nếu cần
      if (!userToken) {
        userToken = await AsyncStorage.getItem('token');
        console.log("Token từ token:", userToken ? "Tìm thấy" : "Không tìm thấy");
      }
      
      if (!userToken) {
        userToken = await AsyncStorage.getItem('userToken');
        console.log("Token từ userToken:", userToken ? "Tìm thấy" : "Không tìm thấy");
      }
      
      // Kiểm tra từ user object trong storage
      if (!userToken) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            console.log("Dữ liệu user:", parsedUserData);
            
            // Kiểm tra token trong user object
            if (parsedUserData.accessToken) {
              userToken = parsedUserData.accessToken;
              console.log("Tìm thấy token trong user.accessToken");
            } else if (parsedUserData.token) {
              userToken = parsedUserData.token;
              console.log("Tìm thấy token trong user.token");
            }
          } catch (e) {
            console.error("Lỗi khi parse user data:", e);
          }
        }
      }
      
      // Nếu vẫn không tìm được token
      if (!userToken) {
        console.log("Tất cả các phương thức lấy token đều thất bại");
        // Hiển thị cửa sổ đăng nhập...
        Alert.alert(
          'Lỗi xác thực',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => {
                // Điều hướng người dùng về màn hình đăng nhập
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                });
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Kiểm tra token có giá trị hợp lệ
      if (typeof userToken !== 'string' || userToken.trim() === '') {
        throw new Error('Token không hợp lệ');
      }
      
      // Tiếp tục xử lý với token hợp lệ
      // Lấy user ID từ _id hoặc id
      const userId = user._id || user.id;
      console.log('User ID được sử dụng:', userId);
      
      let chatData;
      
      // Tạo cuộc trò chuyện với userId
      if (userId) {
        console.log('Tạo cuộc trò chuyện với userId:', userId);
        
        const response = await axios.post(
          `${API_URL}/v1/chats`,
          { participants: [userId] },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            }
          }
        );
        
        chatData = response.data;
        console.log('Tạo cuộc trò chuyện thành công:', chatData);
      } else {
        throw new Error('Không tìm thấy userId hợp lệ');
      }
      
      // Thêm log trước khi chuyển hướng để debug
      console.log('Chuẩn bị chuyển đến Chat screen với dữ liệu:', {
        chatId: chatData._id || chatData.id,
        recipient: user.name,
        email: user.email,
        userId: userId
      });
      
      // Chuyển hướng đến màn hình Chat với đầy đủ tham số
      navigation.navigate('Chat', {
        chatId: chatData._id || chatData.id,
        recipient: user.name,
        email: user.email, 
        userId: userId
      });
      
    } catch (error) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', error);
      
      let errorMessage = 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token hết hạn hoặc không hợp lệ
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          
          // Xóa token không hợp lệ
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userToken');
          
          // Thêm nút đăng nhập lại
          Alert.alert(
            'Lỗi xác thực',
            errorMessage,
            [
              {
                text: 'Đăng nhập',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }]
                  });
                }
              }
            ]
          );
          setLoading(false);
          return;
        } else if (error.response) {
          errorMessage = `Lỗi (${error.response.status}): ${error.response.data?.message || 'Vui lòng thử lại sau'}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // Thay đổi phần return, thêm grid ảnh vào cuối View content
  return (
    <SafeAreaView style={styles.container}>
      {/* Giữ nguyên StatusBar và header */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin người dùng</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Giữ nguyên phần profile header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Tên</Text>
              <Text style={styles.value}>{user.name}</Text>

              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>
          
          {/* Giữ nguyên nút chat */}
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={handleChatPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Nhắn tin</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Thêm phần hiển thị ảnh của người dùng */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>Ảnh công khai</Text>
            
            {photosLoading ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : photos.length > 0 ? (
              <FlatList
                data={photos}
                keyExtractor={item => item.id}
                numColumns={3}
                scrollEnabled={false} // Thêm dòng này để tắt scroll riêng của FlatList
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.photoItem, { width: imageSize, height: imageSize }]}
                  >
                    <Image 
                      source={{ uri: item.imageUrl }} 
                      style={styles.photoImage}
                    />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.photoGrid}
              />
            ) : (
              <Text style={styles.noPhotosText}>Người dùng này chưa có ảnh công khai nào</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Thêm styles mới cho phần hiển thị ảnh
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  chatButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  photosSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  photoGrid: {
    gap: 8,
  },
  photoItem: {
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPhotosText: {
    textAlign: 'center',
    color: '#666',
    padding: 16,
  },
});

export default UserProfileScreen;