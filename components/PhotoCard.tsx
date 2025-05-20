import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { SharedElement } from 'react-navigation-shared-element';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa kiểu Photo khớp với API
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

// Định nghĩa kiểu props cho PhotoCard
interface PhotoCardProps {
  photo: Photo;
  onPress: (photo: Photo) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onPress }) => {
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => onPress(photo)}
    >
      <SharedElement id={`photo.${photo.id}.image`} style={styles.imageContainer}>
        <Animated.Image 
          source={{ uri: photo.imageUrl }} 
          style={[styles.image, { transform: [{ scale }] }]}
          resizeMode="cover"
        />
      </SharedElement>
      
      <View style={styles.infoContainer}>
        <Text style={styles.description} numberOfLines={2}>
          {photo.description}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.username}>{photo.user.name}</Text>
          
          <View style={styles.likesContainer}>
            <Ionicons name="heart" size={16} color="#ff4757" />
            <Text style={styles.likes}>{photo.likes}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 12,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likes: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default PhotoCard;