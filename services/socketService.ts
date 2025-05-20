import io, { Socket } from 'socket.io-client';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa các kiểu dữ liệu
type Message = {
  _id: string;
  text: string;
  sender: string;
  chat: string;
  createdAt: string;
  readBy: string[];
};

type TypingData = {
  user: string;
  name: string;
};

// Định nghĩa các callback handlers
type MessageHandler = (message: Message) => void;
type TypingHandler = (data: TypingData) => void;
type ErrorHandler = (error: Error) => void;
type ConnectionHandler = () => void;

class SocketService {
  private socket: typeof Socket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private stopTypingHandlers: TypingHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  
  // Khởi tạo kết nối Socket.IO
  public async connect(): Promise<void> {
    try {
      if (this.socket && this.socket.connected) {
        console.log('Socket is already connected');
        return;
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Auth token is required for socket connection');
      }
      
      // Khởi tạo kết nối socket với authentication theo tài liệu
      this.socket = io(API_URL, {
        auth: { token }, // Sử dụng auth object theo tài liệu
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      this.setupEventListeners();
      
    } catch (err) {
      console.error('Socket connection error:', err);
      this.notifyErrorHandlers(err as Error);
    }
  }
  
  // Thiết lập sự kiện lắng nghe
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.notifyConnectHandlers();
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.notifyDisconnectHandlers();
    });
    
    this.socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err);
      this.notifyErrorHandlers(err);
    });
    
    // Lắng nghe sự kiện tin nhắn mới theo tài liệu
    this.socket.on('message', (message: Message) => {
      this.notifyMessageHandlers(message);
    });
    
    // Lắng nghe sự kiện typing theo tài liệu
    this.socket.on('typing', (data: TypingData) => {
      this.notifyTypingHandlers(data);
    });
    
    this.socket.on('stopTyping', (data: TypingData) => {
      this.notifyStopTypingHandlers(data);
    });
  }
  
  // Tham gia phòng chat
  public joinChat(chatId: string): void {
    if (!this.socket) {
      console.error('Socket is not connected. Cannot join chat.');
      return;
    }
    
    this.socket.emit('joinChat', chatId);
    console.log(`Joined chat room: ${chatId}`);
  }
  
  // Rời phòng chat
  public leaveChat(chatId: string): void {
    if (!this.socket) {
      console.error('Socket is not connected. Cannot leave chat.');
      return;
    }
    
    this.socket.emit('leaveChat', chatId);
    console.log(`Left chat room: ${chatId}`);
  }
  
  // Gửi tin nhắn
  public sendMessage(chatId: string, text: string): void {
    if (!this.socket) {
      console.error('Socket is not connected. Cannot send message.');
      return;
    }
    
    this.socket.emit('sendMessage', { chatId, text });
  }
  
  // Gửi sự kiện typing
  public sendTyping(chatId: string): void {
    if (!this.socket) {
      console.error('Socket is not connected. Cannot send typing event.');
      return;
    }
    
    this.socket.emit('typing', { chatId });
  }
  
  // Gửi sự kiện stop typing
  public sendStopTyping(chatId: string): void {
    if (!this.socket) {
      console.error('Socket is not connected. Cannot send stop typing event.');
      return;
    }
    
    this.socket.emit('stopTyping', { chatId });
  }
  
  // Ngắt kết nối socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Kiểm tra trạng thái kết nối
  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
  
  // Đăng ký callback cho sự kiện tin nhắn mới
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    
    // Trả về hàm hủy đăng ký
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
  
  // Đăng ký callback cho sự kiện typing
  public onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.push(handler);
    
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }
  
  // Đăng ký callback cho sự kiện stop typing
  public onStopTyping(handler: TypingHandler): () => void {
    this.stopTypingHandlers.push(handler);
    
    return () => {
      this.stopTypingHandlers = this.stopTypingHandlers.filter(h => h !== handler);
    };
  }
  
  // Đăng ký callback cho sự kiện lỗi
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }
  
  // Đăng ký callback cho sự kiện kết nối
  public onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.push(handler);
    
    return () => {
      this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
    };
  }
  
  // Đăng ký callback cho sự kiện ngắt kết nối
  public onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.push(handler);
    
    return () => {
      this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
    };
  }
  
  // Thông báo tin nhắn mới đến tất cả handlers
  private notifyMessageHandlers(message: Message): void {
    this.messageHandlers.forEach(handler => handler(message));
  }
  
  // Thông báo sự kiện typing đến tất cả handlers
  private notifyTypingHandlers(data: TypingData): void {
    this.typingHandlers.forEach(handler => handler(data));
  }
  
  // Thông báo sự kiện stop typing đến tất cả handlers
  private notifyStopTypingHandlers(data: TypingData): void {
    this.stopTypingHandlers.forEach(handler => handler(data));
  }
  
  // Thông báo lỗi đến tất cả handlers
  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => handler(error));
  }
  
  // Thông báo kết nối đến tất cả handlers
  private notifyConnectHandlers(): void {
    this.connectHandlers.forEach(handler => handler());
  }
  
  // Thông báo ngắt kết nối đến tất cả handlers
  private notifyDisconnectHandlers(): void {
    this.disconnectHandlers.forEach(handler => handler());
  }
}

// Tạo và export instance singleton
const socketService = new SocketService();

export default socketService;