import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/config';
import axios from 'axios';
import * as Linking from 'expo-linking';

const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Get the verification code from route params
  const resetCode = route.params?.code || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeInput, setCodeInput] = useState(resetCode);

  // Function to verify token from deep link
  const verifyToken = async () => {
    try {
      const token = route.params?.token;
      if (!token) return;
      
      // Call API to verify the reset token
      const response = await axios.post(`${API_URL}/v1/users/verify-reset-token`, {
        token: token
      });
      
      // If the API returns a code, use it for password reset
      if (response.data && response.data.code) {
        setCodeInput(response.data.code);
      }
    } catch (error: any) {
      console.error('Token verification error:', error);
      setErrorMessage('Token không hợp lệ hoặc đã hết hạn.');
    }
  };

  // Validate password according to API requirements
  const isValidPassword = (pass: string) => {
    return pass.length >= 6; // API requires minimum 6 characters
  };

  // Handle reset password
  const handleResetPassword = async () => {
    // Reset states
    setErrorMessage(null);
    
    // Validate input
    if (!codeInput || !password || !confirmPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    if (!isValidPassword(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to reset password with verification code
      await axios.post(`${API_URL}/v1/users/reset-password`, {
        code: codeInput,
        password: password
      });
      
      // Show success message
      setSuccess(true);
      
      // Navigate to login after delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
      } else {
        setErrorMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Check if verification code is missing
  if (!resetCode) {
    Alert.alert(
      "Lỗi xác thực", 
      "Không tìm thấy mã xác thực. Vui lòng thực hiện lại quá trình quên mật khẩu.",
      [{ text: "Quay lại", onPress: () => navigation.goBack() }]
    );
  }

  // Handle deep link
  useEffect(() => {
    // Xử lý khi được mở từ deep link
    const handleDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const { queryParams } = Linking.parse(initialUrl);
        if (queryParams?.token) {
          // Có token từ deep link, sử dụng nó
          route.params = route.params || {};
          route.params.token = queryParams.token;
          // Kích hoạt useEffect chứa reset token
          verifyToken();
        }
      }
    };

    handleDeepLink();

    // Lắng nghe deep link khi app đang chạy
    const subscription = Linking.addEventListener('url', (event) => {
      const { queryParams } = Linking.parse(event.url);
      if (queryParams?.token) {
        route.params = route.params || {};
        route.params.token = queryParams.token;
        verifyToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đặt lại mật khẩu</Text>
            <View style={styles.headerRight} />
          </View>
          
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={success ? "checkmark-circle-outline" : "lock-closed-outline"} size={80} color={success ? "#4CAF50" : "#2196F3"} />
            </View>
            
            {!success ? (
              <>
                <Text style={styles.title}>Tạo mật khẩu mới</Text>
                
                <Text style={styles.description}>
                  Vui lòng tạo mật khẩu mới cho tài khoản của bạn.
                </Text>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mã xác thực (6 chữ số)"
                    value={codeInput}
                    onChangeText={setCodeInput}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu mới"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.passwordRequirement}>
                  Mật khẩu phải có ít nhất 6 ký tự
                </Text>
                
                <View style={styles.infoBox}>
                  <Ionicons name="time-outline" size={20} color="#1976D2" style={{marginRight: 8}} />
                  <Text style={styles.infoText}>
                    Mã xác thực có hiệu lực trong 15 phút kể từ khi yêu cầu
                  </Text>
                </View>
                
                {errorMessage && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}
                
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Thành công!</Text>
                <Text style={styles.successText}>
                  Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginRight: 40,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  passwordRequirement: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    fontSize: 14,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  linkContainer: {
    marginTop: 24,
    paddingVertical: 8,
  },
  linkText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#0d47a1',
    flex: 1,
  }
});

export default ResetPasswordScreen;