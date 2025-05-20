import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform, Alert, Image, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import api from '../services/apiService';

const UploadScreen = ({ navigation }: { navigation: any }) => {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublic, setIsPublic] = useState(true); // Default to public

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // TODO: Update to MediaType when upgrading expo-image-picker
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Tắt tính năng chỉnh sửa để giữ ảnh nguyên bản
        // aspect: [4, 3], // Bỏ tỷ lệ cố định để giữ nguyên tỷ lệ ảnh gốc
        quality: 1.0, // Giữ chất lượng tối đa
        exif: true, // Giữ lại metadata EXIF nếu cần
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please add a description');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Ensure user is authenticated
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You need to be logged in to upload photos');
        return;
      }
      
      console.log('Original URI:', image.uri);
      let uploadUri = image.uri;
      
      // Xử lý đặc biệt cho Android
      if (Platform.OS === 'android') {
        try {
          // Luôn copy ảnh vào cache trên Android để đảm bảo có thể access được
          const fsUri = FileSystem.cacheDirectory + (image.fileName || `photo_${Date.now()}.jpg`);
          await FileSystem.copyAsync({ 
            from: uploadUri, 
            to: fsUri 
          });
          uploadUri = fsUri;
          console.log('Converted URI:', uploadUri);
          
          // Kiểm tra xem file có tồn tại không
          const fileInfo = await FileSystem.getInfoAsync(uploadUri);
          if (!fileInfo.exists) {
            throw new Error('File does not exist after copying');
          }
          console.log('File info:', fileInfo);
        } catch (err) {
          console.error('Error preparing file:', err);
          Alert.alert('Error', 'Failed to prepare image for upload. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      let response;
      
      // Sử dụng FileSystem.uploadAsync cho Android
      if (Platform.OS === 'android') {
        // Chuẩn bị parameters cho uploadAsync
        const options = {
          uploadUrl: `${api.defaults.baseURL}/v1/photos/upload`,
          fieldName: 'image',
          mimeType: image.type || 'image/jpeg',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          parameters: {
            description,
            keywords: keywords || '',
            isPublic: isPublic.toString()
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        };
        
        // Gọi uploadAsync với đúng cú pháp
        const uploadResult = await FileSystem.uploadAsync(options.uploadUrl, uploadUri, {
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType: image.type || 'image/jpeg',
          parameters: {
            description,
            keywords: keywords || '',
            isPublic: isPublic.toString()
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        });
        console.log('Upload result:', uploadResult);
        
        // Xử lý kết quả trả về từ uploadAsync
        if (uploadResult.status >= 200 && uploadResult.status < 300) {
          response = { status: uploadResult.status, data: JSON.parse(uploadResult.body) };
        } else {
          throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
        }
      } 
      // Sử dụng axios cho iOS
      else {
        // Prepare multipart form data cho iOS
        const formData = new FormData();
        formData.append('image', {
          uri: uploadUri,
          name: image.fileName || `photo_${Date.now()}.jpg`,
          type: image.type || 'image/jpeg',
        } as any);
        formData.append('description', description);
        formData.append('keywords', keywords || '');
        formData.append('isPublic', isPublic.toString());
        
        // Gọi API với axios
        response = await api.post(
          '/v1/photos/upload',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const prog = Math.round((e.loaded * 100) / (e.total ?? 1));
              setUploadProgress(prog);
            },
          }
        );
      }
      
      if (response.status >= 200 && response.status < 300) {
        Alert.alert('Success', 'Photo uploaded successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setImage(null);
              setDescription('');
              setKeywords('');
              setUploadProgress(0);
              navigation.navigate('Profile');
            },
          },
        ]);
      } else {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Xử lý lỗi từ expo-file-system
      let errorMessage = 'An unexpected error occurred while uploading';
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Thêm hàm xử lý hủy upload
  const handleCancel = () => {
    // Hiển thị hộp thoại xác nhận nếu đã nhập thông tin
    if (image || description || keywords) {
      Alert.alert(
        "Hủy Upload",
        "Bạn có chắc muốn hủy? Thông tin đã nhập sẽ bị mất.",
        [
          {
            text: "Tiếp tục chỉnh sửa",
            style: "cancel"
          },
          {
            text: "Hủy Upload",
            style: "destructive",
            onPress: () => {
              // Reset tất cả các state
              setImage(null);
              setDescription('');
              setKeywords('');
              setUploadProgress(0);
              setIsPublic(true);
              
              // Quay về màn hình trước đó
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      // Nếu chưa nhập thông tin gì thì không cần xác nhận
      navigation.goBack();
    }
  };

  // Thay đổi header để thêm nút Cancel
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Upload Photo</Text>
        
        <TouchableOpacity 
          style={[styles.uploadButton, (!image || !description || isLoading) && styles.disabledButton]}
          onPress={handleUpload}
          disabled={!image || !description || isLoading}
        >
          <Text style={styles.uploadButtonText}>
            {isLoading ? 'Uploading...' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.photoSelectContainer}>
        <TouchableOpacity 
          style={styles.photoPlaceholder}
          onPress={pickImage}
          disabled={isLoading}
        >
          {image ? (
            <>
              <Image 
                source={{ uri: image.uri }} 
                style={styles.selectedImage}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  {uploadProgress > 0 && (
                    <Text style={styles.progressText}>{uploadProgress}%</Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={40} color="#999" />
              <Ionicons name="add-outline" size={20} color="#999" style={styles.addIcon} />
              <Text style={styles.photoPlaceholderText}>Tap to select a photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.descriptionInput}
          placeholder="Add a description..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!isLoading}
        />

        <TextInput
          style={styles.descriptionInput}
          placeholder="Add keywords (comma separated)..."
          placeholderTextColor="#999"
          value={keywords}
          onChangeText={setKeywords}
          editable={!isLoading}
        />
        
        {/* Add visibility toggle */}
        <View style={styles.visibilityContainer}>
          <Text style={styles.visibilityLabel}>Make this photo public</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            disabled={isLoading}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isPublic ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        <Text style={styles.visibilityHint}>
          {isPublic 
            ? "Anyone can see this photo" 
            : "Only you can see this photo"}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0,
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
  uploadButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  photoSelectContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 76,
  },
  photoPlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  addIcon: {
    position: 'absolute',
    top: '50%',
    right: '50%',
    marginRight: -30,
    marginTop: -30,
  },
  photoPlaceholderText: {
    marginTop: 12,
    color: '#999',
    fontSize: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  visibilityLabel: {
    fontSize: 16,
    color: '#333',
  },
  visibilityHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default UploadScreen;