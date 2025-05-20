import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from '../services/socketService';

// Define chat type theo mô hình dữ liệu từ tài liệu
type Chat = {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
};

// Define navigation parameter list
type RootStackParamList = {
  Chat: {
    recipient: string;
    email: string;
    userId: string;
    chatId: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

const ChatListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Khai báo messageListener và unmountedRef
  const messageListenerRef = useRef<(() => void) | null>(null);
  const unmountedRef = useRef(false);

  // Lấy ID người dùng hiện tại
  useEffect(() => {
    fetchCurrentUserId();
  }, []);

  // Tự động làm mới danh sách chat khi quay lại màn hình này
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        fetchChats();
      }
    }, [currentUserId])
  );

  // Khi currentUserId được load (lần đầu), lấy danh sách chat
  useEffect(() => {
    if (currentUserId) {
      fetchChats();
    }
  }, [currentUserId]);

  const fetchCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        // Lấy id hoặc _id trong trường hợp API trả về
        const id = parsedData._id ?? parsedData.id;
        setCurrentUserId(id);
      }
    } catch (err) {
      console.error('Error fetching current user ID:', err);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userToken = await AsyncStorage.getItem('accessToken');
      
      if (!userToken) {
        throw new Error('Bạn cần đăng nhập để xem tin nhắn');
      }
      
      // Gọi API lấy danh sách chat theo tài liệu
      const response = await axios.get(`${API_URL}/v1/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      // Xử lý dữ liệu trả về, có thể là mảng hoặc object với trường chats/data
      const payload = response.data;
      const chatsList: Chat[] = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as any).chats)
        ? (payload as any).chats
        : Array.isArray((payload as any).data)
        ? (payload as any).data
        : [];
      console.log('Fetched chats:', chatsList);
      setChats(chatsList);
      // Join all chat rooms so this screen receives new message events
      if (socketService.isConnected()) {
        chatsList.forEach((c) => socketService.joinChat(c._id));
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Không thể tải danh sách trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy tên participant còn lại (ngoại trừ currentUser)
  const getOtherParticipantName = useCallback(
    (participants: Chat['participants']) => {
      const other = participants.find(p => p._id !== currentUserId) || participants[0];
      return other?.name || '';
    },
    [currentUserId]
  );

  const handleChatPress = (chat: Chat) => {
    // Tìm người tham gia khác (không phải người dùng hiện tại)
    const otherParticipant = chat.participants.find(p => p._id !== currentUserId) || chat.participants[0];
    
    navigation.navigate('Chat', {
      recipient: otherParticipant.name,
      email: otherParticipant.email,
      userId: otherParticipant._id,
      chatId: chat._id
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within last week, show day name
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    // Lấy tên participant còn lại
    const otherName = getOtherParticipantName(item.participants);
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>
            {otherName.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {otherName || 'Unknown User'}
            </Text>
            <Text style={styles.chatTime}>
              {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ''}
            </Text>
          </View>
          
          <Text style={styles.chatPreview} numberOfLines={1}>
            {item.lastMessage?.text || 'Chưa có tin nhắn'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
        <Text style={styles.emptySubtext}>Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây</Text>
      </View>
    );
  };

  // Thiết lập socket listeners
  useEffect(() => {
    // Đánh dấu component đã mount
    unmountedRef.current = false;
    
    // Kết nối socket khi component mount
    const initializeSocket = async () => {
      if (!socketService.isConnected()) {
        await socketService.connect();
      }
      
      // Lắng nghe sự kiện tin nhắn mới
      if (messageListenerRef.current) {
        messageListenerRef.current(); // Hủy listener cũ nếu có
      }
      
      // Đăng ký listener mới
      messageListenerRef.current = socketService.onMessage((newMessage) => {
        console.log('New message received in chat list:', newMessage);
        // Cập nhật lại danh sách chat khi có tin nhắn mới
        if (!unmountedRef.current) {
          fetchChats();
        }
      });
    };
    
    initializeSocket();
    
    // Cleanup khi component unmount
    return () => {
      unmountedRef.current = true;
      if (messageListenerRef.current) {
        messageListenerRef.current();
        messageListenerRef.current = null;
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchChats}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChats}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          extraData={currentUserId}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={renderEmptyList}
          onRefresh={fetchChats}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

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
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
  chatList: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChatListScreen;