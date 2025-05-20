import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/config';
import axios from 'axios';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle forgot password request
  const handleSendCode = async () => {
    // Reset states
    setErrorMessage(null);
    
    // Validate input
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email');
      return;
    }
    
    if (!isValidEmail(email)) {
      setErrorMessage('Địa chỉ email không hợp lệ');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to request verification code
      const response = await axios.post(`${API_URL}/v1/users/forgot-password`, {
        email
      });
      
      // Show verification code input
      setCodeSent(true);
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Email không tồn tại trong hệ thống.');
      } else {
        setErrorMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      setErrorMessage('Vui lòng nhập mã xác thực');
      return;
    }
    
    // Navigate to reset password screen with the verification code
    navigation.navigate('ResetPassword', { code: verificationCode });
  };

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
            <Text style={styles.headerTitle}>Forgot password</Text>
            <View style={styles.headerRight} />
          </View>
          
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={codeSent ? "shield-checkmark-outline" : "lock-open-outline"} size={80} color="#2196F3" />
            </View>
            
            <Text style={styles.title}>
              {codeSent ? 'Enter the authentication code' : 'Password recovery'}
            </Text>
            
            <Text style={styles.description}>
              {codeSent
                ? 'Please enter the verification code sent to your email.'
                : 'Enter your registered email address to receive the verification code.'}
            </Text>
            
            {!codeSent ? (
              // Email input form
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                {errorMessage && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}
                
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Send authentication code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Verification code input form
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Authentication code"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                {errorMessage && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}
                
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Authentication</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>
                    Resend Authentication Code
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Back to Login</Text>
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
    marginBottom: 32,
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
  resendButton: {
    marginTop: 16,
    padding: 8,
  },
  resendButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
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
});

export default ForgotPasswordScreen;