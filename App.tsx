import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StackScreenProps } from '@react-navigation/stack';
import BottomTabs from './navigation/bottomTabs';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import PhotoDetailScreen from './screens/PhotoDetailScreen';
import UploadScreen from './screens/UploadScreen';
import SearchScreen from './screens/SearchScreen';
import ChatScreen from './screens/ChatScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatListScreen from './screens/ChatListScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

// Định nghĩa kiểu Photo cho PhotoDetail
interface Photo {
  id: string;
  imageUrl: string;
  description: string;
  keywords: string[];
  user: {
    name: string;
    email: string;
  };
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa kiểu cho Stack Navigator
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Home: undefined;
  PhotoDetail: { photo: Photo };
  Search: undefined;
  Add: undefined;
  Chat: { 
    recipient?: string, 
    email?: string, 
    userId?: string, 
    chatId?: string,
    user?: { name: string; email: string; _id?: string; id?: string } 
  };
  Profile: undefined;
  UserProfile: { user: { name: string; email: string; _id?: string; id?: string } };
  ChatList: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

// Define props type for PhotoDetailScreen
export type PhotoDetailScreenProps = StackScreenProps<RootStackParamList, 'PhotoDetail'>;

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome" // Đổi thành Welcome để hiển thị màn hình Welcome trước
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen as React.ComponentType}/>
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Add" component={UploadScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen}/>
        <Stack.Screen name="UserProfile" component={UserProfileScreen as React.ComponentType} />
        <Stack.Screen name="Chat" component={ChatScreen as React.ComponentType} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}