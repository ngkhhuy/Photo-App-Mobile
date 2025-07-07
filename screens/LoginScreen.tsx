import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

interface LoginForm {
  email: string;
  password: string;
}

const LoginScreen: React.FC = ({ navigation }: any) => {
  const [formData, setFormData] = useState<LoginForm>({ email: '', password: '' });

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/v1/users/login`, {
        email: formData.email,
        password: formData.password,
      });
      
      const token = response.data.accessToken;
      
      // Lưu token với cả hai key để đảm bảo tương thích với mọi nơi trong ứng dụng
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('token', token);
      
      // Lưu user với token đi kèm để đề phòng
      const userData = {
        ...response.data.user,
        token: token
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      Alert.alert(
        'Success',
        'Login successful!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset navigation để không còn có thể quay lại trang đăng nhập sau khi đăng nhập
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            },
          },
        ]
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        Alert.alert('Error', 'Invalid email or password');
      } else if (error instanceof AxiosError && error.request) {
        Alert.alert('Error', 'No response from server. Please check your connection.');
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        </View>
        <Text style={styles.title}>FlickShare</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>


          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8faff',
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#e1e4e8',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 20,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  signupText: {
    color: '#666',
  },
  signupLink: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default LoginScreen;
